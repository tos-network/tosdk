import { describe, expect, test } from 'vitest'

import {
  buildRequesterEnvelope,
  toDelegatedResult,
  toSponsoredResult,
  isSignerQuoteValid,
  isPaymasterQuoteValid,
  validateDelegatedRequest,
  buildEvidenceCaptureRequest,
  verifyEvidenceReceipt,
  verifyEvidenceAnchor,
  isOracleEvidenceKind,
  validateEvidenceParams,
  registerProvider,
  aggregateFleetStatus,
  filterByRole,
  validateRegistration,
  buildProofArtifactSearchParams,
  isCryptographicProofArtifactKind,
  isPublicProofArtifactKind,
  verifyProofArtifactAnchor,
  verifyProofArtifactReceipt,
} from '../src/index.js'
import type {
  Address,
  SignerQuoteResponse,
  SignerExecutionResponse,
  PaymasterQuoteResponse,
  PaymasterAuthorizationResponse,
  ArtifactVerificationReceipt,
  ArtifactAnchorSummary,
} from '../src/index.js'

const addr1 =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address
const addr2 =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address

describe('delegated execution surface', () => {
  test('buildRequesterEnvelope creates correct structure', () => {
    const envelope = buildRequesterEnvelope(addr1)
    expect(envelope.requester.identity.kind).toBe('tos')
    expect(envelope.requester.identity.value).toBe(addr1)
  })

  test('toDelegatedResult extracts fields from execution response', () => {
    const response: SignerExecutionResponse = {
      executionId: 'exec-1',
      quoteId: 'quote-1',
      requestKey: 'key-1',
      requestHash: '0x11',
      providerAddress: addr1,
      walletAddress: addr2,
      requesterAddress: addr2,
      targetAddress: addr1,
      valueWei: '0',
      dataHex: '0x',
      gas: '21000',
      policyId: 'p-1',
      policyHash: '0x22',
      scopeHash: '0x33',
      trustTier: 'self_hosted',
      requestNonce: 'nonce-1',
      requestExpiresAt: 1_900_000_000,
      status: 'confirmed',
      submittedTxHash: '0xaabb',
      createdAt: '2026-03-10T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z',
    }
    const result = toDelegatedResult(response)
    expect(result.executionId).toBe('exec-1')
    expect(result.status).toBe('confirmed')
    expect(result.txHash).toBe('0xaabb')
  })

  test('toSponsoredResult extracts fields from authorization response', () => {
    const response: PaymasterAuthorizationResponse = {
      authorizationId: 'auth-1',
      quoteId: 'quote-1',
      chainId: '1666',
      requestKey: 'key-1',
      requestHash: '0x44',
      providerAddress: addr1,
      sponsorAddress: addr2,
      sponsorSignerType: 'secp256k1',
      walletAddress: addr2,
      requesterAddress: addr2,
      requesterSignerType: 'secp256k1',
      targetAddress: addr1,
      valueWei: '0',
      dataHex: '0x',
      gas: '21000',
      policyId: 'p-1',
      policyHash: '0x22',
      scopeHash: '0x33',
      trustTier: 'self_hosted',
      requestNonce: 'nonce-1',
      requestExpiresAt: 1_900_000_000,
      executionNonce: '0',
      sponsorNonce: '5',
      sponsorExpiry: 1_900_000_000,
      status: 'authorized',
      createdAt: '2026-03-10T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z',
    }
    const result = toSponsoredResult(response)
    expect(result.authorizationId).toBe('auth-1')
    expect(result.status).toBe('authorized')
    expect(result.txHash).toBeNull()
  })

  test('isSignerQuoteValid checks expiry', () => {
    const validQuote = {
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    } as SignerQuoteResponse
    const expiredQuote = {
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    } as SignerQuoteResponse
    expect(isSignerQuoteValid(validQuote)).toBe(true)
    expect(isSignerQuoteValid(expiredQuote)).toBe(false)
  })

  test('isPaymasterQuoteValid checks expiry', () => {
    const validQuote = {
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    } as PaymasterQuoteResponse
    expect(isPaymasterQuoteValid(validQuote)).toBe(true)
  })

  test('validateDelegatedRequest catches errors', () => {
    const errors = validateDelegatedRequest({
      target: '' as Address,
      gas: '-1',
      valueWei: '-100',
    })
    expect(errors).toContain('target address is required')
    expect(errors).toContain('gas must be a positive number')
    expect(errors).toContain('valueWei must be a non-negative number')
  })

  test('validateDelegatedRequest passes for valid request', () => {
    const errors = validateDelegatedRequest({
      target: addr1,
      gas: '21000',
      valueWei: '0',
    })
    expect(errors).toHaveLength(0)
  })
})

describe('evidence surface', () => {
  test('buildEvidenceCaptureRequest creates correct structure', () => {
    const request = buildEvidenceCaptureRequest({
      requesterAddress: addr1,
      title: 'Test Evidence',
      question: 'Is this valid?',
      evidenceText: 'Evidence data here.',
    })
    expect(request.requester.identity.value).toBe(addr1)
    expect(request.capability).toBe('capture.oracle.evidence')
    expect(request.auto_anchor).toBe(true)
    expect(request.title).toBe('Test Evidence')
    expect(request.question).toBe('Is this valid?')
    expect(request.request_nonce).toMatch(/^evidence-/)
  })

  test('verifyEvidenceReceipt returns hash and status', () => {
    const receipt: ArtifactVerificationReceipt = {
      version: 1,
      verificationId: 'v-1',
      artifactId: 'a-1',
      kind: 'oracle.evidence',
      cid: 'bafytest',
      bundleHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      verifierAddress: addr1,
      status: 'verified',
      responseHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      checkedAt: '2026-03-10T00:00:00Z',
    }
    const result = verifyEvidenceReceipt(receipt)
    expect(result.isVerified).toBe(true)
    expect(result.receiptHash).toMatch(/^0x/)
    expect(result.canonical).toBeTruthy()
  })

  test('verifyEvidenceAnchor returns hash', () => {
    const summary: ArtifactAnchorSummary = {
      version: 1,
      anchorId: 'anchor-1',
      artifactId: 'a-1',
      kind: 'oracle.evidence',
      cid: 'bafytest',
      bundleHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      createdAt: '2026-03-10T00:00:00Z',
    }
    const result = verifyEvidenceAnchor(summary)
    expect(result.summaryHash).toMatch(/^0x/)
    expect(result.anchorId).toBe('anchor-1')
  })

  test('isOracleEvidenceKind identifies oracle types', () => {
    expect(isOracleEvidenceKind('oracle.evidence')).toBe(true)
    expect(isOracleEvidenceKind('oracle.aggregate')).toBe(true)
    expect(isOracleEvidenceKind('public_news.capture')).toBe(false)
    expect(isOracleEvidenceKind('committee.vote')).toBe(false)
  })

  test('validateEvidenceParams catches missing fields', () => {
    const errors = validateEvidenceParams({
      requesterAddress: '' as Address,
      title: '',
      question: '',
      evidenceText: '',
    })
    expect(errors).toContain('requesterAddress is required')
    expect(errors).toContain('title is required')
    expect(errors).toContain('question is required')
    expect(errors).toContain('evidenceText is required')
  })

  test('validateEvidenceParams passes for valid params', () => {
    const errors = validateEvidenceParams({
      requesterAddress: addr1,
      title: 'Test',
      question: 'Q?',
      evidenceText: 'E',
    })
    expect(errors).toHaveLength(0)
  })
})

describe('operator control surface', () => {
  test('registerProvider creates registration', () => {
    const reg = registerProvider({
      address: addr1,
      role: 'signer',
      baseUrl: 'https://signer.example.com/',
    })
    expect(reg.address).toBe(addr1)
    expect(reg.role).toBe('signer')
    expect(reg.baseUrl).toBe('https://signer.example.com')
  })

  test('aggregateFleetStatus computes totals', () => {
    const statuses = [
      { address: addr1, role: 'signer' as const, baseUrl: 'url1', healthy: true, checkedAt: '' },
      { address: addr2, role: 'paymaster' as const, baseUrl: 'url2', healthy: false, checkedAt: '', error: 'timeout' },
    ]
    const fleet = aggregateFleetStatus(statuses)
    expect(fleet.total).toBe(2)
    expect(fleet.healthy).toBe(1)
    expect(fleet.unhealthy).toBe(1)
  })

  test('filterByRole filters correctly', () => {
    const regs = [
      registerProvider({ address: addr1, role: 'signer', baseUrl: 'https://a.com' }),
      registerProvider({ address: addr2, role: 'paymaster', baseUrl: 'https://b.com' }),
      registerProvider({ address: addr1, role: 'signer', baseUrl: 'https://c.com' }),
    ]
    const signers = filterByRole(regs, 'signer')
    expect(signers).toHaveLength(2)
    const paymasters = filterByRole(regs, 'paymaster')
    expect(paymasters).toHaveLength(1)
  })

  test('validateRegistration catches invalid data', () => {
    const errors = validateRegistration({
      address: '' as Address,
      role: 'invalid' as any,
      baseUrl: 'not-a-url',
    })
    expect(errors).toContain('address is required')
    expect(errors.some((e) => e.includes('role must be'))).toBe(true)
    expect(errors).toContain('baseUrl must be a valid URL')
  })

  test('validateRegistration passes for valid data', () => {
    const errors = validateRegistration({
      address: addr1,
      role: 'signer',
      baseUrl: 'https://signer.example.com',
    })
    expect(errors).toHaveLength(0)
  })
})

describe('proof market surface', () => {
  test('classifies public proof artifact kinds', () => {
    expect(isPublicProofArtifactKind('zktls.bundle')).toBe(true)
    expect(isPublicProofArtifactKind('committee.aggregate')).toBe(true)
    expect(isPublicProofArtifactKind('proof.verifier_receipt')).toBe(true)
    expect(isPublicProofArtifactKind('public_news.capture')).toBe(false)
  })

  test('classifies cryptographic proof artifact kinds', () => {
    expect(isCryptographicProofArtifactKind('zktls.bundle')).toBe(true)
    expect(isCryptographicProofArtifactKind('proof.material')).toBe(true)
    expect(isCryptographicProofArtifactKind('committee.vote')).toBe(false)
  })

  test('builds bounded proof artifact search params', () => {
    const params = buildProofArtifactSearchParams({
      kinds: ['zktls.bundle', 'committee.aggregate'],
      sourceUrlPrefix: ' https://news.example.com ',
      subjectId: ' headline-1 ',
      verifiedOnly: true,
      anchoredOnly: true,
    })
    expect(params.kinds).toEqual(['zktls.bundle', 'committee.aggregate'])
    expect(params.sourceUrlPrefix).toBe('https://news.example.com')
    expect(params.subjectId).toBe('headline-1')
    expect(params.verifiedOnly).toBe(true)
    expect(params.anchoredOnly).toBe(true)
  })

  test('verifies proof receipts and anchors', () => {
    const receipt = verifyProofArtifactReceipt({
      version: 1,
      verificationId: 'proof-1',
      artifactId: 'artifact-1',
      kind: 'proof.verifier_receipt',
      cid: 'bafyproof',
      bundleHash:
        '0x1111111111111111111111111111111111111111111111111111111111111111',
      verifierAddress: addr1,
      status: 'verified',
      responseHash:
        '0x2222222222222222222222222222222222222222222222222222222222222222',
      checkedAt: '2026-03-10T00:00:00Z',
    })
    expect(receipt.status).toBe('verified')
    expect(receipt.receiptHash).toMatch(/^0x/)

    const anchor = verifyProofArtifactAnchor({
      version: 1,
      anchorId: 'anchor-1',
      artifactId: 'artifact-1',
      kind: 'committee.aggregate',
      cid: 'bafyproof',
      bundleHash:
        '0x3333333333333333333333333333333333333333333333333333333333333333',
      createdAt: '2026-03-10T00:00:00Z',
    })
    expect(anchor.kind).toBe('committee.aggregate')
    expect(anchor.summaryHash).toMatch(/^0x/)
  })
})
