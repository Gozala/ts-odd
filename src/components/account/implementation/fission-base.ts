import { Implementation } from "../implementation.js"
import * as Fission from "./fission/index.js"


export async function canRegister(
  endpoints: Fission.Endpoints,
  formValues: Record<string, string>
): Promise<
  { ok: true } | { ok: false, reason: string }
> {
  let username = formValues.username

  if (!username) return {
    ok: false,
    reason: `Username is missing from the form values record. It has the following keys: ${Object.keys(formValues).join(", ")}.`
  }

  username = username.trim()

  if (Fission.isUsernameValid(username) === false) return {
    ok: false,
    reason: "Username is not valid."
  }

  if (await Fission.isUsernameAvailable(endpoints, username) === false) return {
    ok: false,
    reason: "Username is not available."
  }

  return {
    ok: true
  }
}


// 🛳


export function implementation(endpoints: Fission.Endpoints): Implementation {
  return {
    canRegister: (...args) => canRegister(endpoints, ...args),

    // register: (formValues: Record<string, string>, identifierUcan?: Ucan) => Promise<
    //   { ok: true, ucans: Ucan[] } | { ok: false }
    // >

    // properties: () => Promise<Record<string, string>>
  }
}