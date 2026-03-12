/**
 * Signer Builder Pack
 *
 * Demonstrates key management and signing workflows:
 * - Generate and import private keys
 * - Sign transactions
 * - Verify hash signatures
 * - Use different signer types (secp256k1, secp256r1, bls12-381)
 */
import {
  generatePrivateKey,
  privateKeyToAccount,
  secp256r1PrivateKeyToAccount,
  bls12381PrivateKeyToAccount,
  signHash,
  verifyHashSignature,
  publicKeyToNativeAddress,
  normalizeSignerType,
  hashTransaction,
  serializeTransaction,
} from '../src/index.js'
import type { Hex } from '../src/index.js'

export function buildSignerPack() {
  /** Generate a fresh secp256k1 account */
  function createSecp256k1Account() {
    const privateKey = generatePrivateKey()
    return privateKeyToAccount(privateKey)
  }

  /** Generate a fresh secp256r1 account (uses secp256k1 entropy as seed) */
  function createSecp256r1Account() {
    const privateKey = generatePrivateKey()
    return secp256r1PrivateKeyToAccount(privateKey)
  }

  /** Generate a fresh BLS12-381 account (uses secp256k1 entropy as seed) */
  function createBls12381Account() {
    const privateKey = generatePrivateKey()
    return bls12381PrivateKeyToAccount(privateKey)
  }

  const demoPrivateKey =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex
  const demoAccount = privateKeyToAccount(demoPrivateKey)

  return {
    demoAccount,
    createSecp256k1Account,
    createSecp256r1Account,
    createBls12381Account,

    /** Sign a hash and verify the signature */
    async signAndVerify(hash: Hex) {
      const signature = await signHash({
        hash,
        privateKey: demoPrivateKey,
        signerType: demoAccount.signerType,
      })
      const isValid = await verifyHashSignature({
        hash,
        signature,
        publicKey: demoAccount.publicKey,
        signerType: demoAccount.signerType,
      })
      return { signature, isValid }
    },

    /** Get the native address for a public key */
    deriveAddress: publicKeyToNativeAddress,
    normalizeSignerType,

    /** Hash a transaction for signing */
    hashTransaction,
    serializeTransaction,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildSignerPack()
  console.log(
    JSON.stringify(
      {
        example: 'signer-pack',
        demoAddress: pack.demoAccount.address,
        demoSignerType: pack.demoAccount.signerType,
        supportedTypes: ['secp256k1', 'secp256r1', 'bls12-381'],
      },
      null,
      2,
    ),
  )
}
