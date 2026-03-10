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
import type {
  TransactionSerializableNative,
  TransactionSerializableSponsored,
} from '../../types/transaction.js'
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
  assertTransactionBase({ chainId, from, signerType, to })
}

function assertTransactionBase(transaction: {
  chainId: number | bigint
  from: string
  signerType: string
  to?: string | null | undefined
}) {
  const { chainId, from, signerType, to } = transaction
  if (BigInt(chainId) <= 0n)
    throw new InvalidChainIdError({ chainId: Number(chainId) })
  if (!signerType.trim())
    throw new BaseError('`signerType` is required for native transactions.')
  if (!isAddress(from)) throw new InvalidAddressError({ address: from })
  if (to && !isAddress(to)) throw new InvalidAddressError({ address: to })
}

export type AssertTransactionSponsoredErrorType =
  | AssertTransactionNativeErrorType
  | ErrorType

export function assertTransactionSponsored(
  transaction: TransactionSerializableSponsored,
) {
  const {
    chainId,
    from,
    signerType,
    sponsor,
    sponsorExpiry,
    sponsorNonce,
    sponsorPolicyHash,
    to,
  } = transaction

  assertTransactionBase({ chainId, from, signerType, to })

  if (!isAddress(sponsor)) throw new InvalidAddressError({ address: sponsor })
  if (BigInt(sponsorNonce) < 0n)
    throw new BaseError('`sponsorNonce` must be greater than or equal to 0.')
  if (BigInt(sponsorExpiry) <= 0n)
    throw new BaseError('`sponsorExpiry` must be greater than 0.')
  if (!/^0x[0-9a-fA-F]{64}$/.test(sponsorPolicyHash))
    throw new BaseError(
      '`sponsorPolicyHash` must be a 32-byte hex value for sponsored transactions.',
    )
}
