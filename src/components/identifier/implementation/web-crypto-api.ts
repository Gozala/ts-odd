import { webcrypto } from "one-webcrypto"
import localforage from "localforage"

import * as Crypto from "../../crypto/implementation.js"
import * as DID from "../../../did/index.js"
import * as WebCryptoAPIAgent from "../../agent/implementation/web-crypto-api.js"

import { Implementation } from "../implementation.js"


// 🛳️


export async function implementation(
  { crypto, storeName }: { crypto: Crypto.Implementation, storeName: string }
): Promise<Implementation> {
  const store = localforage.createInstance({ name: storeName })
  const signingKey = await WebCryptoAPIAgent.ensureKey(
    store,
    "signing-key",
    () => WebCryptoAPIAgent.createSigningKey(crypto)
  )

  return {
    did: async () => DID.publicKeyToDid(
      crypto,
      await webcrypto.subtle
        .exportKey("spki", signingKey.publicKey)
        .then(a => new Uint8Array(a)),
      "rsa"
    ),

    sign: async data => WebCryptoAPIAgent.sign(crypto, data, signingKey),
    ucanAlgorithm: async () => "RS256",
  }
}