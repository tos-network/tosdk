import { bls12_381 } from '@noble/curves/bls12-381'

import type { ErrorType } from '../errors/utils.js'
import type { Hex } from '../types/misc.js'
import { toHex } from '../utils/encoding/toHex.js'
import { type ToAccountErrorType, toAccount } from './toAccount.js'
import type { PrivateKeyAccount } from './types.js'
import {
  type PublicKeyToAddressErrorType,
  signerPublicKeyToAddress,
} from './utils/publicKeyToAddress.js'
import { type SignErrorType, sign } from './utils/sign.js'
import { type SignMessageErrorType, signMessage } from './utils/signMessage.js'
import {
  type SignAuthorizationErrorType,
  signAuthorization,
} from './utils/signAuthorization.js'
import {
  type SignTransactionErrorType,
  signTransaction,
} from './utils/signTransaction.js'
import {
  type SignTypedDataErrorType,
  signTypedData,
} from './utils/signTypedData.js'

export type BLS12381PrivateKeyToAccountErrorType =
  | ToAccountErrorType
  | PublicKeyToAddressErrorType
  | SignErrorType
  | SignMessageErrorType
  | SignAuthorizationErrorType
  | SignTransactionErrorType
  | SignTypedDataErrorType
  | ErrorType

export function bls12381PrivateKeyToAccount(
  privateKey: Hex,
): PrivateKeyAccount {
  const publicKey = toHex(bls12_381.getPublicKey(privateKey.slice(2)))
  const address = signerPublicKeyToAddress(publicKey, 'bls12-381')

  const account = toAccount({
    address,
    signerType: 'bls12-381',
    async sign({ hash }) {
      return sign({ hash, privateKey, signerType: 'bls12-381', to: 'hex' })
    },
    async signMessage({ message }) {
      return signMessage({ message, privateKey, signerType: 'bls12-381' })
    },
    async signAuthorization(transaction) {
      return signAuthorization({
        privateKey,
        signerType: 'bls12-381',
        transaction,
      })
    },
    async signTransaction(transaction) {
      return signTransaction({
        privateKey,
        signerType: 'bls12-381',
        transaction,
      })
    },
    async signTypedData(typedData) {
      return signTypedData({
        ...typedData,
        privateKey,
        signerType: 'bls12-381',
      } as any)
    },
  })

  return {
    ...account,
    publicKey,
    signerType: 'bls12-381',
    source: 'privateKey',
  } as PrivateKeyAccount
}
