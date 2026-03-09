import { defineChain } from '../../utils/chain/defineChain.js'

export const tos = /*#__PURE__*/ defineChain({
  id: 60603,
  name: 'TOS Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TOS',
    symbol: 'TOS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.potos.hk'],
    },
  },
  blockExplorers: {
    default: {
      name: 'TOS Mainnet explorer',
      url: 'https://scan.potos.hk',
    },
  },
  testnet: false,
})
