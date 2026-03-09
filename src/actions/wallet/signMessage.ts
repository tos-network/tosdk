import type { Account } from '../../accounts/types.js'
import {
  type ParseAccountErrorType,
  parseAccount,
} from '../../accounts/utils/parseAccount.js'
import type { SignMessageErrorType as SignMessageErrorType_account } from '../../accounts/utils/signMessage.js'
import type { Client } from '../../clients/createClient.js'
import type { Transport } from '../../clients/transports/createTransport.js'
import { AccountNotFoundError } from '../../errors/account.js'
import type { ErrorType } from '../../errors/utils.js'
import type { GetAccountParameter } from '../../types/account.js'
import type { Chain } from '../../types/chain.js'
import type { Hex, SignableMessage } from '../../types/misc.js'
import type { RequestErrorType } from '../../utils/buildRequest.js'
import {
  stringToHex,
  type ToHexErrorType,
  toHex,
} from '../../utils/encoding/toHex.js'

export type SignMessageParameters<
  account extends Account | undefined = Account | undefined,
> = GetAccountParameter<account> & {
  message: SignableMessage
}

export type SignMessageReturnType = Hex

export type SignMessageErrorType =
  | ParseAccountErrorType
  | RequestErrorType
  | SignMessageErrorType_account
  | ToHexErrorType
  | ErrorType

/**
 * Signs a personal-style message.
 *
 * - JSON-RPC Accounts: calls `personal_sign`
 * - Local Accounts: signs locally without a JSON-RPC request
 *
 * @param client - Client to use
 * @param parameters - {@link SignMessageParameters}
 * @returns The signed message. {@link SignMessageReturnType}
 */
export async function signMessage<
  chain extends Chain | undefined,
  account extends Account | undefined,
>(
  client: Client<Transport, chain, account>,
  {
    account: account_ = client.account,
    message,
  }: SignMessageParameters<account>,
): Promise<SignMessageReturnType> {
  if (!account_)
    throw new AccountNotFoundError({
      docsPath: '/docs/actions/wallet/signMessage',
    })
  const account = parseAccount(account_)

  if (account.signMessage) return account.signMessage({ message })

  const message_ = (() => {
    if (typeof message === 'string') return stringToHex(message)
    if (message.raw instanceof Uint8Array) return toHex(message.raw)
    return message.raw
  })()

  return client.request(
    {
      method: 'personal_sign',
      params: [message_, account.address],
    },
    { retryCount: 0 },
  )
}
