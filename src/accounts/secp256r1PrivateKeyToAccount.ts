import { p256 } from '@noble/curves/nist'

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

export type Secp256r1PrivateKeyToAccountErrorType =
  | ToAccountErrorType
  | PublicKeyToAddressErrorType
  | SignErrorType
  | SignMessageErrorType
  | SignAuthorizationErrorType
  | SignTransactionErrorType
  | SignTypedDataErrorType
  | ErrorType

export function secp256r1PrivateKeyToAccount(
  privateKey: Hex,
): PrivateKeyAccount {
  const publicKey = toHex(p256.getPublicKey(privateKey.slice(2), false))
  const address = signerPublicKeyToAddress(publicKey, 'secp256r1')

  const account = toAccount({
    address,
    signerType: 'secp256r1',
    async sign({ hash }) {
      return sign({ hash, privateKey, signerType: 'secp256r1', to: 'hex' })
    },
    async signMessage({ message }) {
      return signMessage({ message, privateKey, signerType: 'secp256r1' })
    },
    async signAuthorization(transaction) {
      return signAuthorization({
        privateKey,
        signerType: 'secp256r1',
        transaction,
      })
    },
    async signTransaction(transaction) {
      return signTransaction({
        privateKey,
        signerType: 'secp256r1',
        transaction,
      })
    },
    async signTypedData(typedData) {
      return signTypedData({
        ...typedData,
        privateKey,
        signerType: 'secp256r1',
      } as any)
    },
  })

  return {
    ...account,
    publicKey,
    signerType: 'secp256r1',
    source: 'privateKey',
  } as PrivateKeyAccount
}
