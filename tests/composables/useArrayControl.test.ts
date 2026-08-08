import { describe, expect, it } from 'vitest'
import {
  isArrayAtCapacity,
  isArrayAtMinimum,
  isPrimitiveItemSchema,
  resolveArrayItemLabel,
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
      isPrimitiveItemSchema({ type: 'string', properties: { a: { type: 'string' } } } as any),
    ).toBe(false)
  })

  it('resolves union types on their first entry', () => {
    expect(isPrimitiveItemSchema({ type: ['string', 'null'] } as any)).toBe(true)
    expect(isPrimitiveItemSchema({ type: ['object', 'null'] } as any)).toBe(false)
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
