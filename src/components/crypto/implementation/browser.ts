import { webcrypto } from "one-webcrypto"
import tweetnacl from "tweetnacl"

import * as typeChecks from "../../../common/type-checks.js"
import { Implementation, VerifyArgs } from "../implementation.js"



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
    { name: "RSASSA-PKCS1-v1_5", saltLength: 128 },
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



// HASH


export const hash = {
  sha256
}


export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await webcrypto.subtle.digest("sha-256", bytes))
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
  encrypt: rsaEncrypt,
  exportPublicKey: rsaExportPublicKey,
  genKey: rsaGenKey,
}



// RSA
// ---
// Exchange keys:


export const RSA_ALGORITHM = "RSA-OAEP"
export const RSA_HASHING_ALGORITHM = "SHA-256"


export function importRsaKey(key: Uint8Array, keyUsages: KeyUsage[]): Promise<CryptoKey> {
  return webcrypto.subtle.importKey(
    "spki",
    key,
    { name: RSA_ALGORITHM, hash: RSA_HASHING_ALGORITHM },
    false,
    keyUsages
  )
}

export async function rsaDecrypt(data: Uint8Array, privateKey: CryptoKey | Uint8Array): Promise<Uint8Array> {
  const arrayBuffer = await webcrypto.subtle.decrypt(
    {
      name: RSA_ALGORITHM
    },
    typeChecks.isCryptoKey(privateKey)
      ? privateKey
      : await importRsaKey(privateKey, [ "decrypt" ])
    ,
    data
  )

  return new Uint8Array(arrayBuffer)
}

export async function rsaEncrypt(message: Uint8Array, publicKey: CryptoKey | Uint8Array): Promise<Uint8Array> {
  const key = typeChecks.isCryptoKey(publicKey)
    ? publicKey
    : await importRsaKey(publicKey, [ "encrypt" ])

  const arrayBuffer = await webcrypto.subtle.encrypt(
    {
      name: RSA_ALGORITHM
    },
    key,
    message
  )

  return new Uint8Array(arrayBuffer)
}

export async function rsaExportPublicKey(key: CryptoKey): Promise<Uint8Array> {
  const buffer = await webcrypto.subtle.exportKey("spki", key)
  return new Uint8Array(buffer)
}

export function rsaGenKey(): Promise<CryptoKeyPair> {
  return webcrypto.subtle.generateKey(
    {
      name: RSA_ALGORITHM,
      modulusLength: 2048,
      publicExponent: new Uint8Array([ 0x01, 0x00, 0x01 ]),
      hash: { name: RSA_HASHING_ALGORITHM }
    },
    true,
    [ "encrypt", "decrypt" ]
  )
}



// 🛳


export function implementation(): Implementation {
  return {
    did,
    hash,
    misc,
    rsa,
  }
}
