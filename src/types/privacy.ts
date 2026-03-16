import type { Address } from './address.js'
import type { BlockTag } from './client.js'
import type { Hex } from './misc.js'

export type GetPrivBalanceParameters = {
  pubkey: Hex
  blockTag?: BlockTag | number | bigint | undefined
}

export type GetPrivNonceParameters = {
  pubkey: Hex
  blockTag?: BlockTag | number | bigint | undefined
}

export type PrivBalanceRecord = {
  pubkey: Hex
  commitment: Hex
  handle: Hex
  version: bigint
  privNonce: bigint
  blockNumber: bigint
}

export type PrivTxCommonParameters = {
  privNonce: number | bigint
  fee: number | bigint
}

export type PrivTransferParameters = PrivTxCommonParameters & {
  from: Hex
  to: Hex
  feeLimit: number | bigint
  commitment: Hex
  senderHandle: Hex
  receiverHandle: Hex
  sourceCommitment: Hex
  ctValidityProof: Hex
  commitmentEqProof: Hex
  rangeProof: Hex
  encryptedMemo?: Hex | undefined
  memoSenderHandle?: Hex | undefined
  memoReceiverHandle?: Hex | undefined
  s: Hex
  e: Hex
}

export type PrivShieldParameters = PrivTxCommonParameters & {
  pubkey: Hex
  recipient: Hex
  amount: number | bigint
  commitment: Hex
  handle: Hex
  shieldProof: Hex
  rangeProof: Hex
  s: Hex
  e: Hex
}

export type PrivUnshieldParameters = PrivTxCommonParameters & {
  pubkey: Hex
  recipient: Address
  amount: number | bigint
  sourceCommitment: Hex
  commitmentEqProof: Hex
  rangeProof: Hex
  s: Hex
  e: Hex
}
