import { computed } from 'vue'
import { isNumber } from 'radash'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseRatingControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Nombre d'icônes par défaut, aligné sur `UInputRating`. */
export const DEFAULT_RATING_LENGTH = 5

/** Ordre de résolution : `options.length` → `maximum` du schéma → défaut. */
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
 * `step` de `UInputRating` compte les *subdivisions par icône*, là où `multipleOf` décrit
 * un pas de valeur : `multipleOf: 0.5` (demi-étoiles) correspond donc à `step: 2`.
 */
export const resolveRatingStep = (multipleOf: number | undefined): number => {
  if (!isNumber(multipleOf) || multipleOf <= 0 || multipleOf >= 1) {
    return 1
  }

  const step = Math.round(1 / multipleOf)

  return Number.isFinite(step) && step > 0 ? step : 1
}

/**
 * `UInputRating` remet la note à `0` quand on reclique l'icône courante (mode `clearable`).
 * Si le schéma exige un minimum strictement positif, ce `0` n'est pas une note : c'est une
 * absence de note, et on la propage comme telle plutôt que comme une valeur invalide.
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
  // `useUiControl` fige `adaptTarget` : le `minimum` est donc relu à chaque appel plutôt
  // que capturé à la construction, pour suivre un schéma qui changerait en cours de route.
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

  /** Sans minimum imposé, la note se remet à zéro d'un second clic. */
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
