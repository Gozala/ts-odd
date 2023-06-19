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
   * Register an account.
   */
  register: (formValues: Record<string, string>, identifierUcan?: Ucan) => Promise<
    { ok: true, ucans: Ucan[] } | { ok: false }
  >


  // OTHER

  /**
   * How is an account represented?
   *
   * These properties are passed to other components
   * which might need account identification.
   */
  properties: () => Promise<Record<string, string>>

}
