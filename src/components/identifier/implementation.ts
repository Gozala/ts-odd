export type Implementation = {
  /**
   * For the Agent delegation UCAN.
   *
   * The identifier system will always delegate to
   * the agent (non-exportable web-crypto key-pair)
   * so that future UCANs can be constructed easier
   * (eg. not having to approve signing)
   *
   * Here we provide a DID and a signing method used to
   * construct the UCAN which delegates to the agent.
   */
  agentDelegation: {
    did: () => Promise<string>
    sign: (data: Uint8Array) => Promise<Uint8Array>
  }

  /**
   *
   */
  login: () => void
}