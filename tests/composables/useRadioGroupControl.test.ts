import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  createRadioAdaptTarget,
  useRadioGroupControl,
} from '../../src/composables/useRadioGroupControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => vi.useRealTimers())

describe('createRadioAdaptTarget', () => {
  it('returns clear value when empty', () => {
    const adapt = createRadioAdaptTarget(undefined)

    expect(adapt('')).toBeUndefined()
  })

  it('passes through non-empty values', () => {
    const adapt = createRadioAdaptTarget(null)

    expect(adapt('value')).toBe('value')
  })

  it('adapts cleared values and tracks model and disabled state', async () => {
    vi.useFakeTimers()
    const mounted = mountControl(
      (jsonFormsControl) =>
        useRadioGroupControl({ jsonFormsControl, clearValue: null, debounceWait: 0 }),
      { data: 'alpha', enabled: false },
    )

    expect(mounted.result.modelValue.value).toBe('alpha')
    expect(mounted.result.disable.value).toBe(true)
    mounted.result.onChange('')
    await vi.runAllTimersAsync()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', null)

    mounted.state.value = { ...mounted.state.value, data: 'beta', enabled: true }
    await nextTick()
    expect(mounted.result.modelValue.value).toBe('beta')
    expect(mounted.result.disable.value).toBe(false)
    mounted.stop()
  })
})
