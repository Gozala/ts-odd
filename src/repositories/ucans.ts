import * as Storage from "../components/storage/implementation"
import * as Ucan from "../ucan/index.js"

import Repository, { RepositoryOptions } from "../repository.js"


export function create({ storage }: { storage: Storage.Implementation }): Promise<Repo> {
  return Repo.create({
    storage,
    storageName: storage.KEYS.UCANS
  })
}



// CLASS


type Collection = Record<string, Ucan.Ucan>


export class Repo extends Repository<Collection, Ucan.Ucan> {

  private indexedByAudience: Record<string, Ucan.Ucan[]>


  private constructor(options: RepositoryOptions) {
    super(options)
    this.indexedByAudience = {}
  }


  // IMPLEMENTATION

  emptyCollection() {
    return {}
  }

  mergeCollections(a: Collection, b: Collection): Collection {
    return {
      ...a,
      ...b
    }
  }

  async toCollection(item: Ucan.Ucan): Promise<Collection> {
    return { [ (await Ucan.cid(item)).toString() ]: item }
  }

  collectionUpdateCallback(collection: Collection) {
    this.indexedByAudience = Object.entries(collection).reduce(
      (acc: Record<string, Ucan.Ucan[]>, [ k, v ]) => {
        return {
          ...acc,
          [ v.payload.aud ]: [ ...(acc[ v.payload.aud ] || []), v ]
        }
      },
      {}
    )
  }


  // ENCODING

  fromJSON(a: string): Collection {
    const encodedObj = JSON.parse(a)

    return Object.entries(encodedObj).reduce(
      (acc, [ k, v ]) => {
        return {
          ...acc,
          [ k ]: Ucan.decode(v as string)
        }
      },
      {}
    )
  }

  toJSON(a: Collection): string {
    const encodedObj = Object.entries(a).reduce(
      (acc, [ k, v ]) => {
        return {
          ...acc,
          [ k ]: Ucan.encode(v)
        }
      },
      {}
    )

    return JSON.stringify(encodedObj)
  }


  // LOOKUPS

  audienceUcans(audience: string): Ucan.Ucan[] {
    return this.indexedByAudience[ audience ]
  }

  // fsReadUcans(): Ucan.Ucan[] {
  //   return this.getAll().filter(ucan =>
  //     (ucan.payload.fct || []).some(f => {
  //       return Object.keys(f).some(a => a.startsWith("wnfs://"))
  //     })
  //   )
  // }

  // fsWriteUcans(): Ucan.Ucan[] {
  //   return this.getAll().filter(ucan =>
  //     ucan.payload.att.some(cap => cap.with.scheme === "wnfs")
  //   )
  // }

  // lookupFsReadUcan(
  //   did: string,
  //   path: DistinctivePath<Path.Segments>
  // ): Ucan.Ucan | null {
  //   return this.lookupFsUcan(
  //     this.fsWriteUcans(),
  //     pathSoFar => ucan => {
  //       return (ucan.payload.fct || []).some(f => {
  //         return Object.keys(f).some(a => {
  //           const withoutScheme = a.replace("wnfs://", "")
  //           return withoutScheme === `${did}/${Path.toPosix(pathSoFar)}`
  //         })
  //       })
  //     },
  //     did,
  //     path
  //   )
  // }

  // lookupFsWriteUcan(
  //   did: string,
  //   path: DistinctivePath<Path.Segments>
  // ): Ucan.Ucan | null {
  //   return this.lookupFsUcan(
  //     this.fsWriteUcans(),
  //     pathSoFar => ucan => {
  //       const hierPart = `${did}/${Path.toPosix(pathSoFar)}`

  //       return !!ucan.payload.att.find(cap => {
  //         return cap.with.hierPart === hierPart && (cap.can === SUPERUSER || cap.can.namespace === "fs")
  //       })
  //     },
  //     did,
  //     path
  //   )
  // }

  // private lookupFsUcan(
  //   fsUcans: Ucan.Ucan[],
  //   matcher: (pathSoFar: Path.Distinctive<Path.Segments>) => (ucan: Ucan.Ucan) => boolean,
  //   did: string,
  //   path: DistinctivePath<Path.Segments>
  // ): Ucan.Ucan | null {
  //   const pathParts = Path.unwrap(path)

  //   const results = [ "", ...pathParts ].reduce(
  //     (acc: Ucan.Ucan[], _part, idx): Ucan.Ucan[] => {
  //       const pathSoFar = Path.fromKind(Path.kind(path), ...(pathParts.slice(0, idx)))

  //       return [
  //         ...acc,
  //         ...fsUcans.filter(
  //           matcher(pathSoFar)
  //         )
  //       ]
  //     },
  //     []
  //   )

  //   // TODO: Need to sort by ability level, ie. prefer super user over anything else
  //   return results[ 0 ] || null
  // }

  // rootIssuer(ucan: Ucan.Ucan): string {
  //   if (ucan.payload.prf.length) {
  //     return ucan.payload.prf.reduce(
  //       (acc, prf) => {
  //         // Always prefer the first proof.
  //         // TBH, not sure what's best here.
  //         if (acc) return acc

  //         const prfUcan = this.getByKey(prf)
  //         if (!prfUcan) throw new Error("Missing a UCAN in the repository")

  //         return this.rootIssuer(prfUcan)
  //       }
  //     )
  //   } else {
  //     return ucan.payload.iss
  //   }
  // }

}
