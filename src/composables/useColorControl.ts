import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseColorControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/** Output formats accepted by `UColorPicker`. */
export const COLOR_FORMATS = ['hex', 'rgb', 'hsl', 'cmyk', 'lab'] as const

export type ColorFormat = (typeof COLOR_FORMATS)[number]

/** Color shown in the swatch when the field is still empty. */
export const DEFAULT_COLOR = '#000000'

export const resolveColorFormat = (option: unknown): ColorFormat => {
  return COLOR_FORMATS.includes(option as ColorFormat) ? (option as ColorFormat) : 'hex'
}

/** `#abc`, `#aabbcc`, `#aabbccdd` — the three usual hexadecimal notations. */
export const isHexColor = (value: unknown): boolean => {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
}

/**
 * Value passed to `background-color` for the preview swatch.
 *
 * We fall back to `fallback` rather than leaving a partial string (`#ab`, mid-typing):
 * the browser silently ignores an invalid color and the swatch would keep the previous
 * one, which reads as a bug.
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

  // `rgb(...)`, `hsl(...)`, `rebeccapurple`…: trust the browser.
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

  /** Swatch color: the value if usable, otherwise the default. */
  const swatch = computed(() =>
    toSwatch(control.control.value.data, control.control.value.schema?.default ?? DEFAULT_COLOR),
  )

  /** The text field accompanies the eyedropper; `options.showInput: false` removes it. */
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
