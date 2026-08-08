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

/** Sac d'options libre issu de `uischema.options` / `config` JSON Forms. */
export type UiOptionBag = Record<string, unknown>

/**
 * Valeur de remplacement quand un champ est masqué par une règle : `default`
 * du schéma s'il est défini, sinon `undefined`.
 */
export const resolveClearOnHideValue = (schema?: JsonSchema) => {
  if (schema && Object.hasOwn(schema, 'default')) {
    return schema.default
  }

  return undefined
}

/**
 * Vérifie si un champ est en lecture seule en tenant compte de la compatibilité
 * avec les différentes versions de JSON Schema
 */
const isFieldReadonly = (
  schema: JsonSchema,
  uischema: { options?: Record<string, unknown> },
): boolean => {
  // Vérification de la propriété readonly dans le uischema (toujours supportée)
  if (uischema?.options?.readonly === true) {
    return true
  }

  // Vérification de la propriété readOnly dans le schema
  // Cette propriété n'existe que depuis JSON Schema Draft 6
  // En JSON Schema v4, cette propriété n'est pas disponible
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
  // `defu(override, base)` : les options du uischema priment sur la config globale.
  // defu ne mute jamais ses entrées, ce qui remplace le couple cloneDeep + merge de la v1.
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
 * Extrait un sac de props destiné à un composant Nuxt UI depuis les options du uischema.
 *
 * Remplace le `quasarProps('q-input')` de la v1. Le uischema peut ainsi piloter finement
 * n'importe quel composant sans que la librairie ait à exposer une prop dédiée :
 *
 * ```json
 * { "type": "Control", "scope": "#/properties/name",
 *   "options": { "input": { "size": "lg", "ui": { "base": "font-mono" } } } }
 * ```
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
   * Les règles SHOW/HIDE ne touchent que l'UI côté JSON Forms. Ici, dès qu'un
   * contrôle devient invisible, on remet sa donnée au défaut du schéma (ou
   * `undefined`) pour ne pas laisser de valeurs « fantômes » dans le modèle.
   * Désactivable via `config` / `options.clearOnHide: false`.
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
   * La description ne s'affiche que lorsqu'elle est pertinente : masquée au repos si
   * `showUnfocusedDescription` est absent, révélée au focus.
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

    // `hideDescription` supprime le texte d'aide pour ce champ précis. Utilisé par le
    // renderer de tableau sur ses lignes de valeurs simples, où la description du schéma
    // d'élément serait répétée à l'identique sous chaque ligne.
    return {
      id,
      description: appliedOptions.value?.hideDescription === true ? undefined : description,
      errors,
      label,
      visible,
      required,
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

  /** `disabled` au sens Nuxt UI : désactivé sauf si l'on est simplement en lecture seule. */
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
