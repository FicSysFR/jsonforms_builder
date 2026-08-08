import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseTagsControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/**
 * `UInputTags` emits a string array. We drop empty entries (a lone comma,
 * whitespace confirmed via `addOnBlur`) and fall back to `clearValue` when nothing
 * remains — leaving `[]` in the model would fail a `minItems: 1` with a
 * message that matches nothing visible on screen.
 */
export const createTagsAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    if (!Array.isArray(value)) {
      return clearValue
    }

    const tags = value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag ?? '').trim()))
      .filter((tag) => tag.length > 0)

    return tags.length ? tags : clearValue
  }
}

/** Normalizes stored data to the array expected by the component. */
export const toTagsModel = (data: unknown): string[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((tag) => (typeof tag === 'string' ? tag : String(tag ?? '')))
}

/**
 * `UInputTags`' `duplicate` allows duplicates; schema `uniqueItems` forbids them.
 * The two say the same thing in opposite directions.
 */
export const allowsDuplicateTags = (uniqueItems: boolean | undefined): boolean => {
  return uniqueItems !== true
}

/** Input separators: `options.delimiter`, otherwise comma. */
export const resolveTagsDelimiter = (delimiter: unknown): string => {
  return typeof delimiter === 'string' ? delimiter : ','
}

export const useTagsControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseTagsControlOptions) => {
  const adaptTarget = createTagsAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const modelValue = computed(() => toTagsModel(control.control.value.data))

  const max = computed(() => control.control.value.schema?.maxItems)

  const duplicate = computed(() => allowsDuplicateTags(control.control.value.schema?.uniqueItems))

  const delimiter = computed(() => resolveTagsDelimiter(control.appliedOptions.value?.delimiter))

  /** Maximum length of a single tag, taken from the items schema. */
  const maxLength = computed(() => {
    const items = control.control.value.schema?.items

    return items && !Array.isArray(items) ? items.maxLength : undefined
  })

  return {
    ...control,
    adaptTarget,
    modelValue,
    max,
    duplicate,
    delimiter,
    maxLength,
  }
}
