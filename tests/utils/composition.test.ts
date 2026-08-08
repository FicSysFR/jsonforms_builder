import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'
import {
  isFieldReadonly,
  useControlAppliedOptions,
  useComputedLabel,
  useLayoutAppliedOptions,
  determineClearValue,
  resolveClearOnHideValue,
  useUiControl,
} from '../../src/utils/composition'
import { IsDynamicPropertyContext } from '../../src/utils/inject'

describe('isFieldReadonly', () => {
  it('detects readonly from uischema options', () => {
    const schema = { type: 'string' }
    const uischema = { options: { readonly: true } }

    expect(isFieldReadonly(schema, uischema)).toBe(true)
  })

  it('detects readOnly from schema', () => {
    const schema = { type: 'string', readOnly: true }
    const uischema = { options: {} }

    expect(isFieldReadonly(schema, uischema)).toBe(true)
  })

  it('returns false when neither flag is set', () => {
    const schema = { type: 'string' }
    const uischema = { options: {} }

    expect(isFieldReadonly(schema, uischema)).toBe(false)
  })
})

describe('useControlAppliedOptions', () => {
  it('merges control config with uischema options without mutation', () => {
    const control = computed(() => ({
      config: {
        dense: true,
        nested: { slot: 'base' },
      },
      uischema: {
        options: {
          dense: false,
          append: true,
          nested: { slot: 'override' },
        },
      },
    }))

    const applied = useControlAppliedOptions({ control })

    expect(applied.value.dense).toBe(false)
    expect(applied.value.append).toBe(true)
    expect(applied.value.nested.slot).toBe('override')
    expect(control.value.config.nested.slot).toBe('base')
  })
})

describe('useComputedLabel', () => {
  it('retains required asterisk by default', () => {
    const control = computed(() => ({
      label: 'Name',
      required: true,
      config: {},
      uischema: { options: {} },
    }))

    const applied = useControlAppliedOptions({ control })
    const label = useComputedLabel({ control }, applied)

    expect(label.value.endsWith('*')).toBe(true)
  })

  it('hides required asterisk when disabled', () => {
    const control = computed(() => ({
      label: 'Name',
      required: true,
      config: { hideRequiredAsterisk: true },
      uischema: { options: {} },
    }))

    const applied = useControlAppliedOptions({ control })
    const label = useComputedLabel({ control }, applied)

    expect(label.value).toBe('Name')
  })
})

describe('useLayoutAppliedOptions', () => {
  it('merges layout config with options copies', () => {
    const layout = computed(() => ({
      config: {
        gap: '16px',
        dense: false,
      },
      uischema: {
        options: {
          dense: true,
          direction: 'column',
        },
      },
    }))

    const applied = useLayoutAppliedOptions({ layout })

    expect(applied.value.gap).toBe('16px')
    expect(applied.value.dense).toBe(true)
    expect(applied.value.direction).toBe('column')
    expect(layout.value.config.dense).toBe(false)
  })
})

describe('determineClearValue', () => {
  it('returns default when dynamic context defaults to true', () => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'string' } } })

    let result: any
    app.runWithContext(() => {
      result = determineClearValue('fallback')
    })

    expect(result).toBe('fallback')
  })

  it('respects explicit dynamic property context override', () => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    app.provide(IsDynamicPropertyContext, false)

    let result: any
    app.runWithContext(() => {
      result = determineClearValue('fallback')
    })

    expect(result).toBeUndefined()
  })
})

describe('resolveClearOnHideValue', () => {
  it('returns schema default when present', () => {
    expect(resolveClearOnHideValue({ type: 'string', default: 'None' })).toBe('None')
    expect(resolveClearOnHideValue({ type: 'boolean', default: false })).toBe(false)
  })

  it('returns undefined when schema has no default', () => {
    expect(resolveClearOnHideValue({ type: 'string' })).toBeUndefined()
    expect(resolveClearOnHideValue(undefined)).toBeUndefined()
  })
})

describe('useUiControl clearOnHide', () => {
  const mountControl = (options: {
    visible: { value: boolean }
    data?: unknown
    schema?: Record<string, unknown>
    config?: Record<string, unknown>
    handleChange: ReturnType<typeof vi.fn>
  }) => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    const scope = effectScope()

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => ({
          schema: options.schema ?? { type: 'string' },
          uischema: { type: 'Control', scope: '#/properties/vitaminDeficiency' },
          path: 'vitaminDeficiency',
          config: options.config ?? {},
          label: 'Vitamin',
          description: '',
          required: false,
          enabled: true,
          errors: '',
          data: options.data,
          id: '#/properties/vitaminDeficiency',
          visible: options.visible.value,
        }))

        useUiControl({
          control,
          handleChange: options.handleChange,
        } as any)
      })
    })

    return scope
  }

  it('clears data to undefined when a control becomes hidden', async () => {
    const visible = ref(true)
    const handleChange = vi.fn()
    mountControl({ visible, data: 'Vitamin A', handleChange })

    visible.value = false
    await nextTick()

    expect(handleChange).toHaveBeenCalledWith('vitaminDeficiency', undefined)
  })

  it('clears data to schema default when a control becomes hidden', async () => {
    const visible = ref(true)
    const handleChange = vi.fn()
    mountControl({
      visible,
      data: 'Vitamin A',
      schema: { type: 'string', default: 'None' },
      handleChange,
    })

    visible.value = false
    await nextTick()

    expect(handleChange).toHaveBeenCalledWith('vitaminDeficiency', 'None')
  })

  it('does not clear when clearOnHide is disabled', async () => {
    const visible = ref(true)
    const handleChange = vi.fn()
    mountControl({
      visible,
      data: 'Vitamin A',
      config: { clearOnHide: false },
      handleChange,
    })

    visible.value = false
    await nextTick()

    expect(handleChange).not.toHaveBeenCalled()
  })
})
