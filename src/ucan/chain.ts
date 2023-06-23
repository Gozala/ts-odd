import { Repo } from "../repositories/ucans.js"
import { Capability, Ucan } from "./types.js"


export function listCapabilities(
  repo: Repo,
  ucan: Ucan
): Capability[] {
  const caps = ucan.payload.att
  const proofs = ucan.payload.prf.map(repo.getByCID)

  return proofs.reduce(
    (acc: Capability[], maybeUcan): Capability[] => {
      if (maybeUcan) return [ ...acc, ...listCapabilities(repo, maybeUcan) ]
      return acc
    },
    caps
  )
}