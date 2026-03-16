import type { ErrorType } from '../../errors/utils.js'
import type { Hash } from '../../types/misc.js'
import type { TransactionSerializable } from '../../types/transaction.js'
import {
  type Keccak256ErrorType,
  keccak256,
} from '../hash/keccak256.js'
import {
  type SerializeTransactionErrorType,
  serializeTransaction,
} from './serializeTransaction.js'

export type HashTransactionErrorType =
  | SerializeTransactionErrorType
  | Keccak256ErrorType
  | ErrorType

export function hashTransaction(
  transaction: TransactionSerializable,
): Hash {
  return keccak256(serializeTransaction(transaction)) as Hash
}
