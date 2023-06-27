import * as Fission from "./fission/index.js"
import * as Ucan from "../../../ucan/index.js"

import { Implementation } from "../implementation.js"
import { CID } from "../../../common/index.js"
import { Query } from "../../../access/query.js"
import { Crypto, DNS } from "../../../components.js"


// 🧩


export type Dependencies = {
  crypto: Crypto.Implementation
  dns: DNS.Implementation
}



// CREATION


export async function canRegister(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
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

  if (await Fission.isUsernameAvailable(endpoints, dependencies.dns, username) === false) return {
    ok: false,
    reason: "Username is not available."
  }

  return {
    ok: true
  }
}


export async function register(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies,
  formValues: Record<string, string>,
  identifierUcan?: Ucan.Ucan
): Promise<
  { ok: true, ucans: Ucan.Ucan[] } | { ok: false, reason: string }
> {
  let username = formValues.username

  if (!username) return {
    ok: false,
    reason: `Username is missing from the form values record. It has the following keys: ${Object.keys(formValues).join(", ")}.`
  }

  const token = Ucan.encode(await Ucan.build({
    dependencies,

    audience: await Fission.did(endpoints),
    proofs: identifierUcan ? [ Ucan.encode(identifierUcan) ] : undefined
  }))

  const response = await fetch(Fission.apiUrl(endpoints, "/user"), {
    method: "PUT",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(formValues)
  })

  if (response.status < 300) return {
    ok: true,
    ucans: [] // TODO
  }

  return {
    ok: false,
    reason: `Server error: ${response.statusText}`
  }
}


// DATA ROOT


export async function canUpdateDataRoot(capabilities: Ucan.Capability[]): Promise<boolean> {
  // TODO: Check if we have the capability to update the data root.
  //       Or in the case of the old Fission server, any account UCAN.
  return true
}


export async function lookupDataRoot(): Promise<CID> {
  // TODO
}


export async function updateDataRoot(dataRoot: CID, proofs: Ucan.Ucan[]): Promise<{ ok: true } | { ok: false, reason: string }> {
  return { ok: false, reason: "Not implemented yet" }
}



// UCANS


export function provideUCANs(accessQuery: Query): Ucan.Ucan[] {
  return [] // TODO
}



// 🛳


export function implementation(
  endpoints: Fission.Endpoints,
  dependencies: Dependencies
): Implementation {
  return {
    canRegister: (...args) => canRegister(endpoints, dependencies, ...args),
    register: (...args) => register(endpoints, dependencies, ...args),

    canUpdateDataRoot: (...args) => canUpdateDataRoot(...args),
    updateDataRoot: (...args) => updateDataRoot(...args),

    provideUCANs(accessQuery: Query): Ucan[]
  }
}