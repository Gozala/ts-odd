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


  // DIDS & UCANS

  hasSufficientCapabilities: (accountUcans: Ucan[]) => Promise<boolean>

  retrieveCapabilities: () => Promise<Ucan[]>

  /**
   * How should the ODD SDK identify a UCAN for this account system?
   */
  ucanIdentification: (ucan: Ucan) => boolean


  // OTHER

  /**
   * How is an account represented?
   *
   * These properties are passed to other components
   * which might need account identification.
   */
  properties: () => Promise<Record<string, string>>

}
