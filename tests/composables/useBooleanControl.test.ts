import { describe, expect, it } from 'vitest'
import { resolveBooleanDisable } from '../../src/composables/useBooleanControl'

describe('resolveBooleanDisable', () => {
  it('disables when control is not enabled and not readonly', () => {
    expect(resolveBooleanDisable(false, false)).toBe(true)
  })

  it('stays enabled when readonly is true', () => {
    expect(resolveBooleanDisable(false, true)).toBe(false)
  })

  it('stays enabled when control is enabled', () => {
    expect(resolveBooleanDisable(true, false)).toBe(false)
  })
})
