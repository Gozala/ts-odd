import { webcrypto } from "one-webcrypto"
import tweetnacl from "tweetnacl"

import { Implementation, KeyUse, VerifyArgs } from "../implementation.js"
import { isCryptoKey } from "../../../common/type-checks.js"



// DID & UCAN


export const did: Implementation[ "did" ] = {
  keyTypes: {
    "ed25519": {
      magicBytes: new Uint8Array([ 0xed, 0x01 ]),
      verify: ed25519Verify,
    },
    "rsa": {
      magicBytes: new Uint8Array([ 0x00, 0xf5, 0x02 ]),
      verify: rsaVerify,
    },
  }
}


export async function ed25519Verify({ message, publicKey, signature }: VerifyArgs): Promise<boolean> {
  return tweetnacl.sign.detached.verify(message, signature, publicKey)
}


export async function rsaVerify({ message, publicKey, signature }: VerifyArgs): Promise<boolean> {
  return webcrypto.subtle.verify(
    { name: RSA_SIGNING_ALGORITHM, saltLength: RSA_SALT_LENGTH },
    await webcrypto.subtle.importKey(
      "spki",
      publicKey,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      [ "verify" ]
    ),
    signature,
    message,
  )
}



// MISC


export const misc = {
  randomNumbers,
}


export function randomNumbers(options: { amount: number }): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(options.amount))
}



// RSA


export const rsa = {
  decrypt: rsaDecrypt,
  generateKey: rsaGenerateKey,
  sign: rsaSign,
}


export const RSA_EXCHANGE_ALGORITHM = "RSA-OAEP"
export const RSA_SIGNING_ALGORITHM = "RSASSA-PKCS1-v1_5"
export const RSA_HASHING_ALGORITHM = "SHA-256"
export const RSA_SALT_LENGTH = 128


export function importRsaKey(key: Uint8Array, keyUsages: KeyUsage[]): Promise<CryptoKey> {
  return webcrypto.subtle.importKey(
    "spki",
    key,
    {
      name: keyUsages.includes("decrypt") || keyUsages.includes("encrypt")
        ? RSA_EXCHANGE_ALGORITHM
        : RSA_SIGNING_ALGORITHM,
      hash: RSA_HASHING_ALGORITHM
    },
    false,
    keyUsages
  )
}


export async function rsaDecrypt(data: Uint8Array, privateKey: CryptoKey | Uint8Array) {
  const arrayBuffer = await webcrypto.subtle.decrypt(
    {
      name: RSA_EXCHANGE_ALGORITHM
    },
    isCryptoKey(privateKey)
      ? privateKey
      : await importRsaKey(privateKey, [ "decrypt" ])
    ,
    data
  )

  return new Uint8Array(arrayBuffer)
}


export function rsaGenerateKey(keyUse: KeyUse): Promise<CryptoKeyPair> {
  return webcrypto.subtle.generateKey(
    {
      name: keyUse === "exchange" ? RSA_EXCHANGE_ALGORITHM : RSA_SIGNING_ALGORITHM,
      modulusLength: 2048,
      publicExponent: new Uint8Array([ 0x01, 0x00, 0x01 ]),
      hash: { name: RSA_HASHING_ALGORITHM }
    },
    false,
    [ "encrypt", "decrypt" ]
  )
}


export async function rsaSign(data: Uint8Array, signingKey: CryptoKeyPair): Promise<Uint8Array> {
  const arrayBuffer = await webcrypto.subtle.sign(
    { name: RSA_SIGNING_ALGORITHM, saltLength: 128 },
    signingKey.privateKey,
    data
  )

  return new Uint8Array(arrayBuffer)
}



// 🛳


export function implementation(): Implementation {
  return {
    did,
    misc,
    rsa,
  }
}
