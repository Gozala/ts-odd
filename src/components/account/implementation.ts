import { Ucan } from "../../ucan/index.js"


export type Implementation = {

  // CREATION

  /**
   * Can these form values be used to register an account?
   */
  isAvailable: (formValues: Record<string, string>) => Promise<
    { available: true } | { available: false, reason: string }
  >

  /**
   * Register an account.
   */
  register: (ucan: Ucan, formValues: Record<string, string>) => Promise<
    { success: true, ucans: Ucan[] } | { success: false }
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
