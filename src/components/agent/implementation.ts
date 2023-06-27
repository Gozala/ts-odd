export type Implementation = {
  /**
   * Key pair used to make exchanges
   * (eg. make an encrypted exchange)
   */
  exchangeKey: () => Promise<CryptoKeyPair>

  /**
   * Key pair used to sign data.
   */
  signingKey: () => Promise<CryptoKeyPair>

  /**
   * Decrypt something with the exchange key.
   */
  decrypt: (data: Uint8Array, exchangeKey: CryptoKeyPair) => Promise<Uint8Array>

  /**
   * Sign something with the signing key.
   */
  sign: (data: Uint8Array, signingKey: CryptoKeyPair) => Promise<Uint8Array>

  /**
   * This goes hand in hand with the DID `keyTypes` record from the crypto component.
   */
  keyAlgorithm: () => Promise<string>

  /**
   * The JWT algorithm string for agent UCANs.
   */
  ucanAlgorithm: () => Promise<string>
}