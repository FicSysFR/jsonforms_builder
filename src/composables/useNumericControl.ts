import type { JsonSchema } from '@jsonforms/core'
import { computed } from 'vue'
import { isEmpty } from 'radash'
import { useUiControl, type Options } from '../utils'

export const resolveNumericStep = (
  schema: JsonSchema | undefined,
  options?: Options,
): number => {
  const defaultStep = schema?.type === 'integer' ? 1 : 0.1

  return options?.step ?? defaultStep
}

export const calculateNumericPrecision = (
  step: number | undefined,
): number | undefined => {
  if (!step || Number.isInteger(step)) {
    return undefined
  }

  const stepStr = step.toString()

  if (stepStr.includes('e-')) {
    return parseInt(stepStr.split('e-')[1], 10)
  }

  const fraction = stepStr.split('.')[1]

  return fraction ? fraction.length : undefined
}

export const formatNumericValue = (
  value: unknown,
  precision: number | undefined,
): string | number | undefined | null => {
  if (value == null || value === '') {
    return value as undefined | null | ''
  }

  const num = Number(value)
  if (Number.isNaN(num)) {
    return value as string | number
  }

  if (precision !== undefined) {
    return num.toFixed(precision)
  }

  return value as string | number
}

export const createNumericAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    return isEmpty(value) ? clearValue : Number(value)
  }
}

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseNumericControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

export const useNumericControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseNumericControlOptions) => {
  const adaptTarget = createNumericAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const step = computed(() => {
    const options = control.appliedOptions.value as Options | undefined
    return resolveNumericStep(control.control.value.schema, options)
  })

  const precision = computed(() => {
    return calculateNumericPrecision(step.value)
  })

  const formattedValue = computed(() => {
    return formatNumericValue(control.control.value.data, precision.value)
  })

  return {
    ...control,
    adaptTarget,
    step,
    precision,
    formattedValue,
  }
}
