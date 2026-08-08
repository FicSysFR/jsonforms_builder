import { describe, expect, it } from 'vitest'
import { createRadioAdaptTarget } from '../../src/composables/useRadioGroupControl'

describe('createRadioAdaptTarget', () => {
  it('returns clear value when empty', () => {
    const adapt = createRadioAdaptTarget(undefined)

    expect(adapt('')).toBeUndefined()
  })

  it('passes through non-empty values', () => {
    const adapt = createRadioAdaptTarget(null)

    expect(adapt('value')).toBe('value')
  })
})
