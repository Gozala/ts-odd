import { Implementation } from "../implementation"

import * as Crypto from "../../../components/crypto/implementation.js"
import * as Manners from "../../../components/manners/implementation.js"
import * as Storage from "../../../components/storage/implementation.js"

import * as CIDLogRepo from "../../../repositories/cid-log.js"
import * as UcansRepo from "../../../repositories/ucans.js"


// 🧩


export type Dependencies = {
  crypto: Crypto.Implementation
  manners: Manners.Implementation
  storage: Storage.Implementation
}



// 🛳


export async function implementation(dependencies: Dependencies): Promise<Implementation> {
  return {
    dataRoot: {
      lookup: () => { throw new Error("Not implemented") },
      update: () => { throw new Error("Not implemented") }
    },
    repositories: {
      cidLog: await CIDLogRepo.create({ storage: dependencies.storage }),
      ucans: await UcansRepo.create({ storage: dependencies.storage })
    },
  }
}