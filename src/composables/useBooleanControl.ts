import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseBooleanControlOptions = {
  jsonFormsControl: UiControlInput
  debounceWait?: number
}

export const useBooleanControl = ({ jsonFormsControl, debounceWait }: UseBooleanControlOptions) => {
  const control = useUiControl(jsonFormsControl, undefined, debounceWait)

  const modelValue = computed(() => control.control.value.data)
  const disable = computed(() =>
    resolveBooleanDisable(control.control.value.enabled, control.isReadonly.value),
  )

  return {
    ...control,
    modelValue,
    disable,
  }
}

export const resolveBooleanDisable = (enabled: boolean, isReadonly: boolean) => {
  return !enabled && !isReadonly
}
