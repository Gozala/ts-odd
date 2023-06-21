import { Account } from "./components.js"
import { AppInfo } from "./appInfo.js"
import { hasProp, isString } from "./common/type-checks.js"
import { appId, Permissions, ROOT_FILESYSTEM_PERMISSIONS } from "./permissions.js"
import { RequestOptions } from "./components/capabilities/implementation.js"


// CONFIGURATION


export type Configuration<M extends Mode> = {
  namespace: string | AppInfo

  /**
   * Enable debug mode.
   *
   * @default false
   */
  debug?: boolean

  /**
   * Debugging settings.
   */
  debugging?: {
    /**
    * Should I emit window post messages with session and filesystem information?
    *
    * @default true
    */
    emitWindowPostMessages?: boolean

    /**
     * Should I add programs to the global context while in debugging mode?
     *
     * @default true
     */
    injectIntoGlobalContext?: boolean
  }

  /**
   * File system settings.
   */
  fileSystem?: {
    /**
     * Should I load the file system immediately?
     *
     * @default true
     */
    loadImmediately?: boolean

    /**
     * Set the file system version.
     *
     * This will only affect new file systems created.
     * Existing file systems (whether loaded from another device or loaded locally) continue
     * using the same version.
     * If you're looking to migrate an existing file system to a new file system version,
     * please look for migration tooling.
     */
    version?: string
  }

  /**
   * Configure messages that the ODD SDK sends to users.
   *
   * `versionMismatch.newer` is shown when the ODD SDK detects
   *  that the user's file system is newer than what this version of the ODD SDK supports.
   * `versionMismatch.older` is shown when the ODD SDK detects that the user's
   *  file system is older than what this version of the ODD SDK supports.
   */
  userMessages?: UserMessages
} & (
    M extends "authority" ? {}
    : M extends "delegate" ? {
      /**
       * Capabilities to ask a self-owned-login app.
       */
      permissions: Permissions
    }
    : never
  )



// MODE


export type Mode = "authority" | "delegate"


export type AuthorityMode = {
  mode: "authority"

  capabilities: {
    provide: () => Promise<void>
  }
} & AuthenticationStrategy


export type DelegateMode = {
  mode: "delegate"

  capabilities: {
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



// PIECES


export type UserMessages = {
  versionMismatch: {
    newer(version: string): Promise<void>
    older(version: string): Promise<void>
  }
}



// 🛠


export function addRootFileSystemPermissions(config: Configuration<"delegate">): Configuration<"delegate"> {
  return { ...config, permissions: { ...config.permissions, ...ROOT_FILESYSTEM_PERMISSIONS } }
}

// export function mode<M extends Mode = "authority">(config: Configuration<M>): "authority"
// export function mode<M extends Mode = "delegate">(config: Configuration<M>): "delegate"
export function mode<M extends Mode>(config: Configuration<M>): "authority" | "delegate" {
  return hasProp(config, "permissions") ? "delegate" : "authority"
}


/**
 * Generate a namespace string based on a configuration.
 */
export function namespace<M extends Mode>(config: Configuration<M>): string {
  return isString(config.namespace) ? config.namespace : appId(config.namespace)
}