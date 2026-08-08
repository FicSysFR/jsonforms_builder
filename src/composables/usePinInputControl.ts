import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UsePinInputControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Longueur retenue quand ni le uischema ni le schéma ne la contraignent. */
export const DEFAULT_PIN_LENGTH = 5

/**
 * Longueur déduite d'un quantificateur d'expression régulière : `^\d{6}$` → 6.
 *
 * Un intervalle (`{4,6}`) renvoie sa borne haute : `UPinInput` a un nombre de cases fixe,
 * mieux vaut en afficher assez que d'empêcher la saisie de valeurs pourtant valides.
 */
export const readPatternLength = (pattern: string | undefined): number | undefined => {
  const match = pattern?.match(/\{(\d+)(?:,(\d+))?\}/)
  if (!match) {
    return undefined
  }

  const length = Number(match[2] ?? match[1])

  return Number.isInteger(length) && length > 0 ? length : undefined
}

/** Ordre de résolution : `options.length` → `maxLength` → `minLength` → motif → défaut. */
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
 * `UPinInput` travaille sur un tableau de caractères ; le schéma, lui, décrit une chaîne.
 * On recolle donc les cases avant de propager.
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

/** Chemin inverse : la chaîne stockée vers le tableau de cases. */
export const splitPinValue = (value: unknown): string[] => {
  if (typeof value === 'number') {
    return String(value).split('')
  }

  return typeof value === 'string' ? value.split('') : []
}

/**
 * Type de champ des cases. `number` restreint la saisie au pavé numérique sur mobile :
 * on l'active dès que le motif du schéma n'admet que des chiffres.
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

  /** `options.mask: true` masque les caractères saisis (code confidentiel). */
  const mask = computed(() => Boolean(control.appliedOptions.value?.mask))

  /** `options.otp: true` active l'autocomplétion du code reçu par SMS. */
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
