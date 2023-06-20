import { USERNAME_BLOCKLIST } from "./blocklist.js"
import { Endpoints } from "../../../../common/fission.js"
import { Reference } from "../../../../components.js"


export * from "../../../../common/fission.js"


/**
 * Check if a username is available.
 */
export async function isUsernameAvailable(
  endpoints: Endpoints,
  dnsLookup: Reference.Implementation[ "dns" ],
  username: string
): Promise<boolean> {
  const result = await dnsLookup.lookupDnsLink(
    `${encodeURIComponent(username)}.${endpoints.userDomain}`
  )

  return !!result
}


/**
 * Check if a username is valid.
 */
export function isUsernameValid(username: string): boolean {
  return !username.startsWith("-") &&
    !username.endsWith("-") &&
    !username.startsWith("_") &&
    /^[a-zA-Z0-9_-]+$/.test(username) &&
    !USERNAME_BLOCKLIST.includes(username.toLowerCase())
}
