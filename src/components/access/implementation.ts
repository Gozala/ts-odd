import * as Events from "../../events.js"

import { EventEmitter } from "../../events.js"
import { Permissions } from "../../permissions.js"
import { Ucan } from "../../ucan/index.js"


export type RequestOptions = {
  extraParams?: Record<string, string>
  permissions?: Permissions
  returnUrl?: string
}

export type Provider = {
  type: "provider"

  provide(ucans: Ucan[], eventEmitter: EventEmitter<Events.CapabilityProvider>): Promise<void>
}

export type Consumer = {
  type: "consumer"

  request: (options: RequestOptions, eventEmitter: EventEmitter<Events.CapabilityConsumer>) => Promise<void>
}
