import * as Raw from "multiformats/codecs/raw"
import * as Uint8arrays from "uint8arrays"
import * as Ucans from "@ucans/core"
import { Ucan } from "@ucans/core"
import { sha256 } from "multiformats/hashes/sha2"

import { Crypto } from "../components.js"
import { didToPublicKey, publicKeyToDid } from "../did/index.js"
import { CID } from "../common/cid.js"


export { Ucan, encode, encodeHeader, encodePayload, verify, parse, isExpired, isTooEarly } from "@ucans/core"


export async function build(
  { dependencies, ...params }: { dependencies: { crypto: Crypto.Implementation } } & BuildParams
): Promise<Ucan> {
  return Ucans.build(
    await plugins(dependencies.crypto)
  )({
    ...params,
    issuer: params.issuer || await keyPair(dependencies.crypto)
  })
}


export async function cid(ucan: Ucan): Promise<CID> {
  const ucanString = Ucans.encode(ucan)
  const multihash = await sha256.digest(
    Uint8arrays.fromString(ucanString, "utf8")
  )

  return CID.createV1(Raw.code, multihash)
}


export function decode(encoded: string): Ucan {
  const [ encodedHeader, encodedPayload, signature ] = encoded.split(".")
  const parts = Ucans.parse(encoded)


  return {
    header: parts.header,
    payload: parts.payload,
    signedData: `${encodedHeader}.${encodedPayload}`,
    signature: signature
  }
}


export function isSelfSigned(ucan: Ucan): boolean {
  return ucan.payload.iss === ucan.payload.aud
}


export async function isValid(crypto: Crypto.Implementation, ucan: Ucan): Promise<boolean> {
  const plug = await plugin(crypto)
  const plugs = new Ucans.Plugins([ plug ], {})

  const signature = Uint8arrays.fromString(ucan.signature, "base64url")
  const signedData = Uint8arrays.fromString(ucan.signedData, "utf8")

  return !Ucans.isExpired(ucan)
    && !Ucans.isTooEarly(ucan)
    && plugs.verifyIssuerAlg(ucan.payload.iss, plug.jwtAlg)
    && plugs.verifySignature(ucan.payload.iss, signedData, signature)
}


export async function keyPair(crypto: Crypto.Implementation): Promise<Keypair> {
  const alg = await crypto.keystore.getAlgorithm()
  const did = publicKeyToDid(crypto, await crypto.keystore.publicWriteKey(), alg)

  return {
    did: () => did,
    jwtAlg: await crypto.keystore.getUcanAlgorithm(),
    sign: crypto.keystore.sign,
  }
}


export async function plugin(crypto: Crypto.Implementation): Promise<Ucans.DidKeyPlugin> {
  const alg = await crypto.keystore.getAlgorithm()
  const keyType = crypto.did.keyTypes[ alg ]

  return {
    prefix: keyType.magicBytes,
    jwtAlg: await crypto.keystore.getUcanAlgorithm(),
    verifySignature: (did: string, data: Uint8Array, sig: Uint8Array) => keyType.verify({
      message: data,
      publicKey: didToPublicKey(crypto, did).publicKey,
      signature: sig
    })
  }
}


export async function plugins(crypto: Crypto.Implementation): Promise<Ucans.Plugins> {
  return new Ucans.Plugins(
    [ await plugin(crypto) ],
    {}
  )
}



// ㊙️


type BuildParams = {
  // from/to
  audience: string
  issuer?: Keypair

  // capabilities
  capabilities?: Array<Ucans.Capability>

  // time bounds
  lifetimeInSeconds?: number // expiration overrides lifetimeInSeconds
  expiration?: number
  notBefore?: number

  // proofs / other info
  facts?: Array<Ucans.Fact>
  proofs?: Array<string>
  addNonce?: boolean
}


type Keypair = Ucans.DidableKey