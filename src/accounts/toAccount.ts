import {
  InvalidAddressError,
  type InvalidAddressErrorType,
} from '../errors/address.js'
import type { ErrorType } from '../errors/utils.js'
import {
  type IsAddressErrorType,
  isAddress,
} from '../utils/address/isAddress.js'
import type {
  AccountSource,
  CustomSource,
  JsonRpcAccount,
  LocalAccount,
} from './types.js'

type GetAccountReturnType<accountSource extends AccountSource> =
  | (accountSource extends string ? JsonRpcAccount : never)
  | (accountSource extends CustomSource ? LocalAccount : never)

export type ToAccountErrorType =
  | InvalidAddressErrorType
  | IsAddressErrorType
  | ErrorType

export function toAccount<accountSource extends AccountSource>(
  source: accountSource,
): GetAccountReturnType<accountSource> {
  if (typeof source === 'string') {
    if (!isAddress(source, { strict: false }))
      throw new InvalidAddressError({ address: source })
    return {
      address: source,
      type: 'json-rpc',
    } as GetAccountReturnType<accountSource>
  }

  if (!isAddress(source.address, { strict: false }))
    throw new InvalidAddressError({ address: source.address })
  return {
    address: source.address,
    sign: source.sign,
    signMessage: source.signMessage,
    signTransaction: source.signTransaction,
    signTypedData: source.signTypedData,
    source: 'custom',
    type: 'local',
  } as GetAccountReturnType<accountSource>
}
