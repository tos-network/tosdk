import type { ErrorType } from '../../errors/utils.js'
import type { Signature } from '../../types/misc.js'
import type { TransactionSerializableSponsored } from '../../types/transaction.js'
import {
  type HashTransactionErrorType,
  hashTransaction,
} from '../../utils/transaction/hashTransaction.js'

import { type SignErrorType, sign } from './sign.js'

export type SignSponsoredExecutionParameters = {
  privateKey: `0x${string}`
  transaction: TransactionSerializableSponsored
}

export type SignSponsoredExecutionErrorType =
  | HashTransactionErrorType
  | SignErrorType
  | ErrorType

export async function signSponsoredExecution(
  parameters: SignSponsoredExecutionParameters,
): Promise<Signature> {
  const { privateKey, transaction } = parameters
  return sign({
    hash: hashTransaction(transaction),
    privateKey,
    to: 'object',
  })
}
