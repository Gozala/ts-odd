import * as Path from "../path/index.js"
import * as Storage from "../components/storage/implementation"
import * as Ucan from "../ucan/index.js"

import Repository, { RepositoryOptions } from "../repository.js"
import { DistinctivePath } from "../path/index.js"


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
  async lookupFileSystemUcan(
    did: string,
    path: DistinctivePath<Path.Segments> | "*"
  ): Promise<Ucan.Ucan | null> {
    // TODO:
    // "wnfs://<did>/<optional:partition>/<optional:path>": {
    //   /* One of the following */
    //   "fs/*": [{}],
    //   "fs/read": [{}],
    //   "fs/append": [{}],
    //   "fs/overwrite": [{}],
    //   "fs/delete": [{}],
    // }
    //
    // Find a UCAN with the capability: `wnfs://${did}/${path}`
  }

}
