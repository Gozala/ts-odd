import * as DID from "./did/index.js"
import * as Ucan from "./ucan/index.js"

import { Crypto, Identifier } from "./components.js"


// LOGIN


export type LoginDependencies = {
  crypto: Crypto.Implementation
  identifier?: Identifier.Implementation
}


export const login = ({ crypto, identifier }: LoginDependencies) => async () => {
  if (identifier) {
    const did = await identifier.did()

    // Do delegation from identifier to agent
    Ucan.build({
      dependencies: { crypto },

      // from & to
      issuer: {
        did: () => did,
        jwtAlg: await identifier.ucanAlgorithm(),
        sign: identifier.sign,
      },
      audience: DID.publicKeyToDid(
        crypto,
        await crypto.keystore.publicWriteKey(),
        await crypto.keystore.getAlgorithm()
      )
    })

  } else {
    // TODO: Setup device linking consumer
    // Request capabilities

  }
}