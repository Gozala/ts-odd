import { AppInfo } from "./appInfo.js"
import { Mode } from "./mode.js"
import { hasProp, isString } from "./common/type-checks.js"
import { Query as AccessQuery } from "./access/query.js"


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
    M extends "authority" ? {
      mode: "authority"
    }
    : M extends "delegate" ? {
      mode: "delegate"
      access: {
        request: AccessQuery[]
      }
    }
    : never
  )



// PIECES


export type UserMessages = {
  versionMismatch: {
    newer(version: string): Promise<void>
    older(version: string): Promise<void>
  }
}



// 🛠


/**
 * App identifier.
 */
export function appId(app: AppInfo): string {
  return `${app.creator}/${app.name}`
}

/**
 * Generate a namespace string based on a configuration.
 */
export function namespace<M extends Mode>(config: Configuration<M>): string {
  return isString(config.namespace) ? config.namespace : appId(config.namespace)
}