import type { TypedData } from 'abitype'
import type { HDKey } from '@scure/bip32'

import type { Address } from '../types/address.js'
import type { Hash, Hex, SignableMessage, Signature } from '../types/misc.js'
import type { TransactionSerializableNative } from '../types/transaction.js'
import type { TypedDataDefinition } from '../types/typedData.js'
import type { OneOf, Prettify } from '../types/utils.js'

export type Account<address extends Address = Address> = OneOf<
  RemoteAccount<address> | LocalAccount<string, address>
>

export type AccountSource = Address | CustomSource

export type CustomSource = {
  address: Address
  signerType?: string | undefined
  sign?: ((parameters: { hash: Hash }) => Promise<Hex>) | undefined
  signMessage: ({ message }: { message: SignableMessage }) => Promise<Hex>
  signAuthorization: (
    transaction: TransactionSerializableNative,
  ) => Promise<Signature>
  signTransaction: (transaction: TransactionSerializableNative) => Promise<Hex>
  signTypedData: <
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  >(
    parameters: TypedDataDefinition<typedData, primaryType>,
  ) => Promise<Hex>
}

export type RemoteAccount<address extends Address = Address> = {
  address: address
  type: 'remote'
}

export type LocalAccount<
  source extends string = string,
  address extends Address = Address,
> = Prettify<
  CustomSource & {
    address: address
    publicKey: Hex
    signerType: string
    source: source
    type: 'local'
  }
>

export type HDAccount = Prettify<
  LocalAccount<'hd'> & {
    getHdKey(): HDKey
    sign: NonNullable<CustomSource['sign']>
  }
>

export type HDOptions =
  | {
      accountIndex?: number | undefined
      addressIndex?: number | undefined
      changeIndex?: number | undefined
      path?: undefined
    }
  | {
      accountIndex?: undefined
      addressIndex?: undefined
      changeIndex?: undefined
      path: `m/44'/60'/${string}`
    }

export type PrivateKeyAccount = Prettify<
  LocalAccount<'privateKey'> & {
    sign: NonNullable<CustomSource['sign']>
  }
>
