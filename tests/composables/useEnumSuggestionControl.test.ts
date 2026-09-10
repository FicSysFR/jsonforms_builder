import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEnumAdaptTarget,
  isArraySchemaControl,
  normalizeSuggestions,
  useEnumSuggestionControl,
} from '../../src/composables/useEnumSuggestionControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => {
  vi.restoreAllMocks()
})

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

  it('warns and rejects invalid suggestion shapes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(normalizeSuggestions('not-an-array')).toBeUndefined()
    expect(normalizeSuggestions([null, undefined])).toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })
})

describe('useEnumSuggestionControl', () => {
  it('exposes array mode and normalized suggestions', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useEnumSuggestionControl({
          jsonFormsControl,
          clearValue: [],
          debounceWait: 0,
        }),
      {
        schema: { type: ['array', 'null'] },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { suggestion: ['one', 2] },
        },
        data: ['one'],
      },
    )

    expect(mounted.result.isArrayControl.value).toBe(true)
    expect(mounted.result.suggestions.value).toEqual(['one', '2'])
    mounted.stop()
  })
})
