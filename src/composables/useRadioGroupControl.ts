import { computed } from 'vue'
import { isEmpty } from 'radash'
import { useUiControl } from '../utils'
import type { useJsonFormsEnumControl } from '@jsonforms/vue'

type JsonFormsEnumControl = ReturnType<typeof useJsonFormsEnumControl>

type UseRadioGroupControlOptions = {
  jsonFormsControl: JsonFormsEnumControl
  clearValue: unknown
  debounceWait?: number
}

export const createRadioAdaptTarget = (clearValue: unknown) => {
  return (value: unknown) => (isEmpty(value) ? clearValue : value)
}

export const useRadioGroupControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait = 100,
}: UseRadioGroupControlOptions) => {
  const adaptTarget = createRadioAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const modelValue = computed(() => control.control.value.data)

  const disable = computed(() => !control.control.value.enabled && !control.isReadonly.value)

  return {
    ...control,
    adaptTarget,
    modelValue,
    disable,
  }
}
