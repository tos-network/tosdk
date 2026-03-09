import type { ErrorType } from '../../errors/utils.js'
import type { Address } from '../../types/address.js'
import type { Hex } from '../../types/misc.js'
import {
  type GetAddressErrorType,
  getAddress,
} from '../../utils/address/getAddress.js'
import {
  type Keccak256ErrorType,
  keccak256,
} from '../../utils/hash/keccak256.js'
export type PublicKeyToAddressErrorType =
  | GetAddressErrorType
  | Keccak256ErrorType
  | ErrorType

/**
 * @description Converts an ECDSA public key to a 32-byte native address.
 *
 * @param publicKey The public key to convert.
 *
 * @returns The address.
 */
export function publicKeyToAddress(publicKey: Hex): Address {
  const digest = keccak256(`0x${publicKey.substring(4)}`)
  return getAddress(digest)
}
