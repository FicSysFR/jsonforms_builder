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

    let result: unknown
    app.runWithContext(() => {
      result = determineClearValue('fallback')
    })

    expect(result).toBe('fallback')
  })

  it('respects explicit dynamic property context override', () => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    app.provide(IsDynamicPropertyContext, false)

    let result: unknown
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
        })
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

describe('useUiControl readonly / disabled', () => {
  const mountFlags = (options: {
    enabled?: boolean
    schema?: Record<string, unknown>
    uischemaOptions?: Record<string, unknown>
    config?: Record<string, unknown>
  }) => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    const scope = effectScope()
    let result: ReturnType<typeof useUiControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => ({
          schema: options.schema ?? { type: 'string' },
          uischema: {
            type: 'Control',
            scope: '#/properties/x',
            options: options.uischemaOptions ?? {},
          },
          path: 'x',
          config: options.config ?? {},
          label: 'X',
          description: '',
          required: false,
          enabled: options.enabled ?? true,
          errors: '',
          data: 'v',
          id: '#/properties/x',
          visible: true,
        }))

        result = useUiControl({ control, handleChange: vi.fn() })
      })
    })

    return { result: result!, scope }
  }

  it('détecte readonly via uischema.options ou schema.readOnly', () => {
    const viaOptions = mountFlags({ uischemaOptions: { readonly: true } })
    expect(viaOptions.result.isReadonly.value).toBe(true)
    viaOptions.scope.stop()

    const viaSchema = mountFlags({ schema: { type: 'string', readOnly: true } })
    expect(viaSchema.result.isReadonly.value).toBe(true)
    viaSchema.scope.stop()
  })

  it('détecte readonly via config.readonly', () => {
    const { result, scope } = mountFlags({ config: { readonly: true } })
    expect(result.isReadonly.value).toBe(true)
    scope.stop()
  })

  it('isDisabled seulement si désactivé et non readonly', () => {
    const disabled = mountFlags({ enabled: false })
    expect(disabled.result.isDisabled.value).toBe(true)
    disabled.scope.stop()

    const readonlyDisabled = mountFlags({
      enabled: false,
      uischemaOptions: { readonly: true },
    })
    expect(readonlyDisabled.result.isReadonly.value).toBe(true)
    expect(readonlyDisabled.result.isDisabled.value).toBe(false)
    readonlyDisabled.scope.stop()
  })

  it('filtre les erreurs avant touch si enableFilterErrorsBeforeTouch', async () => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    const scope = effectScope()
    let result: ReturnType<typeof useUiControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => ({
          schema: { type: 'string' },
          uischema: { type: 'Control', scope: '#/properties/x', options: {} },
          path: 'x',
          config: { enableFilterErrorsBeforeTouch: true },
          label: 'X',
          description: '',
          required: true,
          enabled: true,
          errors: 'requis',
          data: undefined,
          id: '#/properties/x',
          visible: true,
        }))

        result = useUiControl({ control, handleChange: vi.fn() })
      })
    })

    expect(result!.control.value.errors).toBe('')
    result!.handleBlur()
    await nextTick()
    expect(result!.control.value.errors).toBe('requis')
    expect(result!.rawErrors.value).toBe('requis')

    scope.stop()
  })
})
