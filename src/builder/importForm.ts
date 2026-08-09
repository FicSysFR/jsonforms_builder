import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import { createEmptyDefinition, type FormDefinition } from './useFormBuilder'

export class FormImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormImportError'
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const UI_SCHEMA_TYPES = new Set([
  'Control',
  'VerticalLayout',
  'HorizontalLayout',
  'Group',
  'Categorization',
  'Category',
  'Label',
  'ListWithDetail',
])

const SCHEMA_TYPES = new Set([
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
])

const looksLikeSchema = (value: Record<string, unknown>): boolean => {
  if (typeof value.type === 'string' && UI_SCHEMA_TYPES.has(value.type)) {
    return false
  }

  return (
    (typeof value.type === 'string' && SCHEMA_TYPES.has(value.type)) ||
    !!value.properties ||
    !!value.$ref ||
    Array.isArray(value.allOf) ||
    Array.isArray(value.anyOf) ||
    Array.isArray(value.oneOf)
  )
}

const looksLikeUiSchema = (value: Record<string, unknown>): boolean =>
  typeof value.type === 'string' &&
  (UI_SCHEMA_TYPES.has(value.type) || Array.isArray(value.elements))

export interface FormImportResult extends FormDefinition {
  /** Optional instance data from the imported document (used by the builder preview). */
  data?: unknown
}

/**
 * Normalizes a pasted / uploaded JSON document into a `{ schema, uischema }` pair,
 * preserving `data` when present.
 *
 * Accepted shapes:
 * - `{ schema, uischema, data? }`
 * - a bare JSON Schema (`type` / `properties` / combinators) — uischema is generated
 * - `{ schema }` alone — uischema is generated
 */
export const parseFormImport = (raw: string): FormImportResult => {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new FormImportError('Le JSON est vide.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    throw new FormImportError('JSON invalide : impossible de le parser.')
  }

  if (!isPlainObject(parsed)) {
    throw new FormImportError('Le document doit être un objet JSON.')
  }

  const empty = createEmptyDefinition()
  const data = 'data' in parsed ? parsed.data : undefined

  if (isPlainObject(parsed.schema)) {
    const schema = parsed.schema as JsonSchema
    const uischema = isPlainObject(parsed.uischema)
      ? (parsed.uischema as UISchemaElement)
      : Generate.uiSchema(schema, 'VerticalLayout')

    return { schema, uischema: uischema ?? empty.uischema, data }
  }

  if (looksLikeUiSchema(parsed) && !looksLikeSchema(parsed)) {
    throw new FormImportError(
      'Un UI Schema seul ne suffit pas : fournissez `{ "schema": …, "uischema": … }` ou un JSON Schema.',
    )
  }

  if (looksLikeSchema(parsed)) {
    const schema = parsed as JsonSchema
    return {
      schema,
      uischema: Generate.uiSchema(schema, 'VerticalLayout') ?? empty.uischema,
      data,
    }
  }

  throw new FormImportError(
    'Format non reconnu. Attendu : `{ "schema": …, "uischema": … }` ou un JSON Schema.',
  )
}
