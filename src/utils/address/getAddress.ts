import type { Address } from 'abitype'

import { InvalidAddressError } from '../../errors/address.js'
import type { ErrorType } from '../../errors/utils.js'
import { LruMap } from '../lru.js'
import { type IsAddressErrorType, isAddress } from './isAddress.js'

const checksumAddressCache = /*#__PURE__*/ new LruMap<Address>(8192)

export type ChecksumAddressErrorType = ErrorType

export function checksumAddress(
  address_: Address,
  chainId?: number | undefined,
): Address {
  if (checksumAddressCache.has(`${address_}.${chainId}`))
    return checksumAddressCache.get(`${address_}.${chainId}`)!
  const result = address_.toLowerCase() as Address
  checksumAddressCache.set(`${address_}.${chainId}`, result)
  return result
}

export type GetAddressErrorType =
  | ChecksumAddressErrorType
  | IsAddressErrorType
  | ErrorType

export function getAddress(
  address: string,
  chainId?: number,
): Address {
  if (!isAddress(address, { strict: false }))
    throw new InvalidAddressError({ address })
  return checksumAddress(address, chainId)
}
