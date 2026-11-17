import { computed } from 'vue'
import { isEmpty } from '../utils/lang'
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

  // `URadioGroup` has no `readonly` prop: a read-only radio group is rendered disabled.
  const disable = computed(() => control.isLocked.value)

  return {
    ...control,
    adaptTarget,
    modelValue,
    disable,
  }
}
