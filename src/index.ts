export type { Address } from 'abitype'

export type { PrivateKeyAccount } from './accounts/types.js'
export type {
  ChainEstimateFeesPerGasFnParameters,
  ChainFees,
} from './types/chain.js'
export type { FeeValuesEIP1559, FeeValuesEIP4844, FeeValuesLegacy } from './types/fee.js'
export type { Hex, Signature } from './types/misc.js'
export type { RpcLog } from './types/rpc.js'

export {
  createPublicClient,
  type CreatePublicClientErrorType,
  type PublicClient,
  type PublicClientConfig,
} from './clients/createPublicClient.js'

export {
  createWalletClient,
  type CreateWalletClientErrorType,
  type WalletClient,
  type WalletClientConfig,
} from './clients/createWalletClient.js'

export { http, type HttpTransportConfig } from './clients/transports/http.js'

export {
  parseAbi,
  parseAbiItem,
  parseAbiParameter,
  parseAbiParameters,
} from 'abitype'

export {
  encodeFunctionData,
  type EncodeFunctionDataErrorType,
  type EncodeFunctionDataParameters,
  type EncodeFunctionDataReturnType,
} from './utils/abi/encodeFunctionData.js'

export { toBytes, type ToBytesErrorType } from './utils/encoding/toBytes.js'
export {
  toHex,
  type BoolToHexErrorType,
  type BytesToHexErrorType,
  type NumberToHexErrorType,
  type StringToHexErrorType,
  type ToHexErrorType,
} from './utils/encoding/toHex.js'
export {
  keccak256,
  type Keccak256ErrorType,
} from './utils/hash/keccak256.js'
export {
  verifyMessage,
  type VerifyMessageErrorType,
} from './utils/signature/verifyMessage.js'
export {
  parseUnits,
  type ParseUnitsErrorType,
} from './utils/unit/parseUnits.js'
export { WebSocketRequestError, type WebSocketRequestErrorType } from './errors/request.js'
