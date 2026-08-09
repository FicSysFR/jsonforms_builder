import {
  computeLabel,
  type ControlElement,
  type DispatchPropsOfControl,
  isDescriptionHidden,
  type JsonFormsSubStates,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import { debounce, get, isObject } from 'radash'
import { defu } from 'defu'
import { computed, type ComputedRef, inject, ref, watch } from 'vue'
import { useTheme } from '../theme'
import { IsDynamicPropertyContext } from './inject'

/** Loose options bag from JSON Forms `uischema.options` / `config`. */
export type UiOptionBag = Record<string, unknown>

/**
 * Replacement value when a field is hidden by a rule: schema `default` when defined,
 * otherwise `undefined`.
 */
export const resolveClearOnHideValue = (schema?: JsonSchema) => {
  if (schema && Object.hasOwn(schema, 'default')) {
    return schema.default
  }

  return undefined
}

/**
 * Checks whether a field is read-only, accounting for compatibility across JSON Schema
 * versions.
 */
const isFieldReadonly = (
  schema: JsonSchema,
  uischema: { options?: Record<string, unknown> },
): boolean => {
  // Check readonly in uischema (always supported)
  if (uischema?.options?.readonly === true) {
    return true
  }

  // Check readOnly in the schema
  // This property exists only since JSON Schema Draft 6
  // In JSON Schema v4, this property is not available
  if (schema && 'readOnly' in schema && schema.readOnly === true) {
    return true
  }

  return false
}

export const useControlAppliedOptions = <
  T extends { config?: UiOptionBag; uischema: UISchemaElement },
  I extends {
    control: ComputedRef<T>
  },
>(
  input: I,
) => {
  // `defu(override, base)`: uischema options override global config.
  // defu never mutates its inputs, replacing the v1 cloneDeep + merge pair.
  return computed(() =>
    defu(
      {} as UiOptionBag,
      (input.control.value.uischema.options ?? {}) as UiOptionBag,
      (input.control.value.config ?? {}) as UiOptionBag,
    ),
  )
}

export const useLayoutAppliedOptions = <
  T extends { config?: UiOptionBag; uischema: UISchemaElement },
  I extends {
    layout: ComputedRef<T>
  },
>(
  input: I,
) => {
  return computed(() =>
    defu(
      {} as UiOptionBag,
      (input.layout.value.uischema.options ?? {}) as UiOptionBag,
      (input.layout.value.config ?? {}) as UiOptionBag,
    ),
  )
}

export const useComputedLabel = <
  T extends { label: string; required: boolean },
  I extends { control: ComputedRef<T> },
>(
  input: I,
  appliedOptions: ReturnType<typeof useControlAppliedOptions>,
) => {
  return computed((): string => {
    return computeLabel(
      input.control.value.label,
      input.control.value.required,
      !!appliedOptions.value?.hideRequiredAsterisk,
    )
  })
}

/**
 * Extracts a prop bag for a Nuxt UI component from uischema options.
 *
 * Replaces v1's `quasarProps('q-input')`. The uischema can thus drive any component in
 * detail without the library exposing a dedicated prop:
 *
 * ```json
 * { "type": "Control", "scope": "#/properties/name",
 *   "options": { "input": { "size": "lg", "ui": { "base": "font-mono" } } } }
 * ```
 *
 * Top-level `leadingIcon` / `trailingIcon` are rendered by the control wrapper beside the
 * widget. Pass-through stays free for icons inside Nuxt UI chrome
 * (`options.input.leadingIcon`, …).
 */
const createUiProps = (appliedOptions: ComputedRef<UiOptionBag>) => {
  return (path: string): UiOptionBag => {
    const props = get(appliedOptions.value, path)

    return props && isObject(props) ? (props as UiOptionBag) : {}
  }
}

export const useUiLabel = <
  T extends {
    uischema: UISchemaElement
    config?: UiOptionBag
  },
  I extends {
    label: ComputedRef<T>
  },
>(
  input: I,
) => {
  const styles = useTheme(input.label.value.uischema)
  const appliedOptions = computed(() =>
    defu(
      {} as UiOptionBag,
      (input.label.value.uischema.options ?? {}) as UiOptionBag,
      (input.label.value.config ?? {}) as UiOptionBag,
    ),
  )

  return {
    ...input,
    appliedOptions,
    uiProps: createUiProps(appliedOptions),
    styles,
  }
}

export const useUiControl = <
  T extends {
    schema: NonNullable<JsonSchema>
    uischema: ControlElement
    path: string
    config?: UiOptionBag
    label: string
    description: string
    required: boolean
    enabled: boolean
    errors: string
    data: unknown
    id: string
    visible: boolean
  },
  I extends {
    control: ComputedRef<T>
    handleChange?: DispatchPropsOfControl['handleChange']
  },
>(
  input: I,
  adaptTarget: (target: unknown) => unknown = (v) => v,
  debounceWait?: number,
) => {
  const touched = ref(false)

  const handleChange = input.handleChange
  const changeEmitter =
    typeof debounceWait === 'number' && handleChange
      ? debounce({ delay: debounceWait }, handleChange)
      : handleChange

  const onChange = (value: unknown) => {
    if (changeEmitter) {
      changeEmitter(input.control.value.path, adaptTarget(value))
    }
  }

  const appliedOptions = useControlAppliedOptions(input)
  const isFocused = ref(false)

  /**
   * SHOW/HIDE rules affect only the UI in JSON Forms. Here, as soon as a control becomes
   * invisible, we reset its data to the schema default (or `undefined`) so no "ghost"
   * values remain in the model. Disable via `config` / `options.clearOnHide: false`.
   */
  watch(
    () => input.control.value.visible,
    (visible, wasVisible) => {
      if (appliedOptions.value?.clearOnHide === false || !handleChange) {
        return
      }

      if (wasVisible !== true || visible !== false) {
        return
      }

      const clearValue = resolveClearOnHideValue(input.control.value.schema)
      if (Object.is(input.control.value.data, clearValue)) {
        return
      }

      handleChange(input.control.value.path, clearValue)
    },
  )

  const handleFocus = () => {
    isFocused.value = true
  }

  const handleBlur = () => {
    touched.value = true
    isFocused.value = false
  }

  const filteredErrors = computed(() => {
    return touched.value || !appliedOptions.value.enableFilterErrorsBeforeTouch
      ? input.control.value.errors
      : ''
  })

  /**
   * The description is shown only when relevant: hidden at rest unless
   * `showUnfocusedDescription` is set, revealed on focus.
   */
  const showDescription = (): boolean => {
    return !isDescriptionHidden(
      input.control.value.visible,
      input.control.value.description,
      isFocused.value,
      !!appliedOptions.value?.showUnfocusedDescription,
    )
  }

  const isHovered = ref(false)

  const isClearable = computed(() => {
    if (appliedOptions.value?.clearable !== undefined) {
      return Boolean(appliedOptions.value.clearable)
    }

    return isHovered.value || isFocused.value
  })

  const controlWrapper = computed(() => {
    const { description, errors, label, visible, required } = input.control.value
    const id = input.control.value.id.replace(/#\//g, '').replace(/\//g, '_')

    // `hideDescription` removes help text for this field. Used by the array renderer on
    // primitive item rows, where the item schema description would repeat identically under
    // every row.
    const leadingIcon =
      typeof appliedOptions.value?.leadingIcon === 'string' && appliedOptions.value.leadingIcon
        ? appliedOptions.value.leadingIcon
        : undefined
    const trailingIcon =
      typeof appliedOptions.value?.trailingIcon === 'string' && appliedOptions.value.trailingIcon
        ? appliedOptions.value.trailingIcon
        : undefined

    return {
      id,
      description: appliedOptions.value?.hideDescription === true ? undefined : description,
      errors,
      label,
      visible,
      required,
      leadingIcon,
      trailingIcon,
    }
  })

  const computedLabel = useComputedLabel(input, appliedOptions)

  const styles = useTheme(input?.control?.value?.uischema)

  const overwrittenControl = computed(() => {
    return {
      ...input.control.value,
      errors: filteredErrors.value,
    }
  })

  const rawErrors = computed(() => input.control.value.errors)

  const isReadonly = computed(() => {
    if (input.control.value.config?.readonly === true) {
      return true
    }

    return isFieldReadonly(input.control.value?.schema, input.control.value?.uischema)
  })

  /** `disabled` in the Nuxt UI sense: disabled unless we are simply read-only. */
  const isDisabled = computed(() => !input.control.value.enabled && !isReadonly.value)

  return {
    ...input,
    control: overwrittenControl,
    styles,
    isFocused,
    appliedOptions,
    controlWrapper,
    computedLabel,
    touched,
    uiProps: createUiProps(appliedOptions),
    showDescription,
    handleBlur,
    handleFocus,
    onChange,
    rawErrors,
    isHovered,
    isClearable,
    isReadonly,
    isDisabled,
  }
}

export const useUiLayout = <
  I extends {
    layout: ComputedRef<{
      uischema: UISchemaElement
      config?: UiOptionBag
    }>
  },
>(
  input: I,
) => {
  const appliedOptions = computed(() =>
    defu(
      {} as UiOptionBag,
      (input.layout.value.uischema.options ?? {}) as UiOptionBag,
      (input.layout.value.config ?? {}) as UiOptionBag,
    ),
  )

  return {
    ...input,
    styles: useTheme(input.layout.value.uischema),
    appliedOptions,
    uiProps: createUiProps(appliedOptions),
  }
}

export const useJsonForms = () => {
  const jsonforms = inject<JsonFormsSubStates>('jsonforms')

  if (!jsonforms) {
    throw new Error("jsonforms couldn't be injected. Are you within JSON Forms?")
  }

  return jsonforms
}

export const determineClearValue = (defaultValue: unknown) => {
  const jsonforms = useJsonForms()
  const useDefaultValue = inject<boolean>(
    IsDynamicPropertyContext,
    jsonforms.core?.schema.type !== 'object',
  )

  return useDefaultValue ? defaultValue : undefined
}

export { isFieldReadonly }
