import { CID } from "../../common/cid.js"
import { Capability, Ucan } from "../../ucan/index.js"


export type Implementation = {

  // CREATION

  /**
   * Can these form values be used to register an account?
   */
  canRegister: (formValues: Record<string, string>) => Promise<
    { ok: true } | { ok: false, reason: string }
  >

  /**
   * How to register an account with this account system.
   */
  register: (formValues: Record<string, string>, identifierUcan?: Ucan) => Promise<
    { ok: true, ucans: Ucan[] } | { ok: false }
  >


  // DATA ROOT

  /**
   * Do we have the ability to update the data root?
   */
  canUpdateDataRoot: (capabilities: Capability[]) => Promise<boolean>

  /**
   * How to update the data root, the top-level pointer of the file system.
   */
  updateDataRoot: (dataRoot: CID, proofs: Ucan[]) => Promise<{ ok: true } | { ok: false, reason: string }>

}
