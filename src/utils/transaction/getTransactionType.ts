import {
  InvalidSerializableTransactionError,
  type InvalidSerializableTransactionErrorType,
} from '../../errors/transaction.js'
import type { ErrorType } from '../../errors/utils.js'
import type {
  TransactionSerializableGeneric,
} from '../../types/transaction.js'
import type { IsNever } from '../../types/utils.js'

export type GetTransactionType<
  transaction extends TransactionSerializableGeneric = TransactionSerializableGeneric,
  result =
    transaction['type'] extends TransactionSerializableGeneric['type']
      ? Extract<transaction['type'], string>
      : never,
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

export type GetTransactionTypeErrorType =
  | InvalidSerializableTransactionErrorType
  | ErrorType

export function getTransactionType<
  const transaction extends TransactionSerializableGeneric,
>(transaction: transaction): GetTransactionType<transaction> {
  const tx = transaction as any
  if (
    tx.type === 'native' ||
    (typeof tx.from !== 'undefined' &&
      typeof tx.signerType !== 'undefined' &&
      typeof tx.sponsor === 'undefined')
  )
    return 'native' as GetTransactionType<transaction>

  if (
    tx.type === 'sponsored' ||
    (typeof tx.sponsor !== 'undefined' && typeof tx.from !== 'undefined')
  )
    return 'sponsored' as GetTransactionType<transaction>

  throw new InvalidSerializableTransactionError({ transaction })
}
