import { isAnyOfControl, isOneOfControl, or, rankWith } from '@jsonforms/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEnumAdaptTarget,
  enumSuggestionTester,
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

describe('enumSuggestionTester', () => {
  const rootSchema = { type: 'object' } as const
  const context = { rootSchema, config: undefined }
  const control = (options?: Record<string, unknown>) =>
    ({ type: 'Control', scope: '#', ...(options ? { options } : {}) }) as const
  const combinatorRank = rankWith(3, or(isOneOfControl, isAnyOfControl))

  const oneOfConstants = {
    oneOf: [
      { const: 'draft', title: 'Draft' },
      { const: 'published', title: 'Published' },
    ],
  }

  it('renders a oneOf of constants as a searchable select, not as a combinator', () => {
    const rank = enumSuggestionTester(control(), oneOfConstants, context)
    expect(rank).toBe(5)
    expect(rank).toBeGreaterThan(combinatorRank(control(), oneOfConstants, context))
  })

  it('also covers typed and numeric constants', () => {
    const numeric = { type: 'integer', oneOf: [{ const: 1, title: 'One' }] } as const
    expect(enumSuggestionTester(control(), numeric, context)).toBe(5)
  })

  it('keeps string enums and suggestions at their former rank', () => {
    expect(enumSuggestionTester(control(), { type: 'string', enum: ['a', 'b'] }, context)).toBe(2)
    expect(enumSuggestionTester(control({ suggestion: ['a'] }), { type: 'string' }, context)).toBe(
      2,
    )
  })

  it('leaves object variants to the combinator renderer', () => {
    const variants = {
      oneOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'string' } } },
      ],
    } as const
    expect(enumSuggestionTester(control(), variants, context)).toBe(-1)
  })
})
