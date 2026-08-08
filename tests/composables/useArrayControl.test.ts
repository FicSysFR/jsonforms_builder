import { describe, expect, it } from 'vitest'
import type { ControlElement, JsonSchema } from '@jsonforms/core'
import {
  isArrayAtCapacity,
  isArrayAtMinimum,
  isCombinatorItemsArray,
  isPrimitiveItemSchema,
  resolveArrayItemLabel,
  resolveItemsSchema,
} from '../../src/composables/useArrayControl'

describe('isPrimitiveItemSchema', () => {
  it('recognises scalar item schemas', () => {
    expect(isPrimitiveItemSchema({ type: 'string' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'integer' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'number' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'boolean' })).toBe(true)
  })

  it('treats anything with properties as an object, whatever its declared type', () => {
    expect(isPrimitiveItemSchema({ type: 'object', properties: {} })).toBe(false)
    expect(
      isPrimitiveItemSchema({ type: 'string', properties: { a: { type: 'string' } } }),
    ).toBe(false)
  })

  it('resolves union types on their first entry', () => {
    expect(isPrimitiveItemSchema({ type: ['string', 'null'] })).toBe(true)
    expect(isPrimitiveItemSchema({ type: ['object', 'null'] })).toBe(false)
  })

  it('is false for an absent or untyped schema', () => {
    expect(isPrimitiveItemSchema(undefined)).toBe(false)
    expect(isPrimitiveItemSchema({})).toBe(false)
    expect(isPrimitiveItemSchema({ type: 'array' })).toBe(false)
  })
})

describe('resolveArrayItemLabel', () => {
  it('falls back to a 1-based positional label', () => {
    expect(resolveArrayItemLabel({}, 0)).toBe('Élément 1')
    expect(resolveArrayItemLabel({}, 4)).toBe('Élément 5')
  })

  it('uses the configured property when it holds a value', () => {
    const item = { company: 'Entreprise Alpha', count: 6 }

    expect(resolveArrayItemLabel(item, 0, 'company')).toBe('Entreprise Alpha')
  })

  it('stringifies non-string label values', () => {
    expect(resolveArrayItemLabel({ count: 42 }, 0, 'count')).toBe('42')
  })

  it('falls back when the property is missing or empty', () => {
    expect(resolveArrayItemLabel({ company: '' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ other: 'x' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ company: null }, 1, 'company')).toBe('Élément 2')
  })

  it('falls back for primitive items even when a label prop is configured', () => {
    expect(resolveArrayItemLabel('etd', 0, 'company')).toBe('Élément 1')
  })
})

describe('isArrayAtCapacity', () => {
  it('is false when the schema sets no maxItems', () => {
    expect(isArrayAtCapacity(99, undefined)).toBe(false)
  })

  it('blocks once the length reaches maxItems', () => {
    expect(isArrayAtCapacity(2, 3)).toBe(false)
    expect(isArrayAtCapacity(3, 3)).toBe(true)
    expect(isArrayAtCapacity(4, 3)).toBe(true)
  })

  it('treats maxItems of 0 as a hard block', () => {
    expect(isArrayAtCapacity(0, 0)).toBe(true)
  })
})

describe('isArrayAtMinimum', () => {
  it('is false when the schema sets no minItems', () => {
    expect(isArrayAtMinimum(0, undefined)).toBe(false)
  })

  it('blocks removal once the length reaches minItems', () => {
    expect(isArrayAtMinimum(3, 2)).toBe(false)
    expect(isArrayAtMinimum(2, 2)).toBe(true)
    expect(isArrayAtMinimum(1, 2)).toBe(true)
  })
})

describe('resolveItemsSchema', () => {
  const rootSchema: JsonSchema = {
    type: 'object',
    definitions: {
      fileOrFolder: { oneOf: [{ type: 'object' }, { type: 'string' }] },
    },
  }

  it('follows a $ref to its target', () => {
    expect(resolveItemsSchema({ $ref: '#/definitions/fileOrFolder' }, rootSchema)).toEqual(
      rootSchema.definitions!.fileOrFolder,
    )
  })

  it('returns inline schemas untouched', () => {
    const inline: JsonSchema = { type: 'string' }

    expect(resolveItemsSchema(inline, rootSchema)).toBe(inline)
    expect(resolveItemsSchema(undefined, rootSchema)).toBeUndefined()
  })

  it('falls back to the raw items when the $ref cannot be resolved', () => {
    const broken: JsonSchema = { $ref: '#/definitions/missing' }

    expect(resolveItemsSchema(broken, rootSchema)).toBe(broken)
    expect(resolveItemsSchema(broken, undefined)).toBe(broken)
  })
})

describe('isCombinatorItemsArray', () => {
  const uischema: ControlElement = { type: 'Control', scope: '#/properties/children' }

  const schemaWith = (items: JsonSchema | JsonSchema[]): JsonSchema => ({
    type: 'object',
    properties: { children: { type: 'array', items } },
  })

  /** Un schéma récursif ne peut exprimer ses éléments qu'en `$ref` : c'est le cas nominal. */
  it('recognises a combinator reached through a $ref', () => {
    const schema = schemaWith({ $ref: '#/definitions/fileOrFolder' })
    const rootSchema: JsonSchema = {
      ...schema,
      definitions: { fileOrFolder: { oneOf: [{ $ref: '#/definitions/file' }] } },
    }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema })).toBe(true)
  })

  it('recognises an inline combinator', () => {
    const schema = schemaWith({ anyOf: [{ type: 'string' }] })

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema: schema })).toBe(true)
  })

  it('rejects plain object and tuple item schemas', () => {
    const objectItems = schemaWith({ type: 'object' })
    const tupleItems = schemaWith([{ type: 'string' }])

    expect(isCombinatorItemsArray(uischema, objectItems, { rootSchema: objectItems })).toBe(false)
    expect(isCombinatorItemsArray(uischema, tupleItems, { rootSchema: tupleItems })).toBe(false)
  })

  it('rejects a $ref that does not lead to a combinator', () => {
    const schema = schemaWith({ $ref: '#/definitions/file' })
    const rootSchema: JsonSchema = { ...schema, definitions: { file: { type: 'object' } } }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema })).toBe(false)
  })
})
