import type { TypedData } from 'abitype'

import type { Account } from '../../accounts/types.js'
import {
  type ParseAccountErrorType,
  parseAccount,
} from '../../accounts/utils/parseAccount.js'
import type { SignTypedDataErrorType as SignTypedDataErrorType_account } from '../../accounts/utils/signTypedData.js'
import type { Client } from '../../clients/createClient.js'
import type { Transport } from '../../clients/transports/createTransport.js'
import {
  AccountNotFoundError,
  type AccountNotFoundErrorType,
} from '../../errors/account.js'
import type { ErrorType } from '../../errors/utils.js'
import type { GetAccountParameter } from '../../types/account.js'
import type { Chain } from '../../types/chain.js'
import type { Hex } from '../../types/misc.js'
import type { TypedDataDefinition } from '../../types/typedData.js'
import type { RequestErrorType } from '../../utils/buildRequest.js'
import type { IsHexErrorType } from '../../utils/data/isHex.js'
import type { StringifyErrorType } from '../../utils/stringify.js'
import {
  type GetTypesForEIP712DomainErrorType,
  getTypesForEIP712Domain,
  type SerializeTypedDataErrorType,
  serializeTypedData,
  type ValidateTypedDataErrorType,
  validateTypedData,
} from '../../utils/typedData.js'

export type SignTypedDataParameters<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  account extends Account | undefined = undefined,
  ///
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
> = TypedDataDefinition<typedData, primaryType, primaryTypes> &
  GetAccountParameter<account>

export type SignTypedDataReturnType = Hex

export type SignTypedDataErrorType =
  | AccountNotFoundErrorType
  | ParseAccountErrorType
  | GetTypesForEIP712DomainErrorType
  | ValidateTypedDataErrorType
  | StringifyErrorType
  | SignTypedDataErrorType_account
  | IsHexErrorType
  | RequestErrorType
  | SerializeTypedDataErrorType
  | ErrorType

/**
 * Signs typed structured data using the standard typed-data hash construction.
 *
 * - JSON-RPC Accounts: calls `eth_signTypedData_v4`
 * - Local Accounts: signs locally without a JSON-RPC request
 *
 * @param client - Client to use
 * @param parameters - {@link SignTypedDataParameters}
 * @returns The signed data. {@link SignTypedDataReturnType}
 */
export async function signTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
  chain extends Chain | undefined,
  account extends Account | undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: SignTypedDataParameters<typedData, primaryType, account>,
): Promise<SignTypedDataReturnType> {
  const {
    account: account_ = client.account,
    domain,
    message,
    primaryType,
  } = parameters as unknown as SignTypedDataParameters

  if (!account_)
    throw new AccountNotFoundError({
      docsPath: '/docs/actions/wallet/signTypedData',
    })
  const account = parseAccount(account_)

  const types = {
    EIP712Domain: getTypesForEIP712Domain({ domain }),
    ...parameters.types,
  }

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  validateTypedData({ domain, message, primaryType, types })

  if (account.signTypedData)
    return account.signTypedData({ domain, message, primaryType, types })

  const typedData = serializeTypedData({ domain, message, primaryType, types })
  return client.request(
    {
      method: 'eth_signTypedData_v4',
      params: [account.address, typedData],
    },
    { retryCount: 0 },
  )
}
