import type { CID } from "ipfs-core"
import * as cbor from "cborg"
import { OperationContext } from "./ref.js"
import { SemVer, v1 } from "./semver.js"

export type UnixFileMode = number

export enum UnixNodeType {
  Raw = "raw",
  Directory = "dir",
  File = "file",
  Metadata = "metadata",
  Symlink = "symlink",
  HAMTShard = "hamtShard",
}

export type UnixMeta = {
  mtime: number
  ctime: number
  mode: UnixFileMode
  _type: string
}

export type Metadata = {
  unixMeta: UnixMeta
  isFile: boolean
  version: SemVer
}


export const emptyUnix = (isFile: boolean, now: number): UnixMeta => ({
  mtime: now,
  ctime: now,
  mode: isFile ? 644 : 755,
  _type: isFile ? UnixNodeType.File : UnixNodeType.Directory,
})

export const empty = (isFile: boolean, now: number): Metadata => ({
  isFile,
  version: v1,
  unixMeta: emptyUnix(isFile, now)
})

export const updateMtime = (metadata: Metadata, mtime: number): Metadata => ({
  ...metadata,
  unixMeta: {
    ...metadata.unixMeta,
    mtime
  }
})

export const emptyFile = (now: number): Metadata => empty(true, now)
export const emptyDirectory = (now: number): Metadata => empty(false, now)


export async function metadataToCID(metadata: Metadata, { ipfs, signal }: OperationContext): Promise<CID> {
  const data = cbor.encode(metadata)

  if (signal?.aborted) throw new Error("Operation aborted")

  const { cid } = await ipfs.block.put(data, { version: 1, format: "raw" }) // cid version 1
  return cid
}


export async function metadataFromCID(cid: CID, { ipfs, signal }: OperationContext): Promise<Metadata> {
  const block = await ipfs.block.get(cid, { signal })

  const metadata = cbor.decode(block.data)

  if (!isMetadata(metadata)) {
    throw new Error(`Couldn't parse metadata at ${cid.toString()}`)
  }

  return metadata
}


export function isMetadata(object: unknown): object is Metadata {
  return hasProp(object, "unixMeta") && isUnixMeta(object.unixMeta)
    && hasProp(object, "isFile") && typeof object.isFile === "boolean"
    && hasProp(object, "version") && isSemVer(object.version)
}

export function isUnixMeta(object: unknown): object is UnixMeta {
  return hasProp(object, "mtime") && typeof object.mtime === "number"
    && hasProp(object, "ctime") && typeof object.ctime === "number"
    && hasProp(object, "mode") && typeof object.mode === "number"
    && hasProp(object, "_type") && typeof object._type === "string"
}

export function isSemVer(object: unknown): object is SemVer {
  return hasProp(object, "major") && typeof object.major === "number"
    && hasProp(object, "minor") && typeof object.minor === "number"
    && hasProp(object, "patch") && typeof object.patch === "number"
}

function hasProp<K extends PropertyKey>(data: unknown, prop: K): data is Record<K, unknown> {
  return typeof data === "object" && data != null && prop in data
}