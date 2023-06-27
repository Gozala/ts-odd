import { CID } from "multiformats/cid"

import type { Repo as CIDLog } from "./repositories/cid-log.js"

import * as Events from "./events.js"

import { Configuration } from "./configuration.js"
import { Dependencies } from "./fs/types.js"
import { FileSystem } from "./fs/class.js"
import { Maybe } from "./common/index.js"
import { Mode } from "./mode.js"


/**
 * Load a user's file system.
 */
export async function loadFileSystem<M extends Mode>({ cidLog, config, dependencies, eventEmitter }: {
  cidLog: CIDLog
  config: Configuration<M>
  dependencies: Dependencies
  eventEmitter: Events.Emitter<Events.FileSystem>
}): Promise<FileSystem> {
  const { depot, manners } = dependencies

  let cid: Maybe<CID>
  let fs

  // Determine the correct CID of the file system to load
  const dataCid = navigator.onLine ? await dependencies.account.lookupDataRoot() : null
  const logIdx = dataCid ? cidLog.indexOf(dataCid) : -1

  if (!navigator.onLine) {
    // Offline, use local CID
    cid = cidLog.newest()
    if (cid) manners.log("📓 Working offline, using local CID:", cid.toString())

    throw new Error("Offline, don't have a file system to work with.")

  } else if (!dataCid) {
    // No DNS CID yet
    cid = cidLog.newest()
    if (cid) manners.log("📓 No DNSLink, using local CID:", cid.toString())
    else manners.log("📓 Creating a new file system")

  } else if (logIdx === cidLog.length() - 1) {
    // DNS is up to date
    cid = dataCid
    manners.log("📓 DNSLink is up to date:", cid.toString())

  } else if (logIdx !== -1 && logIdx < cidLog.length() - 1) {
    // DNS is outdated
    cid = cidLog.newest()
    const diff = cidLog.length() - 1 - logIdx
    const idxLog = diff === 1 ? "1 newer local entry" : diff.toString() + " newer local entries"
    manners.log("📓 DNSLink is outdated (" + idxLog + "), using local CID:", cid.toString())

  } else {
    // DNS is newer
    cid = dataCid
    await cidLog.add([ cid ])
    manners.log("📓 DNSLink is newer:", cid.toString())

    // TODO: We could test the filesystem version at this DNSLink at this point to figure out whether to continue locally.
    // However, that needs a plan for reconciling local changes back into the DNSLink, once migrated. And a plan for migrating changes
    // that are only stored locally.

  }

  // If a file system exists, load it and return it
  const account = {
    did: "TODO"
  }

  if (cid) {
    await manners.fileSystem.hooks.beforeLoadExisting(cid, account, depot)

    fs = await FileSystem.fromCID(cid, { account, cidLog, dependencies, eventEmitter })

    await manners.fileSystem.hooks.afterLoadExisting(fs, account, depot)

    return fs
  }

  // Otherwise make a new one
  await manners.fileSystem.hooks.beforeLoadNew(account, depot)

  fs = await FileSystem.empty({
    account,
    cidLog,
    dependencies,
    eventEmitter,
  })

  await manners.fileSystem.hooks.afterLoadNew(fs, account, depot)

  // TODO: Mount private nodes

  // Fin
  return fs
}