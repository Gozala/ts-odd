import { Account } from "./components.js"
import { AppInfo } from "./appInfo.js"
import { isString } from "./common/type-checks.js"
import { appId, Permissions, ROOT_FILESYSTEM_PERMISSIONS } from "./permissions.js"


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
    M extends "capabilities" ? {
      /**
       * Capabilities to ask a self-owned-login app.
       */
      permissions: Permissions
    }
    : M extends "self-owned-login" ? {}
    : never
  )



// MODE


export type Mode = "capabilities" | "self-owned-login"


export type CapabilitiesMode = {
  mode: "capabilities"

  capabilities: {
    request: () => void // TODO
  }
}


export type SelfOwnedLoginMode = {
  mode: "self-owned-login"

  capabilities: {
    provide: () => void // TODO
  }
} & AuthenticationStrategy


export type AuthenticationStrategy = Account.Implementation & {
  login: () => Promise<void>
}


export type ProgramPropertiesForMode<M extends Mode>
  = M extends "capabilities" ? CapabilitiesMode
  : M extends "self-owned-login" ? SelfOwnedLoginMode
  : never



// PIECES


export type UserMessages = {
  versionMismatch: {
    newer(version: string): Promise<void>
    older(version: string): Promise<void>
  }
}



// 🛠


export function addRootFileSystemPermissions(config: Configuration): Configuration {
  return { ...config, permissions: { ...config.permissions, ...ROOT_FILESYSTEM_PERMISSIONS } }
}


/**
 * Generate a namespace string based on a configuration.
 */
export function namespace(config: Configuration): string {
  return isString(config.namespace) ? config.namespace : appId(config.namespace)
}