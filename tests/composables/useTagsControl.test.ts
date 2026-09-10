import { describe, expect, it } from 'vitest'
import {
  allowsDuplicateTags,
  createTagsAdaptTarget,
  resolveTagsDelimiter,
  toTagsModel,
  useTagsControl,
} from '../../src/composables/useTagsControl'
import { mountControl } from '../helpers/controlHarness'

describe('createTagsAdaptTarget', () => {
  it('trims tags and drops the empty ones', () => {
    const adapt = createTagsAdaptTarget(undefined)

    expect(adapt([' vue ', '', '  ', 'jsonforms'])).toEqual(['vue', 'jsonforms'])
  })

  it('returns the clear value when nothing remains', () => {
    const adapt = createTagsAdaptTarget(null)

    expect(adapt([])).toBeNull()
    expect(adapt(['  '])).toBeNull()
    expect(adapt('not-an-array')).toBeNull()
  })

  it('coerces non-string entries', () => {
    const adapt = createTagsAdaptTarget(undefined)

    expect(adapt([1, 2])).toEqual(['1', '2'])
  })
})

describe('toTagsModel', () => {
  it('normalises the stored data', () => {
    expect(toTagsModel(['a', 'b'])).toEqual(['a', 'b'])
    expect(toTagsModel([1, null])).toEqual(['1', ''])
  })

  it('yields an empty array for missing data', () => {
    expect(toTagsModel(undefined)).toEqual([])
    expect(toTagsModel('vue')).toEqual([])
  })
})

describe('allowsDuplicateTags', () => {
  it('mirrors uniqueItems', () => {
    expect(allowsDuplicateTags(true)).toBe(false)
    expect(allowsDuplicateTags(false)).toBe(true)
    expect(allowsDuplicateTags(undefined)).toBe(true)
  })
})

describe('resolveTagsDelimiter', () => {
  it('uses the option when provided', () => {
    expect(resolveTagsDelimiter(';')).toBe(';')
    expect(resolveTagsDelimiter('')).toBe('')
  })

  it('defaults to a comma', () => {
    expect(resolveTagsDelimiter(undefined)).toBe(',')
    expect(resolveTagsDelimiter(3)).toBe(',')
  })
})

describe('useTagsControl', () => {
  it('combines array constraints with normalized tags', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useTagsControl({ jsonFormsControl, clearValue: null, debounceWait: undefined }),
      {
        schema: {
          type: 'array',
          maxItems: 4,
          uniqueItems: true,
          items: { type: 'string', maxLength: 12 },
        },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { delimiter: ';' },
        },
        data: ['vue', 3],
      },
    )

    expect(mounted.result.modelValue.value).toEqual(['vue', '3'])
    expect(mounted.result.max.value).toBe(4)
    expect(mounted.result.duplicate.value).toBe(false)
    expect(mounted.result.delimiter.value).toBe(';')
    expect(mounted.result.maxLength.value).toBe(12)

    mounted.result.onChange([' jsonforms ', ''])
    expect(mounted.handleChange).toHaveBeenCalledWith('value', ['jsonforms'])
    mounted.stop()
  })
})
