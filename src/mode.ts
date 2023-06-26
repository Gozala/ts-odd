import { Account } from "./components.js"


// 🧩


export type Mode = "authority" | "delegate"


export type AuthorityMode = {
  mode: "authority"

  capabilities: {
    provide: () => Promise<void>
  }
} & AuthenticationStrategy


export type DelegateMode = {
  mode: "delegate"

  capabilities: {
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