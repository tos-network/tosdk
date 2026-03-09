import {
  InvalidSerializableTransactionError,
  type InvalidSerializableTransactionErrorType,
} from '../../errors/transaction.js'
import type { ErrorType } from '../../errors/utils.js'
import type {
  TransactionSerializableGeneric,
  TransactionSerializableNative,
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
  const transaction extends TransactionSerializableNative,
>(transaction: transaction): GetTransactionType<transaction> {
  if (
    transaction.type === 'native' ||
    (typeof transaction.from !== 'undefined' &&
      typeof transaction.signerType !== 'undefined')
  )
    return 'native' as GetTransactionType<transaction>

  throw new InvalidSerializableTransactionError({ transaction })
}
