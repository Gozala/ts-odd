import { Ucan } from "../../ucan/index.js"


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
  canUpdateDataRoot: (accountUcans: Ucan[]) => Promise<boolean>

  /**
   * How to update the data root, the top-level pointer of the file system.
   */
  updateDataRoot: (accountUcans: Ucan[]) => Promise<{ ok: true } | { ok: false, reason: string }>


  // DIDS & UCANS

  /**
   * How should the ODD SDK identify a UCAN for this account system?
   */
  ucanIdentification: (ucan: Ucan) => boolean

}
