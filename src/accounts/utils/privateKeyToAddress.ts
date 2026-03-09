import { secp256k1 } from '@noble/curves/secp256k1'

import type { ErrorType } from '../../errors/utils.js'
import type { Address } from '../../types/address.js'
import type { Hex } from '../../types/misc.js'
import {
  type BytesToHexErrorType,
  bytesToHex,
} from '../../utils/encoding/toHex.js'
import {
  type PublicKeyToAddressErrorType,
  publicKeyToAddress,
} from './publicKeyToAddress.js'

export type PrivateKeyToAddressErrorType =
  | BytesToHexErrorType
  | PublicKeyToAddressErrorType
  | ErrorType

/**
 * @description Converts an ECDSA private key to a 32-byte native address.
 *
 * @param privateKey The private key to convert.
 *
 * @returns The address.
 */
export function privateKeyToAddress(privateKey: Hex): Address {
  const publicKey = bytesToHex(
    secp256k1.getPublicKey(privateKey.slice(2), false),
  )
  return publicKeyToAddress(publicKey)
}
