import { describe, expect, it } from 'vitest'
import { createJsonFormsTranslator } from '../../src/i18n/createJsonFormsTranslator'
import { createUiText, formatUiMessage, getUiTranslations, UI_MESSAGES } from '../../src/i18n/ui'

describe('interface texts', () => {
  it('translate every French key into English and back', () => {
    expect(Object.keys(UI_MESSAGES.en).sort()).toEqual(Object.keys(UI_MESSAGES.fr).sort())
    for (const [key, text] of Object.entries(UI_MESSAGES.en)) {
      expect(text, key).not.toBe('')
    }
  })

  it('keep the same placeholders in both languages', () => {
    const placeholders = (text: string) =>
      [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(UI_MESSAGES.fr) as Array<keyof typeof UI_MESSAGES.fr>) {
      expect(placeholders(UI_MESSAGES.en[key]), key).toEqual(placeholders(UI_MESSAGES.fr[key]))
    }
  })

  it('fall back to the historical French texts without a translator', () => {
    const t = createUiText()
    expect(t('jsonformsBuilder.array.add')).toBe('Ajouter')
    expect(t('jsonformsBuilder.array.item', { index: 2 })).toBe('Élément 2')
  })

  it('follow createJsonFormsTranslator when the host gives a locale', () => {
    const english = createUiText(createJsonFormsTranslator({ locale: 'en-GB' }))
    expect(english('jsonformsBuilder.array.add')).toBe('Add')
    expect(english('jsonformsBuilder.array.removeTitle', { label: 'Item 1' })).toBe(
      'Remove Item 1?',
    )
    expect(
      createUiText(createJsonFormsTranslator({ locale: 'fr' }))('jsonformsBuilder.array.add'),
    ).toBe('Ajouter')
  })

  it('keep French texts for a translator created without locale, as before', () => {
    expect(createUiText(createJsonFormsTranslator())('jsonformsBuilder.array.add')).toBe('Ajouter')
  })

  it('let the host override a single text through its messages', () => {
    const t = createUiText(
      createJsonFormsTranslator({
        locale: 'en',
        messages: { jsonformsBuilder: { array: { add: 'New row' } } },
      }),
    )
    expect(t('jsonformsBuilder.array.add')).toBe('New row')
    expect(t('jsonformsBuilder.array.empty')).toBe('No items.')
  })

  it('resolve locales and placeholders', () => {
    expect(getUiTranslations('fr_CA')['jsonformsBuilder.array.add']).toBe('Ajouter')
    expect(getUiTranslations('de')['jsonformsBuilder.array.add']).toBe('Add')
    expect(formatUiMessage('{{a}} and {{missing}}', { a: 1 })).toBe('1 and {{missing}}')
  })
})

describe('core helpers in English', () => {
  const english = createUiText(createJsonFormsTranslator({ locale: 'en' }))

  it('label array items and file sizes', async () => {
    const { resolveArrayItemLabel } = await import('../../src/composables/useArrayControl')
    const { formatFileSize } = await import('../../src/composables/useFileUploadControl')
    expect(resolveArrayItemLabel(undefined, 0)).toBe('Élément 1')
    expect(resolveArrayItemLabel(undefined, 0, undefined, english)).toBe('Item 1')
    expect(formatFileSize(2048)).toBe('2.0 ko')
    expect(formatFileSize(2048, english)).toBe('2.0 kB')
  })
})
