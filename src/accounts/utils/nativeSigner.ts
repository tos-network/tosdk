import { bls12_381 } from '@noble/curves/bls12-381'
import { ed25519, ristretto255 } from '@noble/curves/ed25519'
import { p256 } from '@noble/curves/nist'
import { secp256k1 } from '@noble/curves/secp256k1'
import { sha3_512 } from '@noble/hashes/sha3'

import { type ErrorType } from '../../errors/utils.js'
import type { Address } from '../../types/address.js'
import type { ByteArray, Hash, Hex, Signature } from '../../types/misc.js'
import { getAddress } from '../../utils/address/getAddress.js'
import { concat } from '../../utils/data/concat.js'
import { pad } from '../../utils/data/pad.js'
import { hexToBytes } from '../../utils/encoding/toBytes.js'
import { bytesToHex } from '../../utils/encoding/toHex.js'
import { keccak256 } from '../../utils/hash/keccak256.js'

export const blsSignatureDst = 'GTOS_BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_'

type SignerType =
  | 'secp256k1'
  | 'secp256r1'
  | 'ed25519'
  | 'bls12-381'
  | 'elgamal'

type To = 'object' | 'bytes' | 'hex'

export type NormalizeSignerTypeErrorType = ErrorType

export function normalizeSignerType(value?: string): SignerType {
  const normalized = (value || 'secp256k1').trim().toLowerCase()
  if (normalized === 'ethereum_secp256k1') return 'secp256k1'
  if (normalized === 'bls12381') return 'bls12-381'
  if (
    normalized === 'secp256k1' ||
    normalized === 'secp256r1' ||
    normalized === 'ed25519' ||
    normalized === 'bls12-381' ||
    normalized === 'elgamal'
  ) {
    return normalized
  }
  throw new Error(`Unsupported signer type: ${value || 'undefined'}`)
}

export type SignHashParameters<to extends To = 'object'> = {
  hash: Hash
  privateKey: Hex
  signerType?: string | undefined
  to?: to | To | undefined
  extraEntropy?: Hex | boolean | undefined
}

export type SignHashReturnType<to extends To = 'object'> =
  | (to extends 'object' ? Signature : never)
  | (to extends 'bytes' ? ByteArray : never)
  | (to extends 'hex' ? Hex : never)

export type VerifyHashSignatureParameters = {
  hash: Hash
  publicKey: Hex
  signerType?: string | undefined
  signature: Hex | ByteArray | Signature
}

export type VerifyHashSignatureErrorType = ErrorType

export type PublicKeyToNativeAddressParameters = {
  publicKey: Hex
  signerType?: string | undefined
}

export type PublicKeyToNativeAddressErrorType = ErrorType

export function publicKeyToNativeAddress({
  publicKey,
  signerType,
}: PublicKeyToNativeAddressParameters): Address {
  const normalizedSignerType = normalizeSignerType(signerType)
  const publicKeyBytes = hexToBytes(publicKey)
  let hashInput: Hex

  if (normalizedSignerType === 'secp256k1' || normalizedSignerType === 'secp256r1') {
    const point =
      normalizedSignerType === 'secp256k1'
        ? secp256k1.ProjectivePoint.fromHex(publicKeyBytes)
        : p256.ProjectivePoint.fromHex(publicKeyBytes)
    const uncompressed = point.toRawBytes(false)
    hashInput = bytesToHex(uncompressed.slice(1))
  } else {
    hashInput = bytesToHex(publicKeyBytes)
  }

  return getAddress(keccak256(hashInput))
}

export async function signHash<to extends To = 'object'>({
  hash,
  privateKey,
  signerType,
  to = 'object',
  extraEntropy,
}: SignHashParameters<to>): Promise<SignHashReturnType<to>> {
  const normalizedSignerType = normalizeSignerType(signerType)
  const hashBytes = hexToBytes(hash)
  const privateKeyBytes = hexToBytes(privateKey)

  const rawSignature =
    normalizedSignerType === 'secp256k1'
      ? signSecp256k1(hashBytes, privateKeyBytes, extraEntropy)
      : normalizedSignerType === 'secp256r1'
        ? signSecp256r1(hashBytes, privateKeyBytes)
        : normalizedSignerType === 'ed25519'
          ? ed25519.sign(hashBytes, privateKeyBytes)
          : normalizedSignerType === 'bls12-381'
            ? bls12_381.sign(hashBytes, privateKeyBytes, { DST: blsSignatureDst })
            : signElgamal(hashBytes, privateKeyBytes)

  const signatureObject = rawBytesToSignature(rawSignature, normalizedSignerType)
  return (() => {
    if (to === 'bytes') return signatureToCanonicalBytes(signatureObject, normalizedSignerType)
    if (to === 'hex') return signatureToCanonicalHex(signatureObject, normalizedSignerType)
    return signatureObject
  })() as SignHashReturnType<to>
}

export async function verifyHashSignature({
  hash,
  publicKey,
  signerType,
  signature,
}: VerifyHashSignatureParameters): Promise<boolean> {
  const normalizedSignerType = normalizeSignerType(signerType)
  const hashBytes = hexToBytes(hash)
  const publicKeyBytes = hexToBytes(publicKey)
  const signatureBytes = signatureToRawBytes(signature, normalizedSignerType)

  if (normalizedSignerType === 'secp256k1') {
    return secp256k1.verify(signatureBytes, hashBytes, publicKeyBytes, {
      lowS: true,
      prehash: false,
    })
  }
  if (normalizedSignerType === 'secp256r1') {
    return p256.verify(signatureBytes, hashBytes, publicKeyBytes, {
      lowS: true,
      prehash: false,
    })
  }
  if (normalizedSignerType === 'ed25519') {
    return ed25519.verify(signatureBytes, hashBytes, publicKeyBytes)
  }
  if (normalizedSignerType === 'bls12-381') {
    return bls12_381.verify(signatureBytes, hashBytes, publicKeyBytes, {
      DST: blsSignatureDst,
    })
  }
  return verifyElgamal(hashBytes, publicKeyBytes, signatureBytes)
}

export function elgamalPublicKeyFromPrivateKey(privateKey: Hex | ByteArray): ByteArray {
  const privateKeyBytes =
    typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey
  const secret = scalarFromCanonicalBytes(privateKeyBytes, 'invalid elgamal private key')
  if (secret === ristretto255.Point.Fn.ZERO) {
    throw new Error('invalid elgamal private key')
  }
  return elgamalGeneratorH()
    .multiply(ristretto255.Point.Fn.inv(secret))
    .toRawBytes()
}

export function signatureToRawBytes(
  signature: Hex | ByteArray | Signature,
  signerType?: string,
): ByteArray {
  const normalizedSignerType = normalizeSignerType(signerType)
  if (typeof signature === 'string') {
    return normalizeRawSignature(hexToBytes(signature), normalizedSignerType)
  }
  if (signature instanceof Uint8Array) {
    return normalizeRawSignature(signature, normalizedSignerType)
  }

  const expectedPartLength = normalizedSignerType === 'bls12-381' ? 48 : 32
  const r = pad(hexToBytes(signature.r as Hex), { size: expectedPartLength })
  const s = pad(hexToBytes(signature.s as Hex), { size: expectedPartLength })
  return concat([r, s])
}

function signatureToCanonicalBytes(
  signature: Signature,
  signerType: SignerType,
): ByteArray {
  if (signerType === 'secp256k1') {
    const recovery = signature.yParity ?? (signature.v === 28n ? 1 : 0)
    return concat([
      hexToBytes(signature.r as Hex),
      hexToBytes(signature.s as Hex),
      new Uint8Array([recovery === 0 ? 27 : 28]),
    ])
  }

  const partLength = signerType === 'bls12-381' ? 48 : 32
  return concat([
    pad(hexToBytes(signature.r as Hex), { size: partLength }),
    pad(hexToBytes(signature.s as Hex), { size: partLength }),
  ])
}

function signatureToCanonicalHex(
  signature: Signature,
  signerType: SignerType,
): Hex {
  return bytesToHex(signatureToCanonicalBytes(signature, signerType))
}

function normalizeRawSignature(
  signature: ByteArray,
  signerType: SignerType,
): ByteArray {
  if (signerType === 'secp256k1') {
    if (signature.length === 64) return signature
    if (signature.length === 65) return signature.slice(0, 64)
    throw new Error(`Invalid secp256k1 signature length: ${signature.length}`)
  }
  if (signerType === 'secp256r1') {
    if (signature.length === 64) return signature
    if (signature.length === 65 && signature[64] === 0) return signature.slice(0, 64)
    throw new Error(`Invalid secp256r1 signature length: ${signature.length}`)
  }
  if (signerType === 'bls12-381') {
    if (signature.length !== 96)
      throw new Error(`Invalid bls12-381 signature length: ${signature.length}`)
    return signature
  }
  if (signature.length !== 64) {
    throw new Error(`Invalid ${signerType} signature length: ${signature.length}`)
  }
  return signature
}

function rawBytesToSignature(
  signature: ByteArray,
  signerType: SignerType,
): Signature {
  if (signerType === 'secp256k1') {
    const compact = signature.length === 65 ? signature.slice(0, 64) : signature
    const recovery = signature.length === 65 ? normalizeRecovery(signature[64]!) : 0
    return {
      r: bytesToHex(compact.slice(0, 32), { size: 32 }),
      s: bytesToHex(compact.slice(32, 64), { size: 32 }),
      v: recovery ? 28n : 27n,
      yParity: recovery,
    }
  }

  const partLength = signerType === 'bls12-381' ? 48 : 32
  return {
    r: bytesToHex(signature.slice(0, partLength), { size: partLength }),
    s: bytesToHex(signature.slice(partLength), { size: partLength }),
    v: 0n,
  }
}

function signSecp256k1(
  hash: ByteArray,
  privateKey: ByteArray,
  extraEntropy?: Hex | boolean | undefined,
) {
  const options = {
    lowS: true,
    prehash: false,
    ...(extraEntropy !== undefined
      ? {
          extraEntropy:
            typeof extraEntropy === 'string'
              ? hexToBytes(extraEntropy as Hex)
              : extraEntropy,
        }
      : {}),
  } as const
  const signature = secp256k1.sign(hash, privateKey, options)
  const compact = signature.toCompactRawBytes()
  return concat([
    compact,
    new Uint8Array([signature.recovery || 0]),
  ])
}

function signSecp256r1(hash: ByteArray, privateKey: ByteArray) {
  return p256.sign(hash, privateKey, {
    lowS: true,
    prehash: false,
  }).toCompactRawBytes()
}

function normalizeRecovery(value: number) {
  if (value === 27 || value === 28) return value - 27
  return value & 1
}

function signElgamal(hash: ByteArray, privateKey: ByteArray): ByteArray {
  const secret = scalarFromCanonicalBytes(privateKey, 'invalid elgamal private key')
  if (secret === ristretto255.Point.Fn.ZERO) {
    throw new Error('invalid elgamal private key')
  }
  const k = randomElgamalScalar()
  const h = elgamalGeneratorH()
  const inverse = ristretto255.Point.Fn.inv(secret)
  const publicKey = h.multiply(inverse).toRawBytes()
  const rPoint = h.multiply(k).toRawBytes()
  const e = elgamalHashToScalar(publicKey, hash, rPoint)
  const s = ristretto255.Point.Fn.add(
    ristretto255.Point.Fn.mul(inverse, e),
    k,
  )
  return concat([
    ristretto255.Point.Fn.toBytes(s),
    ristretto255.Point.Fn.toBytes(e),
  ])
}

function verifyElgamal(
  hash: ByteArray,
  publicKey: ByteArray,
  signature: ByteArray,
): boolean {
  if (publicKey.length !== 32 || signature.length !== 64) return false
  try {
    const publicPoint = ristretto255.Point.fromBytes(publicKey)
    const s = scalarFromCanonicalBytes(signature.slice(0, 32), 'invalid elgamal signature')
    const e = scalarFromCanonicalBytes(signature.slice(32, 64), 'invalid elgamal signature')
    const h = elgamalGeneratorH()
    const rPoint = h.multiply(s).add(publicPoint.multiply(ristretto255.Point.Fn.neg(e)))
    const calculated = elgamalHashToScalar(publicKey, hash, rPoint.toRawBytes())
    return ristretto255.Point.Fn.eql(e, calculated)
  } catch {
    return false
  }
}

function scalarFromCanonicalBytes(bytes: ByteArray, errorMessage: string): bigint {
  try {
    return ristretto255.Point.Fn.fromBytes(bytes)
  } catch {
    throw new Error(errorMessage)
  }
}

function randomElgamalScalar(): bigint {
  const bytes = randomBytes(64)
  const value = ristretto255.Point.Fn.create(bytesToBigIntLE(bytes))
  if (ristretto255.Point.Fn.is0(value)) return randomElgamalScalar()
  return value
}

let cachedElgamalGeneratorH: InstanceType<typeof ristretto255.Point> | undefined

function elgamalGeneratorH() {
  if (!cachedElgamalGeneratorH) {
    const base = ristretto255.Point.BASE.toRawBytes()
    cachedElgamalGeneratorH = ristretto255.Point.hashToCurve(sha3_512(base))
  }
  return cachedElgamalGeneratorH
}

function elgamalHashToScalar(
  publicKey: ByteArray,
  hash: ByteArray,
  point: ByteArray,
): bigint {
  return ristretto255.Point.Fn.create(
    bytesToBigIntLE(sha3_512(concat([publicKey, hash, point]))),
  )
}

function bytesToBigIntLE(bytes: ByteArray): bigint {
  let value = 0n
  for (let index = bytes.length - 1; index >= 0; index--) {
    value = (value << 8n) + BigInt(bytes[index]!)
  }
  return value
}

function randomBytes(length: number): Uint8Array {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('crypto.getRandomValues is required')
  }
  return cryptoApi.getRandomValues(new Uint8Array(length))
}
