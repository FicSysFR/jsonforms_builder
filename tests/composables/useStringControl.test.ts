import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createStringAdaptTarget,
  resolveStringMaxLength,
  shouldShowStringCounter,
  useStringControl,
} from '../../src/composables/useInputControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => {
  vi.useRealTimers()
})

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

describe('useStringControl', () => {
  it('connects restriction metadata and model changes', () => {
    vi.useFakeTimers()
    const mounted = mountControl(
      (jsonFormsControl) =>
        useStringControl({ jsonFormsControl, clearValue: null, debounceWait: 0 }),
      {
        schema: { type: 'string', maxLength: 32 },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { restrict: true },
        },
        data: 'hello',
      },
    )

    expect(mounted.result.modelValue.value).toBe('hello')
    expect(mounted.result.maxLength.value).toBe(32)
    expect(mounted.result.counter.value).toBe(true)

    mounted.result.onChange('')
    vi.runAllTimers()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', null)
    mounted.stop()
  })
})
