import { CID } from "multiformats/cid"

import * as Storage from "../components/storage/implementation"
import { decodeCID, encodeCID } from "../common/cid.js"
import Repository, { RepositoryOptions } from "../repository.js"


export function create({ storage }: { storage: Storage.Implementation }): Promise<Repo> {
  return Repo.create({
    storage,
    storageName: storage.KEYS.CID_LOG
  })
}


// CLASS


export class Repo extends Repository<CID[], CID> {

  private constructor(options: RepositoryOptions) {
    super(options)
  }


  // IMPLEMENTATION

  emptyCollection() {
    return []
  }

  mergeCollections(a: CID[], b: CID[]): CID[] {
    return [
      ...a,
      ...b
    ]
  }

  async toCollection(item: CID): Promise<CID[]> {
    return [ item ]
  }


  // ENCODING

  fromJSON(a: string): CID[] {
    return JSON.parse(a).map(decodeCID)
  }

  toJSON(a: CID[]): string {
    return JSON.stringify(
      a.map(encodeCID)
    )
  }


  // 🛠️

  find(predicate: (value: CID, index: number) => boolean): CID | null {
    return this.memoryCollection.find(predicate) || null
  }

  getByIndex(idx: number): CID | null {
    return this.memoryCollection[ idx ]
  }

  getAll(): CID[] {
    return this.memoryCollection
  }

  indexOf(item: CID): number {
    return this.memoryCollection.map(
      c => c.toString()
    ).indexOf(
      item.toString()
    )
  }

  length(): number {
    return this.memoryCollection.length
  }

  newest(): CID {
    return this.memoryCollection[ this.memoryCollection.length - 1 ]
  }

}