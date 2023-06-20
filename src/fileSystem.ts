import { CID } from "multiformats/cid"

import * as DAG from "./dag/index.js"
import * as Events from "./events.js"
import * as RootTree from "./fs/rootTree.js"
import * as Versions from "./fs/version.js"

import { Configuration } from "./configuration.js"
import { Dependencies } from "./fs/types.js"
import { Account, Crypto, Depot, Reference, Storage } from "./components.js"
import { FileSystem } from "./fs/class.js"
import { Maybe, EMPTY_CID } from "./common/index.js"
import { RootBranch } from "./path/index.js"


/**
 * Load a user's file system.
 */
export async function loadFileSystem({ config, dependencies, eventEmitter }: {
  config: Configuration
  dependencies: Dependencies & { storage: Storage.Implementation }
  eventEmitter: Events.Emitter<Events.FileSystem>
}): Promise<FileSystem> {
  const { crypto, depot, manners, reference, storage } = dependencies

  let cid: Maybe<CID>
  let fs

  // Repositories
  const cidLog = reference.repositories.cidLog

  // Determine the correct CID of the file system to load
  const dataCid = navigator.onLine ? dependencies.reference.dataRoot.lookup(
    dependencies.account.properties()
  ) : null
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
    await cidLog.add(cid)
    manners.log("📓 DNSLink is newer:", cid.toString())

    // TODO: We could test the filesystem version at this DNSLink at this point to figure out whether to continue locally.
    // However, that needs a plan for reconciling local changes back into the DNSLink, once migrated. And a plan for migrating changes
    // that are only stored locally.

  }

  // If a file system exists, load it and return it
  const dataComponents = { crypto, depot, reference, storage }

  if (cid) {
    await checkFileSystemVersion(dependencies.depot, config, cid)
    await manners.fileSystem.hooks.beforeLoadExisting(cid, account, dataComponents)

    fs = await FileSystem.fromCID(cid, { account, dependencies, eventEmitter })

    await manners.fileSystem.hooks.afterLoadExisting(fs, account, dataComponents)

    return fs
  }

  // Otherwise make a new one
  await manners.fileSystem.hooks.beforeLoadNew(account, dataComponents)

  fs = await FileSystem.empty({
    account,
    dependencies,
    eventEmitter,
  })

  await manners.fileSystem.hooks.afterLoadNew(fs, account, dataComponents)

  // Mount private nodes
  //

  // Fin
  return fs
}



// VERSIONING


const DEFAULT_USER_MESSAGES = {
  versionMismatch: {
    newer: async () => alertIfPossible(`Sorry, we can't sync your filesystem with this app. This app only understands older versions of filesystems.\n\nPlease try to hard refresh this site or let this app's developer know.\n\nFeel free to contact Fission support: support@fission.codes`),
    older: async () => alertIfPossible(`Sorry, we can't sync your filesystem with this app. Your filesystem version is out-dated and it needs to be migrated.\n\nRun a migration (https://guide.fission.codes/accounts/account-signup/account-migration) or talk to Fission support: support@fission.codes`),
  }
}


export async function checkFileSystemVersion(
  depot: Depot.Implementation,
  config: Configuration,
  filesystemCID: CID
): Promise<void> {
  const links = await RootTree.linksFromCID(depot, filesystemCID)

  const versionStr = links[ RootBranch.Version ] == null
    ? "1.0.0"
    : new TextDecoder().decode(
      await DAG.getRaw(depot, links[ RootBranch.Version ])
    )

  const errorVersionBigger = async () => {
    await (config.userMessages || DEFAULT_USER_MESSAGES).versionMismatch.newer(versionStr)
    return new Error(`Incompatible filesystem version. Version: ${versionStr} Supported versions: ${Versions.supported.map(v => Versions.toString(v)).join(", ")}. Please upgrade this app's ODD SDK version.`)
  }

  const errorVersionSmaller = async () => {
    await (config.userMessages || DEFAULT_USER_MESSAGES).versionMismatch.older(versionStr)
    return new Error(`Incompatible filesystem version. Version: ${versionStr} Supported versions: ${Versions.supported.map(v => Versions.toString(v)).join(", ")}. The user should migrate their filesystem.`)
  }

  const versionParsed = Versions.fromString(versionStr)

  if (versionParsed == null) {
    throw await errorVersionBigger()
  }

  const support = Versions.isSupported(versionParsed)

  if (support === "too-high") {
    throw await errorVersionBigger()
  }
  if (support === "too-low") {
    throw await errorVersionSmaller()
  }
}


function alertIfPossible(str: string) {
  if (globalThis.alert != null) globalThis.alert(str)
}