import type { ControlElement, JsonSchema } from '@jsonforms/core'
import { computed, createApp, effectScope, ref } from 'vue'
import { vi } from 'vitest'

export type TestControlState = {
  schema: JsonSchema
  rootSchema: JsonSchema
  uischema: ControlElement
  path: string
  config: Record<string, unknown>
  label: string
  description: string
  required: boolean
  enabled: boolean
  errors: string
  data: unknown
  id: string
  visible: boolean
  options?: unknown[]
}

export const createControlState = (
  overrides: Partial<TestControlState> = {},
): TestControlState => ({
  schema: { type: 'string' },
  rootSchema: { type: 'object', properties: { value: { type: 'string' } } },
  uischema: { type: 'Control', scope: '#/properties/value', options: {} },
  path: 'value',
  config: {},
  label: 'Value',
  description: 'Helpful description',
  required: false,
  enabled: true,
  errors: '',
  data: 'initial',
  id: '#/properties/value',
  visible: true,
  ...overrides,
})

export const mountControl = <T>(
  factory: (jsonFormsControl: never) => T,
  overrides: Partial<TestControlState> = {},
) => {
  const state = ref(createControlState(overrides))
  const handleChange = vi.fn()
  const app = createApp({})
  app.provide('jsonforms', { core: { schema: state.value.rootSchema } })
  const scope = effectScope()
  let result: T | undefined

  app.runWithContext(() => {
    scope.run(() => {
      result = factory({ control: computed(() => state.value), handleChange } as never)
    })
  })

  if (!result) {
    throw new Error('Control factory did not return a result')
  }

  return { result, state, handleChange, stop: () => scope.stop() }
}
