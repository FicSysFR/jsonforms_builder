import { computed } from 'vue'
import { isEmpty } from 'radash'
import { useUiControl } from '../utils'

export const createStringAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    return isEmpty(value) ? clearValue : value
  }
}

export const resolveStringMaxLength = (
  schemaMaxLength: number | undefined,
  restrict: boolean,
): number | undefined => {
  return restrict ? schemaMaxLength : undefined
}

export const shouldShowStringCounter = (restrict: boolean): boolean => {
  return restrict
}

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseStringControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

export const useStringControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait = 100,
}: UseStringControlOptions) => {
  const adaptTarget = createStringAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const restrict = computed(() => Boolean(control.appliedOptions.value?.restrict))

  const maxLength = computed(() =>
    resolveStringMaxLength(control.control.value.schema?.maxLength, restrict.value),
  )

  const counter = computed(() => shouldShowStringCounter(restrict.value))

  const modelValue = computed(() => control.control.value.data)

  return {
    ...control,
    adaptTarget,
    restrict,
    maxLength,
    counter,
    modelValue,
  }
}
