import type { Address } from './address.js'
import type { Hex } from './misc.js'
import type { BlockTag } from './client.js'

/** Wire-format snapshot returned by dpos_getSnapshot. */
export type Snapshot = {
  number: Hex
  hash: Hex
  validators: readonly Address[]
  validatorsMap: Record<Address, Record<string, never>>
  recents: Record<string, Address>
  genesisTime: Hex
  periodMs: Hex
  finalizedNumber?: Hex | undefined
  finalizedHash?: Hex | undefined
  [key: string]: unknown
}

/** Wire-format validator info returned by dpos_getValidator. */
export type ValidatorInfo = {
  address: Address
  active: boolean
  index?: number | undefined
  snapshotBlock: Hex
  snapshotHash: Hex
  recentSignedSlots?: readonly Hex[] | undefined
}

/** Wire-format epoch info returned by dpos_getEpochInfo. */
export type EpochInfo = {
  blockNumber: Hex
  epochLength: Hex
  epochIndex: Hex
  epochStart: Hex
  nextEpochStart: Hex
  blocksUntilEpoch: Hex
  targetBlockPeriodMs: Hex
  turnLength: Hex
  turnGroupDurationMs: Hex
  recentSignerWindow: Hex
  maxValidators: Hex
  validatorCount: Hex
  snapshotHash: Hex
}

export type GetSnapshotParams = {
  blockTag?: BlockTag | number | bigint | undefined
}

export type GetValidatorParams = {
  address: Address
  blockTag?: BlockTag | number | bigint | undefined
}

export type GetValidatorsParams = {
  blockTag?: BlockTag | number | bigint | undefined
}

export type GetEpochInfoParams = {
  blockTag?: BlockTag | number | bigint | undefined
}
