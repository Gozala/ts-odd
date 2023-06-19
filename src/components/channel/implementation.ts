import { Channel, ChannelOptions } from "../../channel.js"


export type Implementation = {
  /**
   * How to establish an AWAKE channel.
   *
   * This used for device linking and transferring capabilities.
   */
  establish: (options: ChannelOptions) => Promise<Channel>
}