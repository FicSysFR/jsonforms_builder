import {
  and,
  hasOption,
  isEnumControl,
  isOneOfEnumControl,
  isPrimitiveArrayControl,
  isStringControl,
  or,
  rankWith,
  type RankedTester,
} from '@jsonforms/core'
import { computed } from 'vue'
import { isArray, isEmpty, isString } from 'radash'
import { determineClearValue, useUiControl } from '../utils'
import type { useJsonFormsEnumControl } from '@jsonforms/vue'

const enumOrSuggestionTester = rankWith(
  2,
  and(or(isStringControl, isPrimitiveArrayControl), or(hasOption('suggestion'), isEnumControl)),
)

/**
 * Rank 5 for a `oneOf` of constants (`[{ const, title }]`, any value type): above the
 * combinator renderer (3), which would otherwise render each constant as an object variant,
 * and below `options.format: 'select' | 'radio'` (20).
 */
const oneOfConstantsTester = rankWith(5, isOneOfEnumControl)

export const enumSuggestionTester: RankedTester = (uischema, schema, context) =>
  Math.max(
    enumOrSuggestionTester(uischema, schema, context),
    oneOfConstantsTester(uischema, schema, context),
  )

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
