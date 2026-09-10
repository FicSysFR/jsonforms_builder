import { describe, expect, it } from 'vitest'
import {
  createPasswordVisibilityRef,
  usePasswordControl,
} from '../../src/composables/usePasswordControl'
import { mountControl } from '../helpers/controlHarness'

describe('createPasswordVisibilityRef', () => {
  it('initialises visibility as hidden', () => {
    const visibility = createPasswordVisibilityRef()

    expect(visibility.value).toBe(false)
  })
})

describe('usePasswordControl', () => {
  it('combines password visibility with string restrictions', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        usePasswordControl({ jsonFormsControl, clearValue: null, debounceWait: undefined }),
      {
        schema: { type: 'string', maxLength: 24 },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { restrict: true },
        },
        data: 'secret',
      },
    )

    expect(mounted.result.passwordVisible.value).toBe(false)
    expect(mounted.result.modelValue.value).toBe('secret')
    expect(mounted.result.maxLength.value).toBe(24)
    expect(mounted.result.counter.value).toBe(true)

    mounted.result.passwordVisible.value = true
    expect(mounted.result.passwordVisible.value).toBe(true)
    mounted.stop()
  })
})
