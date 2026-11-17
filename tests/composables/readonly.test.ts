import { describe, expect, it } from 'vitest'
import { useBooleanControl } from '../../src/composables/useBooleanControl'
import { useColorControl } from '../../src/composables/useColorControl'
import { useEnumSuggestionControl } from '../../src/composables/useEnumSuggestionControl'
import { useStringControl } from '../../src/composables/useInputControl'
import { useNumericControl } from '../../src/composables/useNumericControl'
import { usePinInputControl } from '../../src/composables/usePinInputControl'
import { useRadioGroupControl } from '../../src/composables/useRadioGroupControl'
import { useRatingControl } from '../../src/composables/useRatingControl'
import { useSliderControl } from '../../src/composables/useSliderControl'
import { useTagsControl } from '../../src/composables/useTagsControl'
import { useTextareaControl } from '../../src/composables/useTextareaControl'
import { mountControl, type TestControlState } from '../helpers/controlHarness'

type LockableControl = {
  isLocked: { value: boolean }
  onChange: (value: unknown) => void
}

// `debounceWait: 0` keeps every factory synchronous enough for a single macrotask flush.
const factories: Record<string, (jsonFormsControl: never) => LockableControl> = {
  boolean: (jsonFormsControl) => useBooleanControl({ jsonFormsControl, debounceWait: 0 }),
  color: (jsonFormsControl) =>
    useColorControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  enumSuggestion: (jsonFormsControl) =>
    useEnumSuggestionControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  numeric: (jsonFormsControl) =>
    useNumericControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  pinInput: (jsonFormsControl) =>
    usePinInputControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  radioGroup: (jsonFormsControl) =>
    useRadioGroupControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  rating: (jsonFormsControl) =>
    useRatingControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  slider: (jsonFormsControl) =>
    useSliderControl({ jsonFormsControl, clearValue: 0, debounceWait: 0 }),
  string: (jsonFormsControl) =>
    useStringControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  tags: (jsonFormsControl) =>
    useTagsControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
  textarea: (jsonFormsControl) =>
    useTextareaControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 5))

/**
 * JSON Forms reports `enabled: false` for every read-only source (`<json-forms readonly>`,
 * `config.readonly`, `options.readonly`, `schema.readOnly`) and for a DISABLE rule.
 */
const readonlySources: Record<string, Partial<TestControlState>> = {
  'options.readonly': {
    enabled: false,
    uischema: { type: 'Control', scope: '#/properties/value', options: { readonly: true } },
  },
  'schema.readOnly': { enabled: false, schema: { type: 'string', readOnly: true } },
  'config.readonly': { enabled: false, config: { readonly: true } },
  'form readonly or DISABLE rule': { enabled: false },
  // JSON Forms 3.8 READONLY rule, or any source under `config.separateReadonlyFromDisabled`.
  'JSON Forms 3.8 readonly state': { enabled: true, readonly: true },
}

describe.each(Object.entries(factories))('%s control in read-only mode', (_name, factory) => {
  it.each(Object.entries(readonlySources))('is locked by %s', async (_source, overrides) => {
    const mounted = mountControl(factory, overrides)

    expect(mounted.result.isLocked.value).toBe(true)
    mounted.result.onChange('changed')
    await flush()

    expect(mounted.handleChange).not.toHaveBeenCalled()
    mounted.stop()
  })

  it('accepts changes once editable', async () => {
    const mounted = mountControl(factory)

    expect(mounted.result.isLocked.value).toBe(false)
    mounted.result.onChange('changed')
    await flush()

    expect(mounted.handleChange).toHaveBeenCalledTimes(1)
    mounted.stop()
  })
})

describe('boolean and radio widgets', () => {
  it('disable the Nuxt UI widget whenever the control is locked', () => {
    for (const factory of [factories.boolean, factories.radioGroup]) {
      const mounted = mountControl(factory as never, readonlySources['options.readonly'])
      expect((mounted.result as unknown as { disable: { value: boolean } }).disable.value).toBe(
        true,
      )
      mounted.stop()
    }
  })
})
