import { computed } from 'vue'
import { isNumber } from 'radash'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseRatingControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Default number of icons, aligned with `UInputRating`. */
export const DEFAULT_RATING_LENGTH = 5

/** Resolution order: `options.length` → schema `maximum` → default. */
export const resolveRatingLength = (
  optionLength: unknown,
  schemaMaximum: number | undefined,
): number => {
  const fromOption = Number(optionLength)
  if (Number.isInteger(fromOption) && fromOption > 0) {
    return fromOption
  }

  if (isNumber(schemaMaximum) && schemaMaximum > 0) {
    return Math.round(schemaMaximum)
  }

  return DEFAULT_RATING_LENGTH
}

/**
 * `UInputRating`'s `step` counts *subdivisions per icon*, whereas `multipleOf` describes
 * a value step: `multipleOf: 0.5` (half-stars) therefore maps to `step: 2`.
 */
export const resolveRatingStep = (multipleOf: number | undefined): number => {
  if (!isNumber(multipleOf) || multipleOf <= 0 || multipleOf >= 1) {
    return 1
  }

  const step = Math.round(1 / multipleOf)

  return Number.isFinite(step) && step > 0 ? step : 1
}

/**
 * `UInputRating` resets the rating to `0` when the current icon is clicked again (`clearable` mode).
 * If the schema requires a strictly positive minimum, that `0` is not a rating: it is an
 * absence of rating, and we propagate it as such rather than as an invalid value.
 */
export const createRatingAdaptTarget = (clearValue: unknown, minimum?: number) => {
  return (value: unknown): unknown => {
    if (value === null || value === undefined || value === '') {
      return clearValue
    }

    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
      return clearValue
    }

    if (numeric === 0 && isNumber(minimum) && minimum > 0) {
      return clearValue
    }

    return numeric
  }
}

export const useRatingControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseRatingControlOptions) => {
  // `useUiControl` freezes `adaptTarget`: `minimum` is therefore re-read on each call rather
  // than captured at construction time, so we follow a schema that may change along the way.
  const adaptTarget = (value: unknown) =>
    createRatingAdaptTarget(clearValue, jsonFormsControl.control.value.schema?.minimum)(value)

  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const length = computed(() =>
    resolveRatingLength(
      control.appliedOptions.value?.length,
      control.control.value.schema?.maximum,
    ),
  )

  const step = computed(() => resolveRatingStep(control.control.value.schema?.multipleOf))

  const modelValue = computed(() => {
    const data = control.control.value.data

    return isNumber(data) ? data : 0
  })

  /** Without an imposed minimum, the rating resets to zero on a second click. */
  const clearable = computed(() => {
    if (control.appliedOptions.value?.clearable !== undefined) {
      return Boolean(control.appliedOptions.value.clearable)
    }

    return !control.control.value.required
  })

  return {
    ...control,
    adaptTarget,
    length,
    step,
    modelValue,
    clearable,
  }
}
