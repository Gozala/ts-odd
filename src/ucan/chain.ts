import { Repo } from "../repositories/ucans.js"
import { Capability, Facts, Ucan } from "./types.js"


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

export function listFacts(
  repo: Repo,
  ucan: Ucan
): Facts {
  const facts = (ucan.payload.fct || []).reduce((acc, f) => {
    return { ...acc, ...f }
  }, {})

  const proofs = ucan.payload.prf.map(repo.getByCID)

  return proofs.reduce(
    (acc: Facts, maybeUcan): Facts => {
      if (maybeUcan) return { ...acc, ...listFacts(repo, maybeUcan) }
      return acc
    },
    facts
  )
}