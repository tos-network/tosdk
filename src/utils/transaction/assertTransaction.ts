import {
  InvalidAddressError,
  type InvalidAddressErrorType,
} from '../../errors/address.js'
import { BaseError, type BaseErrorType } from '../../errors/base.js'
import {
  InvalidChainIdError,
  type InvalidChainIdErrorType,
} from '../../errors/chain.js'
import type { ErrorType } from '../../errors/utils.js'
import type { TransactionSerializableNative } from '../../types/transaction.js'
import { type IsAddressErrorType, isAddress } from '../address/isAddress.js'

export type AssertTransactionNativeErrorType =
  | BaseErrorType
  | IsAddressErrorType
  | InvalidAddressErrorType
  | InvalidChainIdErrorType
  | ErrorType

export function assertTransactionNative(
  transaction: TransactionSerializableNative,
) {
  const { chainId, from, signerType, to } = transaction
  if (BigInt(chainId) <= 0n)
    throw new InvalidChainIdError({ chainId: Number(chainId) })
  if (!signerType.trim())
    throw new BaseError('`signerType` is required for native transactions.')
  if (!isAddress(from)) throw new InvalidAddressError({ address: from })
  if (to && !isAddress(to)) throw new InvalidAddressError({ address: to })
}
