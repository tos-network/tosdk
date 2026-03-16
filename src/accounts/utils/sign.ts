// TODO(v3): Convert to sync.

import type { ErrorType } from '../../errors/utils.js'
import type { ByteArray, Hex, Signature } from '../../types/misc.js'
import type { IsHexErrorType } from '../../utils/data/isHex.js'
import { type HexToBytesErrorType } from '../../utils/encoding/toBytes.js'
import { type NumberToHexErrorType } from '../../utils/encoding/toHex.js'

import { signHash } from './nativeSigner.js'

type To = 'object' | 'bytes' | 'hex'

export type SignParameters<to extends To = 'object'> = {
  hash: Hex
  privateKey: Hex
  signerType?: string | undefined
  to?: to | To | undefined
}

export type SignReturnType<to extends To = 'object'> =
  | (to extends 'object' ? Signature : never)
  | (to extends 'bytes' ? ByteArray : never)
  | (to extends 'hex' ? Hex : never)

export type SignErrorType =
  | HexToBytesErrorType
  | IsHexErrorType
  | NumberToHexErrorType
  | ErrorType

let extraEntropy: Hex | boolean = false

/**
 * Sets extra entropy for signing functions.
 */
export function setSignEntropy(entropy: true | Hex) {
  if (!entropy) throw new Error('must be a `true` or a hex value.')
  extraEntropy = entropy
}

/**
 * @description Signs a hash with a given private key.
 *
 * @param hash The hash to sign.
 * @param privateKey The private key to sign with.
 *
 * @returns The signature.
 */
export async function sign<to extends To = 'object'>({
  hash,
  privateKey,
  signerType,
  to = 'object',
}: SignParameters<to>): Promise<SignReturnType<to>> {
  return signHash({
    hash,
    privateKey,
    signerType,
    to,
    extraEntropy,
  }) as Promise<SignReturnType<to>>
}
