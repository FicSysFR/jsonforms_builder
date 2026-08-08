import { describe, expect, it } from 'vitest'
import {
  createEnumAdaptTarget,
  isArraySchemaControl,
  normalizeSuggestions,
} from '../../src/composables/useEnumSuggestionControl'

type EnumControlValue = Parameters<typeof isArraySchemaControl>[0]

describe('createEnumAdaptTarget', () => {
  it('returns clear value when input empty', () => {
    const adapt = createEnumAdaptTarget(undefined)

    expect(adapt('')).toBeUndefined()
  })
})

describe('isArraySchemaControl', () => {
  it('detects array schema types', () => {
    expect(isArraySchemaControl({ schema: { type: 'array' } } as EnumControlValue)).toBe(true)
    expect(
      isArraySchemaControl({ schema: { type: ['array', 'string'] } } as EnumControlValue),
    ).toBe(true)
    expect(isArraySchemaControl({ schema: { type: 'string' } } as EnumControlValue)).toBe(false)
  })
})

describe('normalizeSuggestions', () => {
  it('returns undefined when suggestions missing', () => {
    expect(normalizeSuggestions(undefined)).toBeUndefined()
  })

  it('filters and stringifies suggestions', () => {
    const suggestions = ['a', 42, { toString: () => 'b' }]

    expect(normalizeSuggestions(suggestions)).toEqual(['a', '42', 'b'])
  })
})
