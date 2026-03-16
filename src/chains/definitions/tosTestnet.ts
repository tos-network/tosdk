import { defineChain } from '../../utils/chain/defineChain.js'

export const tosTestnet = /*#__PURE__*/ defineChain({
  id: 60600,
  name: 'TOS Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TOS',
    symbol: 'TOS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-testnet.potos.hk'],
    },
  },
  blockExplorers: {
    default: {
      name: 'TOS Testnet explorer',
      url: 'https://scan-testnet.potos.hk',
    },
  },
  testnet: true,
})
