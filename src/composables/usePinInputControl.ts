import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UsePinInputControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Length used when neither the uischema nor the schema constrains it. */
export const DEFAULT_PIN_LENGTH = 5

/**
 * Length inferred from a regular-expression quantifier: `^\d{6}$` → 6.
 *
 * A range (`{4,6}`) returns its upper bound: `UPinInput` has a fixed number of cells;
 * better to show enough of them than to block input of values that are still valid.
 */
export const readPatternLength = (pattern: string | undefined): number | undefined => {
  const match = pattern?.match(/\{(\d+)(?:,(\d+))?\}/)
  if (!match) {
    return undefined
  }

  const length = Number(match[2] ?? match[1])

  return Number.isInteger(length) && length > 0 ? length : undefined
}

/** Resolution order: `options.length` → `maxLength` → `minLength` → pattern → default. */
export const resolvePinLength = (
  optionLength: unknown,
  schema: { maxLength?: number; minLength?: number; pattern?: string } | undefined,
): number => {
  const fromOption = Number(optionLength)
  if (Number.isInteger(fromOption) && fromOption > 0) {
    return fromOption
  }

  if (schema?.maxLength && schema.maxLength > 0) {
    return schema.maxLength
  }

  if (schema?.minLength && schema.minLength > 0) {
    return schema.minLength
  }

  return readPatternLength(schema?.pattern) ?? DEFAULT_PIN_LENGTH
}

/**
 * `UPinInput` works on a character array; the schema describes a string.
 * We therefore join the cells before propagating.
 */
export const createPinAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    const joined = Array.isArray(value)
      ? value.join('')
      : typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : ''

    return joined.length ? joined : clearValue
  }
}

/** Inverse path: the stored string to the array of cells. */
export const splitPinValue = (value: unknown): string[] => {
  if (typeof value === 'number') {
    return String(value).split('')
  }

  return typeof value === 'string' ? value.split('') : []
}

/**
 * Cell input type. `number` restricts input to the numeric keypad on mobile:
 * enabled as soon as the schema pattern only allows digits.
 */
export const resolvePinType = (
  optionType: unknown,
  pattern: string | undefined,
): 'text' | 'number' => {
  if (optionType === 'number' || optionType === 'text') {
    return optionType
  }

  if (
    pattern &&
    /^\^?(?:\\d|\[0-9\])/.test(pattern) &&
    !/[a-zA-Z]/.test(pattern.replace(/\\d/g, ''))
  ) {
    return 'number'
  }

  return 'text'
}

export const usePinInputControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UsePinInputControlOptions) => {
  const adaptTarget = createPinAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const length = computed(() =>
    resolvePinLength(control.appliedOptions.value?.length, control.control.value.schema),
  )

  const pinType = computed(() =>
    resolvePinType(control.appliedOptions.value?.type, control.control.value.schema?.pattern),
  )

  /** `options.mask: true` masks entered characters (confidential code). */
  const mask = computed(() => Boolean(control.appliedOptions.value?.mask))

  /** `options.otp: true` enables autocompletion of the code received by SMS. */
  const otp = computed(() => Boolean(control.appliedOptions.value?.otp))

  const modelValue = computed(() => splitPinValue(control.control.value.data))

  return {
    ...control,
    adaptTarget,
    length,
    pinType,
    mask,
    otp,
    modelValue,
  }
}
