import { describe, expect, test } from 'vitest'

import {
  SCHEMA_VERSION,
  validateAgainstSchema,
  detectDrift,
  validateBatch,
  detectBatchDrift,
  SignerQuoteRequestSchema,
  SignerQuoteResponseSchema,
  StorageQuoteRequestSchema,
  StorageReceiptSchema,
  ALL_PROVIDER_SCHEMAS,
  ALL_OPERATOR_SCHEMAS,
} from '../src/index.js'

describe('schema version', () => {
  test('SCHEMA_VERSION is a semver-like string', () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('all provider schemas have the correct version', () => {
    for (const schema of ALL_PROVIDER_SCHEMAS) {
      expect(schema.version).toBe(SCHEMA_VERSION)
    }
  })

  test('all operator schemas have the correct version', () => {
    for (const schema of ALL_OPERATOR_SCHEMAS) {
      expect(schema.version).toBe(SCHEMA_VERSION)
    }
  })
})

describe('validateAgainstSchema', () => {
  test('validates a correct SignerQuoteRequest', () => {
    const value = {
      requester: { identity: { kind: 'tos', value: '0xaaa' } },
      target: '0xbbb',
      gas: '21000',
    }
    const result = validateAgainstSchema(SignerQuoteRequestSchema, value)
    expect(result.valid).toBe(true)
    expect(result.missingRequired).toHaveLength(0)
  })

  test('detects missing required fields', () => {
    const value = {
      gas: '21000',
    }
    const result = validateAgainstSchema(SignerQuoteRequestSchema, value)
    expect(result.valid).toBe(false)
    expect(result.missingRequired).toContain('requester')
    expect(result.missingRequired).toContain('target')
  })

  test('detects extra fields', () => {
    const value = {
      requester: { identity: { kind: 'tos', value: '0xaaa' } },
      target: '0xbbb',
      unknownField: 'extra',
    }
    const result = validateAgainstSchema(SignerQuoteRequestSchema, value)
    expect(result.valid).toBe(true)
    expect(result.extraFields).toContain('unknownField')
  })

  test('validates a correct SignerQuoteResponse', () => {
    const value = {
      quoteId: 'q-1',
      chainId: '1666',
      providerAddress: '0xaaa',
      walletAddress: '0xbbb',
      requesterAddress: '0xbbb',
      targetAddress: '0xccc',
      valueWei: '0',
      dataHex: '0x',
      gas: '21000',
      policyId: 'p-1',
      policyHash: '0x11',
      scopeHash: '0x22',
      trustTier: 'self_hosted',
      amountWei: '1000',
      status: 'quoted',
      expiresAt: '2026-03-11T00:00:00Z',
      createdAt: '2026-03-10T00:00:00Z',
      updatedAt: '2026-03-10T00:00:00Z',
    }
    const result = validateAgainstSchema(SignerQuoteResponseSchema, value)
    expect(result.valid).toBe(true)
    expect(result.missingRequired).toHaveLength(0)
  })

  test('validates StorageReceipt schema', () => {
    const value = {
      version: 1,
      receiptId: 'r-1',
      leaseId: 'l-1',
      cid: 'bafytest',
      bundleHash: '0x1111',
      bundleKind: 'public_news.capture',
      providerAddress: '0xaaa',
      requesterAddress: '0xbbb',
      sizeBytes: 1024,
      ttlSeconds: 3600,
      amountWei: '1000',
      status: 'active',
      issuedAt: '2026-03-10T00:00:00Z',
      expiresAt: '2026-03-10T01:00:00Z',
    }
    const result = validateAgainstSchema(StorageReceiptSchema, value)
    expect(result.valid).toBe(true)
  })
})

describe('detectDrift', () => {
  test('no drift for perfect match', () => {
    const value = {
      requester: {},
      target: '0xaaa',
      value_wei: '0',
      data: '0x',
      gas: '21000',
      reason: 'test',
    }
    const report = detectDrift(SignerQuoteRequestSchema, value)
    expect(report.hasDrift).toBe(false)
    expect(report.missingFromSchema).toHaveLength(0)
    expect(report.addedBeyondSchema).toHaveLength(0)
  })

  test('detects missing fields as drift', () => {
    const value = {
      requester: {},
      target: '0xaaa',
    }
    const report = detectDrift(SignerQuoteRequestSchema, value)
    expect(report.hasDrift).toBe(true)
    expect(report.missingFromSchema).toContain('value_wei')
    expect(report.missingFromSchema).toContain('data')
  })

  test('detects extra fields as drift', () => {
    const value = {
      requester: {},
      target: '0xaaa',
      value_wei: '0',
      data: '0x',
      gas: '21000',
      reason: 'test',
      newField: 'surprise',
    }
    const report = detectDrift(SignerQuoteRequestSchema, value)
    expect(report.hasDrift).toBe(true)
    expect(report.addedBeyondSchema).toContain('newField')
  })
})

describe('batch operations', () => {
  test('validateBatch validates multiple entries', () => {
    const results = validateBatch([
      {
        schema: SignerQuoteRequestSchema,
        value: { requester: {}, target: '0xaaa' },
      },
      {
        schema: StorageQuoteRequestSchema,
        value: {
          cid: 'test',
          bundle_kind: 'public_news.capture',
          size_bytes: 1024,
          ttl_seconds: 3600,
          requester_address: '0xaaa',
        },
      },
    ])
    expect(results).toHaveLength(2)
    expect(results[0]!.valid).toBe(true)
    expect(results[1]!.valid).toBe(true)
  })

  test('detectBatchDrift checks multiple entries', () => {
    const reports = detectBatchDrift([
      {
        schema: SignerQuoteRequestSchema,
        value: { requester: {}, target: '0xaaa' },
      },
      {
        schema: StorageQuoteRequestSchema,
        value: { cid: 'test', extraField: true },
      },
    ])
    expect(reports).toHaveLength(2)
    expect(reports[1]!.hasDrift).toBe(true)
    expect(reports[1]!.addedBeyondSchema).toContain('extraField')
  })
})

describe('schema field consistency', () => {
  test('all provider schemas have non-empty fields', () => {
    for (const schema of ALL_PROVIDER_SCHEMAS) {
      expect(schema.fields.length).toBeGreaterThan(0)
      expect(schema.requiredFields.length).toBeGreaterThan(0)
      expect(schema.name).toBeTruthy()
    }
  })

  test('all operator schemas have non-empty fields', () => {
    for (const schema of ALL_OPERATOR_SCHEMAS) {
      expect(schema.fields.length).toBeGreaterThan(0)
      expect(schema.requiredFields.length).toBeGreaterThan(0)
      expect(schema.name).toBeTruthy()
    }
  })

  test('required fields are a subset of all fields', () => {
    for (const schema of [...ALL_PROVIDER_SCHEMAS, ...ALL_OPERATOR_SCHEMAS]) {
      const fieldsSet = new Set(schema.fields)
      for (const required of schema.requiredFields) {
        expect(fieldsSet.has(required)).toBe(true)
      }
    }
  })
})
