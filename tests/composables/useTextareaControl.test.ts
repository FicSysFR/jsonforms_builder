import { describe, expect, it } from 'vitest'
import { resolveTextareaRows } from '../../src/composables/useTextareaControl'

describe('resolveTextareaRows', () => {
  it('returns fallback for invalid values', () => {
    expect(resolveTextareaRows(undefined, 30)).toBe(30)
    expect(resolveTextareaRows(-1, 10)).toBe(10)
    expect(resolveTextareaRows(NaN, 5)).toBe(5)
  })

  it('returns provided positive row value', () => {
    expect(resolveTextareaRows(12, 5)).toBe(12)
  })
})
