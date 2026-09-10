import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resolveTextareaRows, useTextareaControl } from '../../src/composables/useTextareaControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => vi.useRealTimers())

describe('resolveTextareaRows', () => {
  it('returns fallback for invalid values', () => {
    expect(resolveTextareaRows(undefined, 30)).toBe(30)
    expect(resolveTextareaRows(-1, 10)).toBe(10)
    expect(resolveTextareaRows(NaN, 5)).toBe(5)
  })

  it('returns provided positive row value', () => {
    expect(resolveTextareaRows(12, 5)).toBe(12)
  })

  it('resolves rows from applied options and reacts to updates', async () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useTextareaControl({ jsonFormsControl, clearValue: undefined, defaultRows: 8 }),
      {
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { rows: 12, minRows: 4 },
        },
      },
    )

    expect(mounted.result.rows.value).toBe(12)
    expect(mounted.result.minRows.value).toBe(4)

    mounted.state.value.uischema.options = { rows: -1 }
    await nextTick()
    expect(mounted.result.rows.value).toBe(8)
    expect(mounted.result.minRows.value).toBe(8)
    mounted.stop()
  })

  it('exposes the string-control model and clear-value adapter', async () => {
    vi.useFakeTimers()
    const mounted = mountControl(
      (jsonFormsControl) =>
        useTextareaControl({ jsonFormsControl, clearValue: null, debounceWait: 0 }),
      { data: 'notes' },
    )

    expect(mounted.result.modelValue.value).toBe('notes')
    mounted.result.onChange('')
    await vi.runAllTimersAsync()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', null)
    mounted.stop()
  })
})
