import { Account } from "./components.js"
import { RequestOptions } from "./components/access/implementation.js"


// 🧩


export type Mode = "authority" | "delegate"


export type AuthorityMode = {
  mode: "authority"

  access: {
    provide: () => Promise<void>
  }
} & AuthenticationStrategy


export type DelegateMode = {
  mode: "delegate"

  access: {
    request: (options: RequestOptions) => Promise<void>
  }
}


export type AuthenticationStrategy = Account.Implementation & {
  login: () => Promise<void>
}


export type ProgramPropertiesForMode<M extends Mode>
  = M extends "authority" ? AuthorityMode
  : M extends "delegate" ? DelegateMode
  : never



// 🛠️


export function isMode(str: string): str is Mode {
  return str === "authority" || str === "delegate"
}