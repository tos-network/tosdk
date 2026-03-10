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
  elgamalPublicKeyFromPrivateKey,
} from './utils/nativeSigner.js'
import {
  type SignTransactionErrorType,
  signTransaction,
} from './utils/signTransaction.js'
import {
  type SignTypedDataErrorType,
  signTypedData,
} from './utils/signTypedData.js'

export type ElgamalPrivateKeyToAccountErrorType =
  | ToAccountErrorType
  | PublicKeyToAddressErrorType
  | SignErrorType
  | SignMessageErrorType
  | SignAuthorizationErrorType
  | SignTransactionErrorType
  | SignTypedDataErrorType
  | ErrorType

export function elgamalPrivateKeyToAccount(
  privateKey: Hex,
): PrivateKeyAccount {
  const publicKey = toHex(elgamalPublicKeyFromPrivateKey(privateKey))
  const address = signerPublicKeyToAddress(publicKey, 'elgamal')

  const account = toAccount({
    address,
    signerType: 'elgamal',
    async sign({ hash }) {
      return sign({ hash, privateKey, signerType: 'elgamal', to: 'hex' })
    },
    async signMessage({ message }) {
      return signMessage({ message, privateKey, signerType: 'elgamal' })
    },
    async signAuthorization(transaction) {
      return signAuthorization({
        privateKey,
        signerType: 'elgamal',
        transaction,
      })
    },
    async signTransaction(transaction) {
      return signTransaction({
        privateKey,
        signerType: 'elgamal',
        transaction,
      })
    },
    async signTypedData(typedData) {
      return signTypedData({
        ...typedData,
        privateKey,
        signerType: 'elgamal',
      } as any)
    },
  })

  return {
    ...account,
    publicKey,
    signerType: 'elgamal',
    source: 'privateKey',
  } as PrivateKeyAccount
}
