import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseColorControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Formats de sortie acceptés par `UColorPicker`. */
export const COLOR_FORMATS = ['hex', 'rgb', 'hsl', 'cmyk', 'lab'] as const

export type ColorFormat = (typeof COLOR_FORMATS)[number]

/** Couleur affichée dans la pastille quand le champ est encore vide. */
export const DEFAULT_COLOR = '#000000'

export const resolveColorFormat = (option: unknown): ColorFormat => {
  return COLOR_FORMATS.includes(option as ColorFormat) ? (option as ColorFormat) : 'hex'
}

/** `#abc`, `#aabbcc`, `#aabbccdd` — les trois notations hexadécimales usuelles. */
export const isHexColor = (value: unknown): boolean => {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
}

/**
 * Valeur passée à `background-color` pour la pastille de prévisualisation.
 *
 * On retombe sur `fallback` plutôt que de laisser une chaîne partielle (`#ab`, saisie en
 * cours) : le navigateur ignore silencieusement une couleur invalide et la pastille
 * garderait celle d'avant, ce qui se lit comme un bug.
 */
export const toSwatch = (value: unknown, fallback: string = DEFAULT_COLOR): string => {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return fallback
  }

  if (trimmed.startsWith('#')) {
    return isHexColor(trimmed) ? trimmed : fallback
  }

  // `rgb(...)`, `hsl(...)`, `rebeccapurple`… : on fait confiance au navigateur.
  return trimmed
}

export const createColorAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    if (typeof value !== 'string') {
      return clearValue
    }

    const trimmed = value.trim()

    return trimmed.length ? trimmed : clearValue
  }
}

export const useColorControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseColorControlOptions) => {
  const adaptTarget = createColorAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const colorFormat = computed(() => resolveColorFormat(control.appliedOptions.value?.colorFormat))

  const modelValue = computed(() =>
    typeof control.control.value.data === 'string' ? control.control.value.data : '',
  )

  /** Couleur de la pastille : la valeur si elle est exploitable, le défaut sinon. */
  const swatch = computed(() =>
    toSwatch(control.control.value.data, control.control.value.schema?.default ?? DEFAULT_COLOR),
  )

  /** Le champ texte accompagne la pipette ; `options.showInput: false` le retire. */
  const showInput = computed(() => control.appliedOptions.value?.showInput !== false)

  return {
    ...control,
    adaptTarget,
    colorFormat,
    modelValue,
    swatch,
    showInput,
  }
}
