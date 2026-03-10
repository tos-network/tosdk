import {
  createPublicClient,
  createWalletClient,
  http,
  privateKeyToAccount,
  tosTestnet,
} from '../src/index.js'

export function buildNetworkWalletExample() {
  const account = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )

  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const walletClient = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  return {
    account,
    publicClient,
    walletClient,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { account } = buildNetworkWalletExample()
  console.log(
    JSON.stringify(
      {
        example: 'network-wallet',
        address: account.address,
        signerType: account.signerType,
      },
      null,
      2,
    ),
  )
}
