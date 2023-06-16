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

  /**
   * Look up a UCAN with a file system path.
   */
  lookupFileSystemUcan(
    did: string,
    path: DistinctivePath<Path.Segments>
  ): Ucan.Ucan | null {
    // "wnfs://<did>/<optional:partition>/<optional:path>": {
    //   /* One of the following */
    //   "fs/*": [{}],
    //   "fs/read": [{}],
    //   "fs/append": [{}],
    //   "fs/overwrite": [{}],
    //   "fs/delete": [{}],
    // }

    const fsUcans = this.fileSystemUcans()
    const pathParts = Path.unwrap(path)

    const results = [ "", ...pathParts ].reduce(
      (acc: Ucan.Ucan[], _part, idx): Ucan.Ucan[] => {
        const pathSoFar = Path.fromKind(Path.kind(path), ...(pathParts.slice(0, idx)))
        const hierPart = `${did}/${Path.toPosix(pathSoFar)}`

        return [
          ...acc,
          ...fsUcans.filter(ucan => {
            return ucan.payload.att.find(cap => {
              return cap.with.hierPart === hierPart && (cap.can === SUPERUSER || cap.can.namespace === "fs")
            })
          })
        ]
      },
      []
    )

    // TODO: Need to sort by ability level, ie. prefer super user over anything else
    return results[ 0 ] || null
  }

  accountUcans(): Ucan.Ucan[] {
    return this.getAll().filter(ucan =>
      ucan.payload.att.some(cap => cap.with.scheme === "did")
    )
  }

  fileSystemUcans(): Ucan.Ucan[] {
    return this.getAll().filter(ucan =>
      ucan.payload.att.some(cap => cap.with.scheme === "wnfs")
    )
  }

}
