export type Implementation = {
  did: {
    /**
     * Using the key type as the record property name (ie. string = key type)
     *
     * The magic bytes are the `code` found in https://github.com/multiformats/multicodec/blob/master/table.csv
     * encoded as a variable integer (more info about that at https://github.com/multiformats/unsigned-varint).
     *
     * The key type is also found in that table.
     * It's the name of the codec minus the `-pub` suffix.
     *
     * Example
     * -------
     * Ed25519 public key
     * Key type: "ed25519"
     * Magic bytes: [ 0xed, 0x01 ]
     */
    keyTypes: Record<
      string, {
        magicBytes: Uint8Array
        verify: (args: VerifyArgs) => Promise<boolean>
      }
    >
  }

  misc: {
    randomNumbers: (options: { amount: number }) => Uint8Array
  }

  rsa: {
    decrypt: (data: Uint8Array, privateKey: CryptoKey | Uint8Array) => Promise<Uint8Array>
    generateKey: (keyUse: KeyUse) => Promise<CryptoKeyPair>
    sign: (data: Uint8Array, signingKey: CryptoKeyPair) => Promise<Uint8Array>
  }
}


export type KeyUse = "exchange" | "sign"


export type VerifyArgs = {
  message: Uint8Array
  publicKey: Uint8Array
  signature: Uint8Array
}
