import type { ErrorType } from '../../errors/utils.js'
import type { Signature } from '../../types/misc.js'
import type { TransactionSerializableNative } from '../../types/transaction.js'
import {
  type HashTransactionErrorType,
  hashTransaction,
} from '../../utils/transaction/hashTransaction.js'

import { type SignErrorType, sign } from './sign.js'

export type SignAuthorizationParameters = {
  privateKey: `0x${string}`
  transaction: TransactionSerializableNative
}

export type SignAuthorizationErrorType =
  | HashTransactionErrorType
  | SignErrorType
  | ErrorType

export async function signAuthorization(
  parameters: SignAuthorizationParameters,
): Promise<Signature> {
  const { privateKey, transaction } = parameters
  return sign({
    hash: hashTransaction(transaction),
    privateKey,
    to: 'object',
  })
}
