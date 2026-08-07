import { describe, expect, it } from 'bun:test'
import type { JsonSchema } from '@jsonforms/core'
import {
  createVariantValue,
  detectOneOfVariant,
} from '../../src/composables/useOneOfControl'

const variants: JsonSchema[] = [
  {
    title: 'Pose de voie',
    type: 'object',
    required: ['kind', 'metersLaid'],
    properties: {
      kind: { const: 'track' } as JsonSchema,
      metersLaid: { type: 'integer' },
    },
  },
  {
    title: 'Caténaire',
    type: 'object',
    required: ['kind', 'polesInstalled'],
    properties: {
      kind: { const: 'catenary' } as JsonSchema,
      polesInstalled: { type: 'integer' },
    },
  },
]

describe('detectOneOfVariant', () => {
  it('matches the branch whose const discriminant and required keys are satisfied', () => {
    expect(detectOneOfVariant({ kind: 'track', metersLaid: 240 }, variants)).toBe(0)
    expect(detectOneOfVariant({ kind: 'catenary', polesInstalled: 4 }, variants)).toBe(1)
  })

  it('returns -1 rather than guessing when nothing matches', () => {
    expect(detectOneOfVariant({}, variants)).toBe(-1)
    expect(detectOneOfVariant({ kind: 'track' }, variants)).toBe(-1)
    expect(detectOneOfVariant(undefined, variants)).toBe(-1)
    expect(detectOneOfVariant('track', variants)).toBe(-1)
  })

  it('rejects a branch whose const discriminant disagrees', () => {
    expect(detectOneOfVariant({ kind: 'catenary', metersLaid: 240 }, variants)).toBe(-1)
  })

  it('ignores branches that declare no required keys', () => {
    expect(detectOneOfVariant({ any: 1 }, [{ type: 'object' }])).toBe(-1)
  })
})

describe('createVariantValue', () => {
  it('fills const discriminants so the branch stays detectable', () => {
    const value = createVariantValue(variants[1], { type: 'object' })

    expect((value as Record<string, unknown>).kind).toBe('catenary')
  })

  it('round-trips through detectOneOfVariant once required fields are filled', () => {
    const value = createVariantValue(variants[0], { type: 'object' }) as Record<string, unknown>
    value.metersLaid = 10

    expect(detectOneOfVariant(value, variants)).toBe(0)
  })

  it('leaves non-object branches untouched', () => {
    expect(createVariantValue({ type: 'string' }, { type: 'object' })).not.toBeInstanceOf(Object)
  })
})
