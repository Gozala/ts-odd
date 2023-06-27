import localforage from "localforage"

import * as Auth from "./auth.js"
import * as AccessQuery from "./access/query.js"
import * as CIDLog from "./repositories/cid-log.js"
import * as Config from "./configuration.js"
import * as DID from "./did/local.js"
import * as Events from "./events.js"
import * as Extension from "./extension/index.js"
import * as FileSystemData from "./fs/data.js"
import * as UcanChain from "./ucan/chain.js"
import * as UcanRepository from "./repositories/ucans.js"

import { Account, Crypto, Depot, Identifier, Manners, Storage } from "./components.js"
import { Components } from "./components.js"
import { Configuration, namespace } from "./configuration.js"
import { FileSystem } from "./fs/class.js"
import { Mode } from "./mode.js"
import { loadFileSystem } from "./fileSystem.js"
import { RequestOptions } from "./components/access/implementation.js"


// IMPLEMENTATIONS


import * as BrowserCrypto from "./components/crypto/implementation/browser.js"
import * as BrowserStorage from "./components/storage/implementation/browser.js"
import * as FissionIpfsProduction from "./components/depot/implementation/fission-ipfs-production.js"
import * as ProperManners from "./components/manners/implementation/base.js"


// RE-EXPORTS


export * from "./appInfo.js"
export * from "./components.js"
export * from "./configuration.js"
export * from "./common/cid.js"
export * from "./common/types.js"
export * from "./common/version.js"

export * as did from "./did/index.js"
export * as fission from "./common/fission.js"
export * as path from "./path/index.js"

export { FileSystem } from "./fs/class.js"



// TYPES & CONSTANTS


export type Program<M extends Mode> = {
  /**
   * Components used to build this program.
   */
  components: Components

  /**
   * Configuration used to build this program.
   */
  configuration: Configuration<M>

  /**
   * Various file system methods.
   */
  fileSystem: FileSystemShortHands

  /**
   * Is the program "connected"?
   *
   * This essential means having all the required UCANs in possession.
   * More specifically having the capabilities to query and/or mutate the
   * file system based on what is configured, and if mutation is considered,
   * to update the data root associated with the file system.
   */
  isConnected: () => Promise<{ connected: true } | { connected: false, reason: string }>
} & ShortHands & Events.ListenTo<Events.All> & ProgramPropertiesForMode<M>


export enum ProgramError {
  InsecureContext = "INSECURE_CONTEXT",
  UnsupportedBrowser = "UNSUPPORTED_BROWSER"
}


export type ShortHands = {
  agentDID: () => Promise<string>
  sharingDID: () => Promise<string>
}


export type FileSystemShortHands = {
  addSampleData: (fs: FileSystem) => Promise<void>

  /**
   * Load the file system associated with the account system.
   */
  load: () => Promise<FileSystem>
}


export type AuthorityMode = {
  access: {
    provide: () => Promise<void>
  }
} & AuthenticationStrategy


export type DelegateMode = {
  access: {
    request: (options: RequestOptions) => Promise<void>
  }
}


export type AuthenticationStrategy = Account.Implementation & {
  login: () => Promise<void>
}


export type ProgramPropertiesForMode<M extends Mode>
  = M extends "authority" ? AuthorityMode
  : M extends "delegate" ? DelegateMode
  : never



// ENTRY POINTS


/**
 * 🚀 Build an ODD program.
 *
 * This will give you a `Program` object which has the following properties:
 * - `auth`, a means to login or register an account.
 * - `capabilities`, a means to control capabilities. Use this to collect & request capabilities. Read more about capabilities in the toplevel `capabilities` object documentation.
 * - `components`, your full set of `Components`.
 *
 * This object also has a few other functions, for example to load a filesystem.
 * These are called "shorthands" because they're the same functions available
 * through other places in the ODD SDK, but you don't have to pass in the components.
 *
 * See `assemble` for more information. Note that this function checks for browser support,
 * while `assemble` does not. Use the latter in case you want to bypass the indexedDB check,
 * which might not be needed, or available, in certain environments or using certain components.
 */
export async function program<M extends Mode>(settings: Partial<Components> & Configuration<M>): Promise<Program<M>> {
  if (!settings) throw new Error("Expected a settings object of the type `Partial<Components> & Configuration` as the first parameter")

  // Check if the browser and context is supported
  if (globalThis.isSecureContext === false) throw ProgramError.InsecureContext
  if (await isSupported() === false) throw ProgramError.UnsupportedBrowser

  // Initialise components & assemble program
  const components = await gatherComponents(settings)
  return assemble(extractConfig(settings), components)
}



// PREDEFINED COMPONENTS


// TODO: Add back predefined components



// ASSEMBLE


/**
 * Build an ODD Program based on a given set of `Components`.
 * These are various customisable components that determine how an ODD app works.
 * Use `program` to work with a default, or partial, set of components.
 *
 * Additionally this does a few other things:
 * - Loads the user's file system if needed.
 * - Attempts to collect capabilities if the configuration has permissions.
 * - Provides shorthands to functions so you don't have to pass in components.
 * - Ensure backwards compatibility with older ODD SDK clients.
 *
 * See the `program.fileSystem.load` function if you want to load the user's file system yourself.
 */
export async function assemble<M extends Mode>(config: Configuration<M>, components: Components): Promise<Program<M>> {
  const { crypto, identifier } = components

  // Event emitters
  const fsEvents = Events.createEmitter<Events.FileSystem>()
  const allEvents = fsEvents

  // Create repositories
  const cidLog = await CIDLog.create({ storage: components.storage })
  const ucansRepository = await UcanRepository.create({ storage: components.storage })

  // Mode implementation
  let modeImplementation: ProgramPropertiesForMode<M>

  switch (config.mode) {
    case "authority":
      const a: AuthorityMode = {
        login: Auth.login({ crypto, identifier }),

        ...components.account,

        access: {
          provide: async () => { } // TODO
        }
      }

      modeImplementation = a as ProgramPropertiesForMode<M>
      break;

    case "delegate":
      const d: DelegateMode = {
        access: {
          request: async () => { } // TODO
        }
      }

      modeImplementation = d as ProgramPropertiesForMode<M>
      break;
  }

  // Shorthands
  const shorthands: ShortHands = {
    agentDID: () => DID.agent(components.crypto),
    sharingDID: () => DID.sharing(components.crypto),
  }

  const fileSystemShortHands: FileSystemShortHands = {
    addSampleData: (fs: FileSystem) => FileSystemData.addSampleData(fs),
    load: () => loadFileSystem({ config, cidLog, dependencies: components, eventEmitter: fsEvents }),
  }

  // Is connected?
  async function isConnected(): Promise<{ connected: true } | { connected: false, reason: string }> {
    // Audience is always the identifier,
    // account system should delegate to the identifier (not the agent)
    const audience = await components.identifier.did()
    const audienceUcans = ucansRepository.audienceUcans(audience)

    // TODO: This could be done better, waiting on rs-ucan integration
    const capabilities = audienceUcans.flatMap(
      ucan => UcanChain.listCapabilities(ucansRepository, ucan)
    )

    // 👀
    switch (config.mode) {
      case "authority":
        // TODO: Do we need something like `account.hasSufficientCapabilities()` here?
        //       Something that would check if all needed capabilities are present?
        //
        //       Also need to check if we can write to the entire file system.
        const canUpdateDataRoot = await components.account.canUpdateDataRoot(capabilities)
        if (!canUpdateDataRoot) return {
          connected: false,
          reason: "Program does not have the ability to update the data root, but is expected to."
        }

        return { connected: true }

      case "delegate":
        const anyAccountQueries = config.access.request.some(
          qry => qry.query === "account"
        )

        const needsWriteAccess = config.access.request.reduce(
          (acc, qry) => {
            if (acc === true) return true
            if (qry.query === "fileSystem") return AccessQuery.needsWriteAccess(qry)
            return false
          },
          false
        )

        if (anyAccountQueries && needsWriteAccess) {
          const canUpdateDataRoot = await components.account.canUpdateDataRoot(capabilities)
          if (!canUpdateDataRoot) return {
            connected: false,
            reason: "Program does not have the ability to update the data root, but is expected to."
          }
        }

        // TODO: Check if our received WNFS capabilities fulfil our access query

        return { connected: true }

      default:
        throw new Error("Invalid program mode")
    }
  }

  // Create `Program`
  const program = {
    ...modeImplementation,
    ...shorthands,
    ...Events.listenTo(allEvents),

    configuration: { ...config },
    fileSystem: { ...fileSystemShortHands },

    components,
    isConnected,
  }

  // Debug mode:
  // - Enable ODD extensions (if configured)
  // - Inject into global context (if configured)
  if (config.debug) {
    const inject = config.debug === true || config.debug?.injectIntoGlobalContext === undefined
      ? true
      : config.debug?.injectIntoGlobalContext

    if (inject) {
      const container = globalThis as any
      container.__odd = container.__odd || {}
      container.__odd.programs = container.__odd.programs || {}
      container.__odd.programs[ namespace(config) ] = program
    }

    // TODO: Re-enable extension
    //
    // const emitMessages = config.debugging?.emitWindowPostMessages === undefined
    //   ? true
    //   : config.debugging?.emitWindowPostMessages

    // if (emitMessages) {
    //   const { connect, disconnect } = await Extension.create({
    //     namespace: config.namespace,
    //     capabilities: config.permissions,
    //     dependencies: components,
    //     eventEmitters: {
    //       fileSystem: fsEvents
    //     }
    //   })

    //   const container = globalThis as any
    //   container.__odd = container.__odd || {}
    //   container.__odd.extension = container.__odd.extension || {}
    //   container.__odd.extension.connect = connect
    //   container.__odd.extension.disconnect = disconnect

    //   // Notify extension that the ODD SDK is ready
    //   globalThis.postMessage({
    //     id: "odd-devtools-ready-message",
    //   })
    // }
  }

  // Fin
  return program
}



// COMPOSITIONS


/**
 * Full component sets.
 */
export const compositions = {
  // TODO: Fission stack
}


export async function gatherComponents<M extends Mode>(setup: Partial<Components> & Configuration<M>): Promise<Components> {
  const config = extractConfig(setup)

  const crypto = setup.crypto || await defaultCryptoComponent(config)
  const manners = setup.manners || defaultMannersComponent(config)
  const storage = setup.storage || defaultStorageComponent(config)

  const depot = setup.depot || await defaultDepotComponent({ storage }, config)

  return {
    account,
    channel,
    crypto,
    depot,
    dns,
    identifier,
    manners,
    storage,
  }
}



// DEFAULT COMPONENTS


export function defaultCryptoComponent<M extends Mode>(config: Configuration<M>): Promise<Crypto.Implementation> {
  return BrowserCrypto.implementation({
    storeName: namespace(config),
  })
}

export function defaultDepotComponent<M extends Mode>({ storage }: { storage: Storage.Implementation }, config: Configuration<M>): Promise<Depot.Implementation> {
  return FissionIpfsProduction.implementation(
    storage,
    `${namespace(config)}/blockstore`
  )
}

export function defaultMannersComponent<M extends Mode>(config: Configuration<M>): Manners.Implementation {
  return ProperManners.implementation({
    configuration: config
  })
}

export function defaultStorageComponent<M extends Mode>(config: Configuration<M>): Storage.Implementation {
  return BrowserStorage.implementation({
    name: namespace(config)
  })
}



// 🛟


/**
 * Is this browser supported?
 */
export async function isSupported(): Promise<boolean> {
  return localforage.supports(localforage.INDEXEDDB)

    // Firefox in private mode can't use indexedDB properly,
    // so we test if we can actually make a database.
    && await (() => new Promise(resolve => {
      const db = indexedDB.open("testDatabase")
      db.onsuccess = () => resolve(true)
      db.onerror = () => resolve(false)
    }))() as boolean
}



// 🛠


export function extractConfig<M extends Mode>(opts: Partial<Components> & Configuration<M>): Configuration<M> {
  const base = {
    namespace: opts.namespace,
    debug: opts.debug,
    fileSystem: opts.fileSystem,
    userMessages: opts.userMessages,
  }

  switch (opts.mode) {
    case "authority":
      const aMode: Config.AuthorityMode = {
        mode: "authority"
      }

      const aConfig: Configuration<"authority"> = { ...base, ...aMode }
      return aConfig as unknown as Configuration<M>

    case "delegate":
      const dMode: Config.DelegateMode = {
        ...base,
        mode: "delegate",
        access: opts.access,
      }

      const dConfig: Configuration<"delegate"> = { ...base, ...dMode }
      return dConfig as unknown as Configuration<M>
  }
}
