import {
  createPublicClient,
  createWalletClient,
  elgamalPrivateKeyToAccount,
  http,
  tosTestnet,
} from '../src/index.js'
import type {
  Address,
  PrivShieldParameters,
  PrivTransferParameters,
  PrivUnshieldParameters,
} from '../src/index.js'

function hexBlob(byte: string, size: number): `0x${string}` {
  return `0x${byte.repeat(size)}` as `0x${string}`
}

export function buildPrivacyWalletExample() {
  const privacyAccount = elgamalPrivateKeyToAccount(
    '0x0100000000000000000000000000000000000000000000000000000000000000',
  )

  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const walletClient = createWalletClient({
    account: privacyAccount,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const sampleTransfer: PrivTransferParameters = {
    from: privacyAccount.publicKey,
    to: hexBlob('11', 32),
    privNonce: 7n,
    fee: 3n,
    feeLimit: 5n,
    commitment: hexBlob('22', 32),
    senderHandle: hexBlob('33', 32),
    receiverHandle: hexBlob('44', 32),
    sourceCommitment: hexBlob('55', 32),
    ctValidityProof: hexBlob('66', 160),
    commitmentEqProof: hexBlob('77', 192),
    rangeProof: hexBlob('88', 736),
    encryptedMemo: hexBlob('99', 48),
    memoSenderHandle: hexBlob('aa', 32),
    memoReceiverHandle: hexBlob('bb', 32),
    s: hexBlob('cc', 32),
    e: hexBlob('dd', 32),
  }

  const sampleShield: PrivShieldParameters = {
    pubkey: privacyAccount.publicKey,
    recipient: hexBlob('12', 32),
    privNonce: 8n,
    fee: 2n,
    amount: 50n,
    commitment: hexBlob('23', 32),
    handle: hexBlob('34', 32),
    shieldProof: hexBlob('45', 96),
    rangeProof: hexBlob('56', 672),
    s: hexBlob('67', 32),
    e: hexBlob('78', 32),
  }

  const sampleUnshield: PrivUnshieldParameters = {
    pubkey: privacyAccount.publicKey,
    recipient:
      '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266' as Address,
    privNonce: 9n,
    fee: 4n,
    amount: 75n,
    sourceCommitment: hexBlob('89', 32),
    commitmentEqProof: hexBlob('9a', 192),
    rangeProof: hexBlob('ab', 672),
    s: hexBlob('bc', 32),
    e: hexBlob('cd', 32),
  }

  return {
    privacyAccount,
    publicClient,
    walletClient,
    readEncryptedBalance(blockTag: 'latest' | 'pending' | bigint = 'latest') {
      return publicClient.privGetBalance({
        pubkey: privacyAccount.publicKey,
        blockTag,
      })
    },
    readPrivNonce(blockTag: 'latest' | 'pending' | bigint = 'pending') {
      return publicClient.privGetNonce({
        pubkey: privacyAccount.publicKey,
        blockTag,
      })
    },
    submitPreparedTransfer(parameters: PrivTransferParameters = sampleTransfer) {
      return walletClient.privTransfer(parameters)
    },
    submitPreparedShield(parameters: PrivShieldParameters = sampleShield) {
      return walletClient.privShield(parameters)
    },
    submitPreparedUnshield(parameters: PrivUnshieldParameters = sampleUnshield) {
      return walletClient.privUnshield(parameters)
    },
    sampleTransfer,
    sampleShield,
    sampleUnshield,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const example = buildPrivacyWalletExample()
  console.log(
    JSON.stringify(
      {
        example: 'privacy-wallet',
        publicKey: example.privacyAccount.publicKey,
        methods: [
          'privGetBalance',
          'privGetNonce',
          'privTransfer',
          'privShield',
          'privUnshield',
        ],
      },
      null,
      2,
    ),
  )
}
