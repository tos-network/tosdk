import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type TNSResolveResult = {
  name: string
  name_hash: Hex
  address: Address
  found: boolean
}

export type TNSReverseResult = {
  address: Address
  name_hash: Hex
  found: boolean
}
