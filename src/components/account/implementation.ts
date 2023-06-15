import { Ucan } from "../../ucan/index.js"


export type Implementation = {
  isAvailable: (formValues: Record<string, string>) => Promise<boolean>
  register: (ucan: Ucan, formValues: Record<string, string>) => Promise<{ success: true, ucans: Ucan[] } | { success: false }>
}
