import type { Address } from './address.js'
import type { Hex, Signature } from './misc.js'

export type TransactionType = 'native' | (string & {})

export type TransactionSerializableNative = {
  type: 'native'
  chainId: number | bigint
  nonce: number | bigint
  gas: number | bigint
  to?: Address | null | undefined
  value: number | bigint
  data?: Hex | undefined
  from: Address
  signerType: string
}

export type TransactionSerializable = TransactionSerializableNative
export type TransactionSerializableGeneric = TransactionSerializableNative

export type TransactionSerializedNative = Hex
export type TransactionSerialized = Hex
export type TransactionSerializedGeneric = Hex

export type Transaction<
  quantity = bigint,
  index = number,
  type extends TransactionType = 'native',
> = {
  blockHash: Hex
  blockNumber: quantity
  from: Address
  gas: quantity
  hash: Hex
  input: Hex
  nonce: index
  r: Hex
  s: Hex
  to: Address | null
  type: type
  typeHex: Hex | null
  v: quantity
  value: quantity
  yParity: number
}

export type TransactionReceipt<
  quantity = bigint,
  index = number,
  status = 'success' | 'reverted',
  type extends TransactionType = 'native',
> = {
  blockHash: Hex
  blockNumber: quantity
  contractAddress: Address | null | undefined
  cumulativeGasUsed: quantity
  effectiveGasPrice: quantity
  from: Address
  gasUsed: quantity
  logs: unknown[]
  logsBloom: Hex
  status: status
  to: Address | null
  transactionHash: Hex
  transactionIndex: index
  type: type
}

export type SignatureValues = Signature<0 | 1, bigint>
