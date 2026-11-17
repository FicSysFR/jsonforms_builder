import { createUiText, type UiText } from '../../i18n/ui'

export type WysiwygColor = {
  label: string
  /** CSS color stored in the document (inline style). */
  value: string
  /** Static Tailwind class used for the swatch icon in menus. */
  swatch: string
}

type ColorName = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
type ColorDefinition = { name: ColorName; value: string; swatch: string }

const TEXT_COLORS: readonly ColorDefinition[] = [
  { name: 'gray', value: '#6b7280', swatch: 'text-gray-500' },
  { name: 'red', value: '#dc2626', swatch: 'text-red-600' },
  { name: 'orange', value: '#ea580c', swatch: 'text-orange-600' },
  { name: 'yellow', value: '#ca8a04', swatch: 'text-yellow-600' },
  { name: 'green', value: '#16a34a', swatch: 'text-green-600' },
  { name: 'blue', value: '#2563eb', swatch: 'text-blue-600' },
  { name: 'purple', value: '#9333ea', swatch: 'text-purple-600' },
  { name: 'pink', value: '#db2777', swatch: 'text-pink-600' },
]

const HIGHLIGHT_COLORS: readonly ColorDefinition[] = [
  { name: 'yellow', value: '#fef08a', swatch: 'text-yellow-200' },
  { name: 'green', value: '#bbf7d0', swatch: 'text-green-200' },
  { name: 'blue', value: '#bfdbfe', swatch: 'text-blue-200' },
  { name: 'purple', value: '#e9d5ff', swatch: 'text-purple-200' },
  { name: 'pink', value: '#fbcfe8', swatch: 'text-pink-200' },
  { name: 'orange', value: '#fed7aa', swatch: 'text-orange-200' },
]

const labelled = (colors: readonly ColorDefinition[], t: UiText): WysiwygColor[] =>
  colors.map(({ name, value, swatch }) => ({
    label: t(`jsonformsBuilder.wysiwyg.color.${name}`),
    value,
    swatch,
  }))

/** Text colors labelled through `t`. */
export const buildWysiwygTextColors = (t: UiText = createUiText()): WysiwygColor[] =>
  labelled(TEXT_COLORS, t)

/** Highlight colors labelled through `t`. */
export const buildWysiwygHighlightColors = (t: UiText = createUiText()): WysiwygColor[] =>
  labelled(HIGHLIGHT_COLORS, t)

export const WYSIWYG_TEXT_COLORS: readonly WysiwygColor[] = Object.freeze(buildWysiwygTextColors())

export const WYSIWYG_HIGHLIGHT_COLORS: readonly WysiwygColor[] = Object.freeze(
  buildWysiwygHighlightColors(),
)
