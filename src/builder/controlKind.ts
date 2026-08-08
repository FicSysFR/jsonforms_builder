import type { JsonSchema } from '@jsonforms/core'

/**
 * Control family inferred from schema + uischema options.
 * Used by the builder inspector to show the right option editors.
 */
export type BuilderControlKind =
  | 'string'
  | 'textarea'
  | 'password'
  | 'pin'
  | 'color'
  | 'file'
  | 'number'
  | 'slider'
  | 'rating'
  | 'boolean'
  | 'enum'
  | 'radio'
  | 'select'
  | 'multi-enum'
  | 'tags'
  | 'date'
  | 'datetime'
  | 'time'
  | 'calendar'
  | 'wysiwyg'
  | 'array'
  | 'object'
  | 'unknown'

const asItemsSchema = (schema: JsonSchema | undefined): JsonSchema | undefined => {
  const items = schema?.items
  if (!items || Array.isArray(items)) {
    return undefined
  }
  return items
}

/**
 * Resolves which renderer family a Control (or ListWithDetail) targets.
 * Order mirrors tester specificity: option formats before plain schema types.
 */
export const resolveControlKind = (
  schema: JsonSchema | undefined,
  options: Record<string, unknown> = {},
  elementType?: string,
): BuilderControlKind => {
  if (elementType === 'ListWithDetail') {
    return 'array'
  }

  if (!schema) {
    return 'unknown'
  }

  if (options.wysiwyg === true) {
    return 'wysiwyg'
  }

  if (options.slider === true || (typeof options.slider === 'object' && options.slider)) {
    return 'slider'
  }

  const optionFormat = typeof options.format === 'string' ? options.format : undefined
  const schemaFormat = typeof schema.format === 'string' ? schema.format : undefined

  if (optionFormat === 'pin') return 'pin'
  if (optionFormat === 'rating') return 'rating'
  if (optionFormat === 'tags') return 'tags'
  if (optionFormat === 'calendar') return 'calendar'
  if (optionFormat === 'radio') return 'radio'
  if (optionFormat === 'select') return 'select'
  if (optionFormat === 'color' || schemaFormat === 'color') return 'color'
  if (optionFormat === 'file' || schemaFormat === 'data-url') return 'file'

  if (options.multi === true) {
    return 'textarea'
  }

  if (schemaFormat === 'password') return 'password'
  if (schemaFormat === 'date') return 'date'
  if (schemaFormat === 'date-time') return 'datetime'
  if (schemaFormat === 'time') return 'time'

  if (schema.type === 'boolean') return 'boolean'
  if (schema.type === 'number' || schema.type === 'integer') return 'number'

  if (schema.type === 'array') {
    const items = asItemsSchema(schema)
    if (items?.enum || items?.oneOf) {
      return 'multi-enum'
    }
    if (items?.type === 'object' || items?.properties) {
      return 'array'
    }
    if (items?.type === 'string') {
      return 'tags'
    }
    return 'array'
  }

  if (schema.type === 'object') {
    return 'object'
  }

  if (schema.enum || schema.oneOf) {
    return 'enum'
  }

  if (schema.type === 'string') {
    return 'string'
  }

  return 'unknown'
}

export const isDateLikeKind = (kind: BuilderControlKind): boolean =>
  kind === 'date' || kind === 'datetime' || kind === 'time' || kind === 'calendar'

export const isEnumLikeKind = (kind: BuilderControlKind): boolean =>
  kind === 'enum' || kind === 'radio' || kind === 'select' || kind === 'multi-enum'
