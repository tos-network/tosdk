/**
 * Validation and drift detection for schema references.
 *
 * Validates that runtime objects conform to their schema references
 * and detects missing or extra fields (drift).
 */
import type { SchemaReference } from './version.js'

export type ValidationResult = {
  valid: boolean
  schemaName: string
  schemaVersion: string
  missingRequired: string[]
  missingOptional: string[]
  extraFields: string[]
}

export type DriftReport = {
  schemaName: string
  schemaVersion: string
  hasDrift: boolean
  missingFromSchema: string[]
  addedBeyondSchema: string[]
}

/** Validate an object against a schema reference */
export function validateAgainstSchema(
  schema: SchemaReference,
  value: Record<string, unknown>,
): ValidationResult {
  const objectKeys = Object.keys(value)
  const schemaFieldsSet = new Set(schema.fields)
  const requiredFieldsSet = new Set(schema.requiredFields)

  const missingRequired = schema.requiredFields.filter(
    (f) => !(f in value),
  )
  const optionalFields = schema.fields.filter(
    (f) => !requiredFieldsSet.has(f),
  )
  const missingOptional = optionalFields.filter(
    (f) => !(f in value),
  )
  const extraFields = objectKeys.filter(
    (f) => !schemaFieldsSet.has(f),
  )

  return {
    valid: missingRequired.length === 0,
    schemaName: schema.name,
    schemaVersion: schema.version,
    missingRequired,
    missingOptional,
    extraFields,
  }
}

/** Detect drift between a schema and an object's actual fields */
export function detectDrift(
  schema: SchemaReference,
  value: Record<string, unknown>,
): DriftReport {
  const objectKeys = Object.keys(value)
  const schemaFieldsSet = new Set(schema.fields)

  const missingFromSchema = schema.fields.filter(
    (f) => !(f in value),
  )
  const addedBeyondSchema = objectKeys.filter(
    (f) => !schemaFieldsSet.has(f),
  )

  return {
    schemaName: schema.name,
    schemaVersion: schema.version,
    hasDrift: missingFromSchema.length > 0 || addedBeyondSchema.length > 0,
    missingFromSchema,
    addedBeyondSchema,
  }
}

/** Validate multiple objects against their schemas, returning all results */
export function validateBatch(
  entries: Array<{ schema: SchemaReference; value: Record<string, unknown> }>,
): ValidationResult[] {
  return entries.map((entry) => validateAgainstSchema(entry.schema, entry.value))
}

/** Detect drift across multiple schema/object pairs */
export function detectBatchDrift(
  entries: Array<{ schema: SchemaReference; value: Record<string, unknown> }>,
): DriftReport[] {
  return entries.map((entry) => detectDrift(entry.schema, entry.value))
}
