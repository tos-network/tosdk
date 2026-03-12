/**
 * Schema version tracking for core provider and operator API contracts.
 * Used for drift detection between SDK versions and deployed services.
 */

export const SCHEMA_VERSION = '0.1.0' as const

export type SchemaVersion = typeof SCHEMA_VERSION

export type SchemaReference = {
  name: string
  version: SchemaVersion
  fields: readonly string[]
  requiredFields: readonly string[]
}

export function createSchemaReference(
  name: string,
  fields: readonly string[],
  requiredFields: readonly string[],
): SchemaReference {
  return {
    name,
    version: SCHEMA_VERSION,
    fields,
    requiredFields,
  }
}
