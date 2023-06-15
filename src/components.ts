import * as Account from "./components/account/implementation.js"
import * as Capabilities from "./components/capabilities/implementation.js"
import * as Crypto from "./components/crypto/implementation.js"
import * as Depot from "./components/depot/implementation.js"
import * as Identifier from "./components/identifier/implementation.js"
import * as Manners from "./components/manners/implementation.js"
import * as Reference from "./components/reference/implementation.js"
import * as Storage from "./components/storage/implementation.js"


// COMPONENTS


export type Components = {
  account: Account.Implementation
  capabilities: Capabilities.Implementation
  crypto: Crypto.Implementation
  depot: Depot.Implementation
  identifier?: Identifier.Implementation
  manners: Manners.Implementation
  reference: Reference.Implementation
  storage: Storage.Implementation
}



// CONVENIENCE EXPORTS


export { Account, Capabilities, Crypto, Depot, Identifier, Manners, Reference, Storage }