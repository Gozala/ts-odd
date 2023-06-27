import localforage from "localforage"

import * as Crypto from "../../crypto/implementation.js"

import { Implementation } from "../implementation.js"
import { hasProp } from "../../../common/index.js"


// 🛠️


export async function createExchangeKey(crypto: Crypto.Implementation): Promise<CryptoKeyPair> {
  return crypto.rsa.generateKey("exchange")
}


export async function createSigningKey(crypto: Crypto.Implementation): Promise<CryptoKeyPair> {
  return crypto.rsa.generateKey("sign")
}


export async function ensureKey(store: LocalForage, name: string, keyCreator: () => Promise<CryptoKeyPair>): Promise<CryptoKeyPair> {
  const e = await store.getItem(name)
  if (e && hasProp(e, "alg")) return e as unknown as CryptoKeyPair

  const k = await keyCreator()
  await store.setItem(name, k)
  return k
}


export function decrypt(
  crypto: Crypto.Implementation,
  data: Uint8Array,
  exchangeKey: CryptoKeyPair
): Promise<Uint8Array> {
  return crypto.rsa.decrypt(data, exchangeKey.privateKey)
}


export function sign(
  crypto: Crypto.Implementation,
  data: Uint8Array,
  signingKey: CryptoKeyPair
): Promise<Uint8Array> {
  return crypto.rsa.sign(data, signingKey)
}



// 🛳️


export async function implementation(
  { crypto, storeName }: { crypto: Crypto.Implementation, storeName: string }
): Promise<Implementation> {
  const store = localforage.createInstance({ name: storeName })

  // Create keys if needed
  const exchangeKey = await ensureKey(store, "exchange-key", () => createExchangeKey(crypto))
  const signingKey = await ensureKey(store, "signing-key", () => createSigningKey(crypto))

  return {
    exchangeKey: () => Promise.resolve(exchangeKey),
    signingKey: () => Promise.resolve(signingKey),

    decrypt: data => decrypt(crypto, data, exchangeKey),
    sign: data => decrypt(crypto, data, signingKey),

    keyAlgorithm: () => Promise.resolve("rsa"),
    ucanAlgorithm: () => Promise.resolve("RS256"),
  }
}