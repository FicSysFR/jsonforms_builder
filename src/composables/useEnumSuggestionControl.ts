import { computed } from 'vue'
import { isArray, isEmpty, isString } from 'radash'
import { determineClearValue, useUiControl } from '../utils'
import type { useJsonFormsEnumControl } from '@jsonforms/vue'

type JsonFormsEnumControl = ReturnType<typeof useJsonFormsEnumControl>

type UseEnumSuggestionControlOptions = {
  jsonFormsControl: JsonFormsEnumControl
  clearValue?: unknown
  debounceWait?: number
}

export const createEnumAdaptTarget = (clearValue: unknown) => {
  return (value: unknown) => (isEmpty(value) ? clearValue : value)
}

export const isArraySchemaControl = (control: JsonFormsEnumControl['control']['value']) => {
  const schemaType = control.schema?.type

  if (schemaType === 'array') {
    return true
  }

  if (isArray(schemaType)) {
    return schemaType.includes('array')
  }

  return false
}

export const normalizeSuggestions = (suggestions: unknown): string[] | undefined => {
  if (!suggestions) {
    return undefined
  }

  if (!isArray(suggestions)) {
    console.warn('Suggestions must be an array')
    return undefined
  }

  const validSuggestions = suggestions
    .filter((suggestion) => {
      if (isString(suggestion)) {
        return true
      }
      if (suggestion != null && typeof suggestion.toString === 'function') {
        return true
      }
      console.warn('Invalid suggestion item:', suggestion)
      return false
    })
    .map((suggestion) => (isString(suggestion) ? suggestion : suggestion.toString()))

  return !isEmpty(validSuggestions) ? validSuggestions : undefined
}

export const useEnumSuggestionControl = ({
  jsonFormsControl,
  clearValue = determineClearValue(undefined),
  debounceWait = 100,
}: UseEnumSuggestionControlOptions) => {
  const adaptTarget = createEnumAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const isArrayControl = computed(() => isArraySchemaControl(control.control.value))

  const suggestions = computed(() =>
    normalizeSuggestions(control.control.value.uischema.options?.suggestion),
  )

  return {
    ...control,
    adaptTarget,
    isArrayControl,
    suggestions,
  }
}
