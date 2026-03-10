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
  const {
    chainId,
    from,
    signerType,
    sponsor,
    sponsorExpiry,
    sponsorNonce,
    sponsorPolicyHash,
    sponsorSignerType,
    to,
  } = transaction
  assertTransactionBase({ chainId, from, signerType, to })
  if (typeof sponsor === 'undefined') {
    assertSponsorFieldsAbsent(transaction)
    return
  }
  if (!isAddress(sponsor)) throw new InvalidAddressError({ address: sponsor })
  if (!sponsorSignerType?.trim())
    throw new BaseError(
      '`sponsorSignerType` is required when `sponsor` is provided.',
    )
  if (typeof sponsorNonce === 'undefined')
    throw new BaseError('`sponsorNonce` is required when `sponsor` is provided.')
  if (typeof sponsorExpiry === 'undefined')
    throw new BaseError('`sponsorExpiry` is required when `sponsor` is provided.')
  if (typeof sponsorPolicyHash === 'undefined')
    throw new BaseError(
      '`sponsorPolicyHash` is required when `sponsor` is provided.',
    )
  if (BigInt(sponsorNonce) < 0n)
    throw new BaseError('`sponsorNonce` must be greater than or equal to 0.')
  if (BigInt(sponsorExpiry) <= 0n)
    throw new BaseError('`sponsorExpiry` must be greater than 0.')
  if (!/^0x[0-9a-fA-F]{64}$/.test(sponsorPolicyHash))
    throw new BaseError(
      '`sponsorPolicyHash` must be a 32-byte hex value when `sponsor` is provided.',
    )
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

function assertSponsorFieldsAbsent(
  transaction: TransactionSerializableNative,
) {
  if (typeof transaction.sponsorSignerType !== 'undefined')
    throw new BaseError(
      '`sponsorSignerType` requires `sponsor` to be provided.',
    )
  if (typeof transaction.sponsorNonce !== 'undefined')
    throw new BaseError('`sponsorNonce` requires `sponsor` to be provided.')
  if (typeof transaction.sponsorExpiry !== 'undefined')
    throw new BaseError('`sponsorExpiry` requires `sponsor` to be provided.')
  if (typeof transaction.sponsorPolicyHash !== 'undefined')
    throw new BaseError(
      '`sponsorPolicyHash` requires `sponsor` to be provided.',
    )
}
