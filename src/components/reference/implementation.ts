import { CID } from "multiformats/cid"

import * as CIDLog from "../../repositories/cid-log.js"
import * as Ucans from "../../repositories/ucans.js"

import { Ucan } from "../../ucan/index.js"


export type Implementation = {
  dataRoot: {
    lookup: (accountProperties: Record<string, string>) => Promise<CID | null>
    update: (cid: CID, proof: Ucan) => Promise<{ success: boolean }>
  }
  repositories: {
    cidLog: CIDLog.Repo
    ucans: Ucans.Repo
  }
}