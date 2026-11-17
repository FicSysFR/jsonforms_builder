import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { FormImportError, parseFormImport } from '../../src/builder/importForm'
import {
  createPaletteContainers,
  createPaletteFields,
  PALETTE_FIELDS,
  paletteGroupLabel,
} from '../../src/builder/palette'
import { useFormBuilder } from '../../src/builder/useFormBuilder'
import { createJsonFormsTranslator } from '../../src/i18n/createJsonFormsTranslator'
import { createUiText } from '../../src/i18n/ui'

const english = createUiText(createJsonFormsTranslator({ locale: 'en' }))

describe('builder interface texts', () => {
  it('label the palette in English with an English resolver', () => {
    const fields = createPaletteFields(english)
    const text = fields.find((field) => field.key === 'text')

    expect(text?.label).toBe('Text')
    expect(text?.group).toBe('Saisie')
    expect(paletteGroupLabel('Saisie', english)).toBe('Input')
    expect(fields.find((field) => field.key === 'date-range')?.schema()).toMatchObject({
      properties: { start: { title: 'Start' }, end: { title: 'End' } },
    })

    const tabs = createPaletteContainers(english).find((c) => c.key === 'Categorization')
    expect(tabs?.label).toBe('Tabs')
    expect(tabs?.create()).toMatchObject({
      elements: [{ label: 'Tab 1' }, { label: 'Tab 2' }],
    })
  })

  it('keep the French palette by default', () => {
    expect(createPaletteFields().map((field) => field.label)).toEqual(
      PALETTE_FIELDS.map((field) => field.label),
    )
    expect(paletteGroupLabel('Date & heure')).toBe('Date & heure')
  })

  it('name new fields and import errors with the given resolver', () => {
    const scope = effectScope()
    const api = scope.run(() => useFormBuilder(undefined, english))!

    api.addField('text', [], 0)
    expect(api.definition.value.schema.properties?.text).toMatchObject({ title: 'Text' })
    scope.stop()

    expect(() => parseFormImport('[]', english)).toThrow(
      new FormImportError('The document must be a JSON object.'),
    )
  })
})
