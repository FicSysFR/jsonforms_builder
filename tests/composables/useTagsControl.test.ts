import { describe, expect, it } from 'vitest'
import {
  allowsDuplicateTags,
  createTagsAdaptTarget,
  resolveTagsDelimiter,
  toTagsModel,
} from '../../src/composables/useTagsControl'

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
