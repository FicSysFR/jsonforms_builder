import { describe, expect, it } from 'vitest'
import { createPasswordVisibilityRef } from '../../src/composables/usePasswordControl'

describe('createPasswordVisibilityRef', () => {
  it('initialises visibility as hidden', () => {
    const visibility = createPasswordVisibilityRef()

    expect(visibility.value).toBe(false)
  })
})
