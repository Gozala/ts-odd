import { Permissions } from "../../permissions.js"
import { Ucan } from "../../ucan/index.js"


export type RequestOptions = {
  extraParams?: Record<string, string>
  permissions?: Permissions
  returnUrl?: string
}

export type Implementation = {
  collect: () => Promise<Ucan[]>
  request: (options: RequestOptions) => Promise<void>
}