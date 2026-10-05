export type WysiwygColor = {
  label: string
  /** CSS color stored in the document (inline style). */
  value: string
  /** Static Tailwind class used for the swatch icon in menus. */
  swatch: string
}

export const WYSIWYG_TEXT_COLORS: readonly WysiwygColor[] = Object.freeze([
  { label: 'Gris', value: '#6b7280', swatch: 'text-gray-500' },
  { label: 'Rouge', value: '#dc2626', swatch: 'text-red-600' },
  { label: 'Orange', value: '#ea580c', swatch: 'text-orange-600' },
  { label: 'Jaune', value: '#ca8a04', swatch: 'text-yellow-600' },
  { label: 'Vert', value: '#16a34a', swatch: 'text-green-600' },
  { label: 'Bleu', value: '#2563eb', swatch: 'text-blue-600' },
  { label: 'Violet', value: '#9333ea', swatch: 'text-purple-600' },
  { label: 'Rose', value: '#db2777', swatch: 'text-pink-600' },
])

export const WYSIWYG_HIGHLIGHT_COLORS: readonly WysiwygColor[] = Object.freeze([
  { label: 'Jaune', value: '#fef08a', swatch: 'text-yellow-200' },
  { label: 'Vert', value: '#bbf7d0', swatch: 'text-green-200' },
  { label: 'Bleu', value: '#bfdbfe', swatch: 'text-blue-200' },
  { label: 'Violet', value: '#e9d5ff', swatch: 'text-purple-200' },
  { label: 'Rose', value: '#fbcfe8', swatch: 'text-pink-200' },
  { label: 'Orange', value: '#fed7aa', swatch: 'text-orange-200' },
])
