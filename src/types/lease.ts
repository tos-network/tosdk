import type { LocalAccount } from '../accounts/types.js'

import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type LeaseBlockTag =
  | 'latest'
  | 'pending'
  | 'earliest'
  | 'safe'
  | 'finalized'
  | Hex

export type LeaseStatus =
  | 'active'
  | 'frozen'
  | 'expired'
  | 'prunable'
  | 'tombstoned'
  | 'unknown'
  | (string & {})

export type GetLeaseParameters = {
  address: Address
  blockTag?: LeaseBlockTag | number | bigint | undefined
}

export type LeaseTxCommonParameters = {
  from: Address
  nonce?: number | bigint | undefined
  gas?: number | bigint | undefined
}

export type LeaseDeployParameters = LeaseTxCommonParameters & {
  code: Hex
  leaseBlocks: number | bigint
  leaseOwner?: Address | undefined
  value?: number | bigint | undefined
}

export type LeaseRenewParameters = LeaseTxCommonParameters & {
  contractAddress: Address
  deltaBlocks: number | bigint
}

export type LeaseCloseParameters = LeaseTxCommonParameters & {
  contractAddress: Address
}

export type WalletLeaseTxCommonParameters = {
  account?: LocalAccount | undefined
  from?: Address | undefined
  nonce?: number | bigint | undefined
  gas?: number | bigint | undefined
}

export type WalletLeaseDeployParameters = WalletLeaseTxCommonParameters & {
  code: Hex
  leaseBlocks: number | bigint
  leaseOwner?: Address | undefined
  value?: number | bigint | undefined
}

export type WalletLeaseRenewParameters = WalletLeaseTxCommonParameters & {
  contractAddress: Address
  deltaBlocks: number | bigint
}

export type WalletLeaseCloseParameters = WalletLeaseTxCommonParameters & {
  contractAddress: Address
}

export type BuiltTransactionRequest = {
  from: Address
  to: Address
  nonce: bigint
  gas: bigint
  value: bigint
  input: Hex
}

export type BuiltTransactionResult = {
  tx: BuiltTransactionRequest
  raw: Hex
  contractAddress?: Address | undefined
}

export type LeaseRecord = {
  address: Address
  leaseOwner: Address
  createdAtBlock: bigint
  expireAtBlock: bigint
  graceUntilBlock: bigint
  codeBytes: bigint
  depositWei: bigint
  scheduledPruneEpoch: bigint
  scheduledPruneSeq: bigint
  status: LeaseStatus
  tombstoned: boolean
  tombstoneCodeHash: Hex
  tombstoneExpiredAt: bigint
  blockNumber: bigint
}

export type LeaseDeployResult = {
  txHash: Hex
  contractAddress: Address
}
