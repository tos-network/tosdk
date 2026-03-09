import type { ErrorType } from '../../errors/utils.js'
import type {
  Hex,
  Signature,
} from '../../types/misc.js'
import type {
  TransactionSerializable,
  TransactionSerializableNative,
  TransactionSerializableGeneric,
  TransactionSerialized,
  TransactionSerializedNative,
  TransactionType,
} from '../../types/transaction.js'
import type { MaybePromise } from '../../types/utils.js'
import { type ConcatHexErrorType, concatHex } from '../data/concat.js'
import {
  bytesToHex,
  type NumberToHexErrorType,
  numberToHex,
} from '../encoding/toHex.js'
import { type ToRlpErrorType, toRlp } from '../encoding/toRlp.js'
import {
  type AssertTransactionNativeErrorType,
  assertTransactionNative,
} from './assertTransaction.js'
import {
  type GetTransactionType,
  type GetTransactionTypeErrorType,
  getTransactionType,
} from './getTransactionType.js'

export type SerializedTransactionReturnType<
  _transactionType extends TransactionType = TransactionType,
> = TransactionSerialized

export type SerializeTransactionFn<
  transaction extends TransactionSerializableGeneric = TransactionSerializable,
  _transactionType extends TransactionType = TransactionType,
> = (
  transaction: transaction,
  signature?: Signature | undefined,
) => MaybePromise<TransactionSerialized>

export type SerializeTransactionErrorType =
  | GetTransactionTypeErrorType
  | SerializeTransactionNativeErrorType
  | ErrorType

export function serializeTransaction(
  transaction: TransactionSerializable,
  signature?: Signature | undefined,
): TransactionSerialized {
  const type = getTransactionType(transaction as any) as GetTransactionType
  if (type !== 'native') throw new Error(`Unsupported transaction type: ${type}`)
  return serializeTransactionNative(
    transaction as TransactionSerializableNative,
    signature,
  ) as TransactionSerialized
}

type SerializeTransactionNativeErrorType =
  | AssertTransactionNativeErrorType
  | ConcatHexErrorType
  | NumberToHexErrorType
  | ToRlpErrorType
  | ErrorType

function serializeTransactionNative(
  transaction: TransactionSerializableNative,
  signature?: Signature | undefined,
): TransactionSerializedNative {
  const { chainId, data, from, gas, nonce, signerType, to, value } = transaction

  assertTransactionNative(transaction)

  const serializedTransaction = [
    toMinimalQuantityHex(chainId),
    toMinimalQuantityHex(nonce),
    toMinimalQuantityHex(gas),
    to ?? '0x',
    toMinimalQuantityHex(value),
    data ?? '0x',
    [],
    from,
    bytesToHex(new TextEncoder().encode(signerType)),
    ...toNativeSignatureArray(signature),
  ]

  return concatHex(['0x00', toRlp(serializedTransaction)]) as TransactionSerializedNative
}

function toNativeSignatureArray(signature?: Signature | undefined) {
  if (!signature) return []
  return [
    toMinimalQuantityHex(signature.v ?? BigInt(signature.yParity ?? 0)),
    rlpHex(signature.r),
    rlpHex(signature.s),
  ]
}

function toMinimalQuantityHex(value: number | bigint | undefined): Hex {
  if (typeof value === 'undefined') return '0x'
  return rlpHex(numberToHex(value))
}

function rlpHex(hex: Hex): Hex {
  if (hex === '0x') return hex
  return hex.replace(/^0x0+/, '0x').replace(/^0x$/, '0x0') as Hex
}
