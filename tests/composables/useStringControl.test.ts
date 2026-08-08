import { describe, expect, it } from 'vitest'
import {
  createStringAdaptTarget,
  resolveStringMaxLength,
  shouldShowStringCounter,
} from '../../src/composables/useInputControl'

describe('createStringAdaptTarget', () => {
  it('returns clear value when input is empty', () => {
    const adapt = createStringAdaptTarget(undefined)

    expect(adapt('')).toBeUndefined()
  })

  it('keeps non-empty strings as-is', () => {
    const adapt = createStringAdaptTarget(null)

    expect(adapt('hello')).toBe('hello')
  })
})

describe('resolveStringMaxLength', () => {
  it('returns schema maxLength when restriction enabled', () => {
    expect(resolveStringMaxLength(42, true)).toBe(42)
  })

  it('returns undefined when restriction disabled', () => {
    expect(resolveStringMaxLength(42, false)).toBeUndefined()
  })
})

describe('shouldShowStringCounter', () => {
  it('follows restriction flag', () => {
    expect(shouldShowStringCounter(true)).toBe(true)
    expect(shouldShowStringCounter(false)).toBe(false)
  })
})
