import { describe, expect, it } from 'vitest'
import {
  createSliderAdaptTarget,
  resolveSliderMin,
  resolveSliderMax,
  resolveSliderStep,
} from '../../src/composables/useSliderControl'

describe('createSliderAdaptTarget', () => {
  it('returns clear value for null-like inputs', () => {
    const adapt = createSliderAdaptTarget(0)

    expect(adapt(null)).toBe(0)
    expect(adapt(undefined)).toBe(0)
    expect(adapt('')).toBe(0)
  })

  it('passes through numeric values', () => {
    const adapt = createSliderAdaptTarget(5)

    expect(adapt(3)).toBe(3)
    expect(adapt('7')).toBe(7)
  })

  it('falls back to clear value when coercion fails', () => {
    const adapt = createSliderAdaptTarget(-1)

    expect(adapt('abc')).toBe(-1)
  })
})

describe('resolveSliderMin', () => {
  it('returns minimum unchanged', () => {
    expect(resolveSliderMin(10)).toBe(10)
  })
})

describe('resolveSliderMax', () => {
  it('returns maximum unchanged', () => {
    expect(resolveSliderMax(20)).toBe(20)
  })
})

describe('resolveSliderStep', () => {
  it('uses provided multipleOf', () => {
    expect(resolveSliderStep(0.5)).toBe(0.5)
  })

  it('defaults to 1 when undefined', () => {
    expect(resolveSliderStep(undefined)).toBe(1)
  })
})
