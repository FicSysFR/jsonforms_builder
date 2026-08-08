import { computeLabel, ControlElement, DispatchPropsOfControl, DispatchPropsOfMultiEnumControl, isDescriptionHidden, JsonFormsSubStates, JsonSchema, UISchemaElement } from '@jsonforms/core'
import { debounce, get, isObject } from 'radash'
import { defu } from 'defu'
import { computed, ComputedRef, inject, ref } from 'vue'
import { useTheme } from '../theme'
import { IsDynamicPropertyContext } from './inject'

/**
 * Vérifie si un champ est en lecture seule en tenant compte de la compatibilité
 * avec les différentes versions de JSON Schema
 */
const isFieldReadonly = (schema: JsonSchema, uischema: any): boolean => {
  // Vérification de la propriété readonly dans le uischema (toujours supportée)
  if (uischema?.options?.readonly === true) {
    return true
  }

  // Vérification de la propriété readOnly dans le schema
  // Cette propriété n'existe que depuis JSON Schema Draft 6
  // En JSON Schema v4, cette propriété n'est pas disponible
  if (schema && 'readOnly' in schema && (schema as any).readOnly === true) {
    return true
  }

  return false
}

export const useControlAppliedOptions = <
  T extends { config: any; uischema: UISchemaElement },
  I extends {
    control: ComputedRef<T>,
  },
>(
  input: I,
) => {
  // `defu(override, base)` : les options du uischema priment sur la config globale.
  // defu ne mute jamais ses entrées, ce qui remplace le couple cloneDeep + merge de la v1.
  return computed(() =>
    defu({} as Record<string, any>, input.control.value.uischema.options ?? {}, input.control.value.config ?? {}),
  )
}

export const useLayoutAppliedOptions = <
  T extends { config: any; uischema: UISchemaElement },
  I extends {
    layout: ComputedRef<T>,
  },
>(
  input: I,
) => {
  return computed(() =>
    defu({} as Record<string, any>, input.layout.value.uischema.options ?? {}, input.layout.value.config ?? {}),
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
const createUiProps = (appliedOptions: ComputedRef<Record<string, any>>) => {
  return (path: string): Record<string, any> => {
    const props = get(appliedOptions.value, path)

    return props && isObject(props) ? (props as Record<string, any>) : {}
  }
}

export const useUiLabel = <
  T extends {
    uischema: UISchemaElement,
    config: any,
  },
  I extends {
    label: ComputedRef<T>,
  },
>(
  input: I,
) => {
  const styles = useTheme(input.label.value.uischema)
  const appliedOptions = computed(() =>
    defu({} as Record<string, any>, input.label.value.uischema.options ?? {}, input.label.value.config ?? {}),
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
    config: any
    label: string
    description: string
    required: boolean
    enabled: boolean
    errors: string
    data: any
    id: string
    visible: boolean
  },
  I extends {
    control: ComputedRef<T>
  } & (DispatchPropsOfControl | DispatchPropsOfMultiEnumControl),
>(
  input: I,
  adaptTarget: (target: any) => any = (v) => v,
  debounceWait?: number,
) => {
  const touched = ref(false)

  const handleChange = (input as DispatchPropsOfControl).handleChange
  const changeEmitter =
    typeof debounceWait === 'number' && handleChange
      ? debounce({ delay: debounceWait }, handleChange)
      : handleChange

  const onChange = (value: any) => {
    if (changeEmitter) {
      changeEmitter(input.control.value.path, adaptTarget(value))
    }
  }

  const appliedOptions = useControlAppliedOptions(input)
  const isFocused = ref(false)

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
      return appliedOptions.value.clearable
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
      description: appliedOptions.value?.hideDescription ? undefined : description,
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

    return isFieldReadonly(
      input.control.value?.schema,
      input.control.value?.uischema,
    )
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

export const useUiLayout = <I extends { layout: any }>(input: I) => {
  const appliedOptions = computed(() =>
    defu({} as Record<string, any>, input.layout.value.uischema.options ?? {}, input.layout.value.config ?? {}),
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
    throw new Error(
      "jsonforms couldn't be injected. Are you within JSON Forms?",
    )
  }

  return jsonforms
}

export const determineClearValue = (defaultValue: any) => {
  const jsonforms = useJsonForms()
  const useDefaultValue = inject<boolean>(
    IsDynamicPropertyContext,
    jsonforms.core?.schema.type !== 'object',
  )

  return useDefaultValue ? defaultValue : undefined
}

export { isFieldReadonly }
