import { computed } from 'vue'
import { useStringControl } from './useInputControl'

export const resolveTextareaRows = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0 ? value : fallback
}

type UseTextareaControlOptions = {
  jsonFormsControl: Parameters<typeof useStringControl>[0]['jsonFormsControl']
  clearValue: unknown
  debounceWait?: number
  defaultRows?: number
}

export const useTextareaControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
  defaultRows = 30,
}: UseTextareaControlOptions) => {
  const base = useStringControl({
    jsonFormsControl,
    clearValue,
    debounceWait,
  })

  const rows = computed(() => {
    return resolveTextareaRows(base.appliedOptions.value?.rows, defaultRows)
  })

  const minRows = computed(() => {
    return resolveTextareaRows(base.appliedOptions.value?.minRows, rows.value ?? defaultRows)
  })

  return {
    ...base,
    rows,
    minRows,
  }
}
