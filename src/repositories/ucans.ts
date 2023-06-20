import * as Path from "../path/index.js"
import * as Storage from "../components/storage/implementation"
import * as Ucan from "../ucan/index.js"

import Repository, { RepositoryOptions } from "../repository.js"
import { DistinctivePath } from "../path/index.js"
import { SUPERUSER } from "@ucans/core"


export function create({ storage }: { storage: Storage.Implementation }): Promise<Repo> {
  return Repo.create({
    storage,
    storageName: storage.KEYS.UCANS
  })
}



// CLASS


export class Repo extends Repository<Ucan.Ucan> {

  private constructor(options: RepositoryOptions) {
    super(options)
  }


  // ENCODING

  fromJSON(a: string): Ucan.Ucan { return Ucan.decode(a) }
  toJSON(a: Ucan.Ucan): string { return Ucan.encode(a) }

  async toDictionary(items: Ucan.Ucan[]) {
    return await items.reduce(
      async (acc, ucan) => ({ ...(await acc), [ (await Ucan.cid(ucan)).toString() ]: ucan }),
      Promise.resolve({})
    )
  }


  // LOOKUPS

  accountDID(): string {
    const ucan = this.accountUcans()[ 0 ]
    if (!ucan) throw new Error("Did not find an account UCAN to derive the account DID from")
    return this.rootIssuer(ucan)
  }

  accountUcans(): Ucan.Ucan[] {
    return this.getAll().filter(ucan =>
      ucan.payload.att.some(cap => cap.with.scheme.match(/^https?$/))
    )
  }

  fsReadUcans(): Ucan.Ucan[] {
    return this.getAll().filter(ucan =>
      (ucan.payload.fct || []).some(f => {
        return Object.keys(f).some(a => a.startsWith("wnfs://"))
      })
    )
  }

  fsWriteUcans(): Ucan.Ucan[] {
    return this.getAll().filter(ucan =>
      ucan.payload.att.some(cap => cap.with.scheme === "wnfs")
    )
  }

  lookupFsReadUcan(
    did: string,
    path: DistinctivePath<Path.Segments>
  ): Ucan.Ucan | null {
    return this.lookupFsUcan(
      this.fsWriteUcans(),
      pathSoFar => ucan => {
        return (ucan.payload.fct || []).some(f => {
          return Object.keys(f).some(a => {
            const withoutScheme = a.replace("wnfs://", "")
            return withoutScheme === `${did}/${Path.toPosix(pathSoFar)}`
          })
        })
      },
      did,
      path
    )
  }

  lookupFsWriteUcan(
    did: string,
    path: DistinctivePath<Path.Segments>
  ): Ucan.Ucan | null {
    return this.lookupFsUcan(
      this.fsWriteUcans(),
      pathSoFar => ucan => {
        const hierPart = `${did}/${Path.toPosix(pathSoFar)}`

        return !!ucan.payload.att.find(cap => {
          return cap.with.hierPart === hierPart && (cap.can === SUPERUSER || cap.can.namespace === "fs")
        })
      },
      did,
      path
    )
  }

  private lookupFsUcan(
    fsUcans: Ucan.Ucan[],
    matcher: (pathSoFar: Path.Distinctive<Path.Segments>) => (ucan: Ucan.Ucan) => boolean,
    did: string,
    path: DistinctivePath<Path.Segments>
  ): Ucan.Ucan | null {
    const pathParts = Path.unwrap(path)

    const results = [ "", ...pathParts ].reduce(
      (acc: Ucan.Ucan[], _part, idx): Ucan.Ucan[] => {
        const pathSoFar = Path.fromKind(Path.kind(path), ...(pathParts.slice(0, idx)))

        return [
          ...acc,
          ...fsUcans.filter(
            matcher(pathSoFar)
          )
        ]
      },
      []
    )

    // TODO: Need to sort by ability level, ie. prefer super user over anything else
    return results[ 0 ] || null
  }

  rootIssuer(ucan: Ucan.Ucan): string {
    if (ucan.payload.prf.length) {
      return ucan.payload.prf.reduce(
        (acc, prf) => {
          // Always prefer the first proof.
          // TBH, not sure what's best here.
          if (acc) return acc

          const prfUcan = this.getByKey(prf)
          if (!prfUcan) throw new Error("Missing a UCAN in the repository")

          return this.rootIssuer(prfUcan)
        }
      )
    } else {
      return ucan.payload.iss
    }
  }

}
