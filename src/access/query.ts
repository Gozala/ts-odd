import * as Uint8Arrays from "uint8arrays"
import * as Path from "../path/index.js"


// 🏔️


export const ALLOWED_ABILITIES = [ "read", "append", "delete", "overwrite", "*" ]



// 🧩


export type Query = AccountQuery | FileSystemQuery


export type AccountQuery = {
  query: "account"
}

export type FileSystemQuery = {
  query: "fileSystem"
  ability: keyof (typeof ALLOWED_ABILITIES)
  path: Path.Distinctive<Path.Partitioned<Path.Partition>>
  key?: Uint8Array
}



// ENCODING


export function fromJSON(query: string): Query {
  const obj = JSON.parse(query)

  if (ALLOWED_ABILITIES.includes(obj.ability) === false) {
    throw new Error(`Ability in query is not allowed: \`${obj.ability}\` --- Allowed abilities: ${ALLOWED_ABILITIES.join(', ')}.`)
  }

  const path = Path.fromPosix(obj.path)
  let partitionedPath: Path.Distinctive<Path.Partitioned<Path.Partition>>

  if (Path.isPartitioned(path)) {
    partitionedPath = path
  } else {
    throw new Error(`Expected a path with a partition (private or public), got: ${obj.path}`)
  }

  return {
    query: obj.query,
    ability: obj.ability,
    path: partitionedPath,
    key: obj.key ? Uint8Arrays.fromString(obj.key, "base64pad") : undefined,
  }
}


export function toJSON(query: Query): string {
  switch (query.query) {
    case "account":
      return JSON.stringify({
        query: query.query
      })

    case "fileSystem":
      return JSON.stringify({
        query: query.query,
        ability: query.ability,
        path: Path.toPosix(query.path),
        key: query.key ? Uint8Arrays.toString(query.key, "base64pad") : undefined
      })
  }
}



// 🛠️


function answer(query: Query) { }