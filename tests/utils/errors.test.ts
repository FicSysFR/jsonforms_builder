import type { ErrorObject } from 'ajv'
import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope, nextTick, reactive } from 'vue'
import { useUiControl } from '../../src/utils/composition'

const localError = {
  instancePath: '/name',
  schemaPath: '#/properties/name/minLength',
  keyword: 'minLength',
  params: { limit: 3 },
  message: 'must NOT have fewer than 3 characters',
} as ErrorObject

const serverError = {
  instancePath: '/name',
  schemaPath: '',
  keyword: 'server',
  params: {},
  message: 'This name is already taken',
} as ErrorObject

const otherFieldServerError = { ...serverError, instancePath: '/email', message: 'Unknown' }

type MountOptions = {
  errors?: ErrorObject[]
  additionalErrors?: ErrorObject[]
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation'
  config?: Record<string, unknown>
}

/**
 * Mounts `useUiControl` the way `<json-forms>` does: `control.errors` is the message JSON Forms
 * combines from validation and `additional-errors`; the raw lists live in the injected core.
 */
const mount = ({
  errors = [],
  additionalErrors = [],
  validationMode = 'ValidateAndShow',
  config = {},
}: MountOptions) => {
  const core = reactive({
    schema: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
    errors,
    additionalErrors,
    validationMode,
  })
  const shown = validationMode === 'ValidateAndShow' ? [...errors] : []
  const combined = [...shown, ...additionalErrors]
    .filter((error) => error.instancePath === '/name')
    .map((error) => error.message)
    .join('\n')

  const app = createApp({})
  app.provide('jsonforms', { core, i18n: {} })
  const scope = effectScope()
  let result: ReturnType<typeof useUiControl> | undefined

  app.runWithContext(() => {
    scope.run(() => {
      const control = computed(() => ({
        schema: { type: 'string', minLength: 3 },
        uischema: { type: 'Control' as const, scope: '#/properties/name', options: {} },
        path: 'name',
        config,
        label: 'Name',
        description: '',
        required: false,
        enabled: true,
        errors: combined,
        data: 'ab',
        id: '#/properties/name',
        visible: true,
      }))
      result = useUiControl({ control, handleChange: vi.fn() })
    })
  })

  if (!result) throw new Error('useUiControl did not run')
  return { result, core, stop: () => scope.stop() }
}

describe('local and server errors', () => {
  it('splits validation errors from host-supplied additional errors', () => {
    const { result, stop } = mount({
      errors: [localError],
      additionalErrors: [serverError, otherFieldServerError],
    })

    expect(result.localErrors.value).toBe('must NOT have fewer than 3 characters')
    expect(result.serverErrors.value).toBe('This name is already taken')
    expect(result.controlWrapper.value.errors).toBe(
      'must NOT have fewer than 3 characters\nThis name is already taken',
    )
    stop()
  })

  it('keeps server errors visible while local ones wait for a touch', async () => {
    const { result, stop } = mount({
      errors: [localError],
      additionalErrors: [serverError],
      config: { enableFilterErrorsBeforeTouch: true },
    })

    expect(result.controlWrapper.value.errors).toBe('This name is already taken')
    expect(result.control.value.errors).toBe('This name is already taken')

    result.handleBlur()
    await nextTick()
    expect(result.controlWrapper.value.errors).toBe(
      'must NOT have fewer than 3 characters\nThis name is already taken',
    )
    stop()
  })

  it('hides the wrapper message, not only the color, before the first touch', () => {
    const { result, stop } = mount({
      errors: [localError],
      config: { enableFilterErrorsBeforeTouch: true },
    })

    expect(result.controlWrapper.value.errors).toBe('')
    expect(result.control.value.errors).toBe('')
    stop()
  })

  it('treats a user change as a touch for widgets that never blur', () => {
    const { result, stop } = mount({
      errors: [localError],
      config: { enableFilterErrorsBeforeTouch: true },
    })

    result.onChange('abc')
    expect(result.controlWrapper.value.errors).toBe('must NOT have fewer than 3 characters')
    stop()
  })

  it('reports only server errors under NoValidation', () => {
    // JSON Forms runs no validator, so `core.errors` stays empty.
    const { result, stop } = mount({
      additionalErrors: [serverError],
      validationMode: 'NoValidation',
    })

    expect(result.localErrors.value).toBe('')
    expect(result.serverErrors.value).toBe('This name is already taken')
    expect(result.controlWrapper.value.errors).toBe('This name is already taken')
    stop()
  })

  it('keeps validation errors hidden under ValidateAndHide', () => {
    const { result, stop } = mount({
      errors: [localError],
      additionalErrors: [serverError],
      validationMode: 'ValidateAndHide',
    })

    expect(result.localErrors.value).toBe('')
    expect(result.serverErrors.value).toBe('This name is already taken')
    stop()
  })

  it('follows additional errors replaced by the host', async () => {
    const { result, core, stop } = mount({ additionalErrors: [] })
    expect(result.serverErrors.value).toBe('')

    core.additionalErrors = [serverError]
    await nextTick()
    expect(result.serverErrors.value).toBe('This name is already taken')
    stop()
  })
})
