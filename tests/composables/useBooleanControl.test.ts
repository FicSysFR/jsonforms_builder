import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { resolveBooleanDisable, useBooleanControl } from '../../src/composables/useBooleanControl'
import { mountControl } from '../helpers/controlHarness'

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

  it('exposes reactive model and disabled state through the control factory', async () => {
    const mounted = mountControl((jsonFormsControl) => useBooleanControl({ jsonFormsControl }), {
      data: false,
      enabled: false,
    })

    expect(mounted.result.modelValue.value).toBe(false)
    expect(mounted.result.disable.value).toBe(true)

    mounted.state.value = { ...mounted.state.value, data: true, enabled: true }
    await nextTick()

    expect(mounted.result.modelValue.value).toBe(true)
    expect(mounted.result.disable.value).toBe(false)
    mounted.stop()
  })

  it('forwards changes with the configured debounce', async () => {
    const mounted = mountControl((jsonFormsControl) =>
      useBooleanControl({ jsonFormsControl, debounceWait: 0 }),
    )

    mounted.result.onChange(true)
    await new Promise((resolve) => setTimeout(resolve, 5))

    expect(mounted.handleChange).toHaveBeenCalledWith('value', true)
    mounted.stop()
  })
})
