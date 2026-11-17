import {
  defaultErrorTranslator,
  defaultTranslator,
  errorAt,
  getCombinedErrorMessage,
  type JsonFormsSubStates,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import { computed, type ComputedRef, inject } from 'vue'

export type ControlErrorSource = {
  schema: JsonSchema
  uischema: UISchemaElement
  path: string
  /** Message JSON Forms combines from validation and `additional-errors`. */
  errors: string
}

export type ControlErrors = {
  /** Errors from client-side validation (Ajv), translated. */
  localErrors: ComputedRef<string>
  /**
   * Errors supplied by the host through `<json-forms :additional-errors>` (server or business
   * validators), translated. Never hidden by `enableFilterErrorsBeforeTouch`.
   */
  serverErrors: ComputedRef<string>
}

/**
 * Splits a control's errors by origin. JSON Forms merges both lists into `control.errors`; the
 * split replays its own path matching (`errorAt`) on the injected core state, then tells the
 * host's `additionalErrors` apart from validation errors by identity.
 */
export const useControlErrors = (control: ComputedRef<ControlErrorSource>): ControlErrors => {
  const jsonforms = inject<JsonFormsSubStates | undefined>('jsonforms', undefined)

  const split = computed(() => {
    const core = jsonforms?.core
    const additional = (core?.additionalErrors ?? []) as ErrorObject[]
    if (!core || additional.length === 0) {
      return { local: undefined, server: [] as ErrorObject[] }
    }

    const { schema, path } = control.value
    const fromHost = new Set(additional)
    const matching = errorAt(path, schema)(core) as ErrorObject[]
    return {
      local: matching.filter((error) => !fromHost.has(error)),
      server: matching.filter((error) => fromHost.has(error)),
    }
  })

  const format = (errors: ErrorObject[]) => {
    if (errors.length === 0) return ''
    const { schema, uischema, path } = control.value
    return getCombinedErrorMessage(
      errors,
      jsonforms?.i18n?.translateError ?? defaultErrorTranslator,
      jsonforms?.i18n?.translate ?? defaultTranslator,
      schema,
      uischema,
      path,
    )
  }

  return {
    // Without host errors, JSON Forms' own message is the local one: reuse it verbatim.
    localErrors: computed(() => {
      const { local } = split.value
      return local === undefined ? control.value.errors : format(local)
    }),
    serverErrors: computed(() => format(split.value.server)),
  }
}
