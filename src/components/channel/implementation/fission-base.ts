import * as Reference from "../../reference/implementation.js"

import { Channel, ChannelOptions, createWssChannel } from "../../../channel.js"
import { Endpoints } from "../../../common/fission.js"
import { Implementation } from "../implementation.js"


// 🛠️


export function establish(
  endpoints: Endpoints,
  reference: Reference.Implementation,
  options: ChannelOptions
): Promise<Channel> {
  const host = `${endpoints.server}${endpoints.apiPath}`.replace(/^https?:\/\//, "wss://")
  const accountDID = reference.repositories.ucans.accountDID()

  return createWssChannel(
    `${host}/user/link/${accountDID}`,
    options
  )
}



// 🛳️


export function implementation(
  endpoints: Endpoints,
  reference: Reference.Implementation
): Implementation {
  return {
    establish: (...args) => establish(endpoints, reference, ...args)
  }
}
