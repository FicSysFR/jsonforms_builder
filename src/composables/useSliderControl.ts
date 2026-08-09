import { computed } from 'vue'
import { isNumber } from 'radash'
import {
  and,
  or,
  schemaMatches,
  schemaTypeIs,
  uiTypeIs,
  type JsonSchema,
  type Tester,
  type UISchemaElement,
} from '@jsonforms/core'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseSliderControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: number
  debounceWait?: number
}

/**
 * Truthy `options.slider`: `true` activates the renderer; an object also activates
 * and is spread onto `USlider` via `uiProps('slider')`.
 *
 * Unlike stock JSON Forms `isRangeControl`, we do not require `schema.default`
 * (data can supply the initial value) and we accept object pass-through.
 */
export const isSliderOption = (uischema: UISchemaElement): boolean => {
  const slider = uischema.options?.slider
  return slider === true || (typeof slider === 'object' && slider !== null)
}

export const isSliderControl: Tester = and(
  uiTypeIs('Control'),
  or(schemaTypeIs('number'), schemaTypeIs('integer')),
  (uischema) => isSliderOption(uischema),
  schemaMatches(
    (schema: JsonSchema) =>
      Object.prototype.hasOwnProperty.call(schema, 'maximum') &&
      Object.prototype.hasOwnProperty.call(schema, 'minimum'),
  ),
)

export const createSliderAdaptTarget = (clearValue: number) => {
  return (value: unknown): number => {
    if (value === null || value === undefined || value === '') {
      return clearValue
    }

    if (isNumber(value)) {
      return value
    }

    const numeric = Number(value)
    return Number.isNaN(numeric) ? clearValue : numeric
  }
}

export const resolveSliderMin = (schemaMinimum: number | undefined): number => {
  return schemaMinimum ?? 0
}

export const resolveSliderMax = (schemaMaximum: number | undefined): number => {
  return schemaMaximum ?? 100
}

export const resolveSliderStep = (
  multipleOf: number | undefined,
  optionStep?: unknown,
): number => {
  if (typeof optionStep === 'number' && Number.isFinite(optionStep) && optionStep > 0) {
    return optionStep
  }
  return multipleOf ?? 1
}

export const useSliderControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseSliderControlOptions) => {
  const adaptTarget = createSliderAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const min = computed(() => resolveSliderMin(control.control.value.schema?.minimum))
  const max = computed(() => resolveSliderMax(control.control.value.schema?.maximum))
  const step = computed(() =>
    resolveSliderStep(
      control.control.value.schema?.multipleOf,
      control.appliedOptions.value?.step,
    ),
  )
  const modelValue = computed(() => {
    const data = control.control.value.data
    return typeof data === 'number' && Number.isFinite(data) ? data : min.value
  })
  const showValue = computed(() => control.appliedOptions.value?.hideValue !== true)

  return {
    ...control,
    adaptTarget,
    min,
    max,
    step,
    modelValue,
    showValue,
  }
}
