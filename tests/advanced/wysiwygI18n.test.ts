import { describe, expect, it } from 'vitest'
import { DEFAULT_WYSIWYG_FEATURES } from '../../src/advanced/wysiwyg/features'
import { parseWysiwygSource } from '../../src/advanced/wysiwyg/source'
import { buildWysiwygSlashItems } from '../../src/advanced/wysiwyg/slash/commands'
import {
  WYSIWYG_TABLE_BUBBLE,
  buildWysiwygTableBubble,
  buildWysiwygTextBubble,
} from '../../src/advanced/wysiwyg/toolbar'
import { resolveWysiwygOptions } from '../../src/advanced/wysiwygOptions'
import { DEFAULT_TOOLBAR, buildDefaultWysiwygToolbar } from '../../src/advanced/wysiwygToolbar'
import { createJsonFormsTranslator } from '../../src/i18n/createJsonFormsTranslator'
import { UI_MESSAGES, createUiText, formatUiMessage } from '../../src/i18n/ui'

const english = createUiText(createJsonFormsTranslator({ locale: 'en' }))
const transport = { generate: async () => ({ text: '' }) }

/** Every `label`, `aria-label`, `description` and tooltip text of nested menu items. */
const textsOf = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(textsOf)
  if (!value || typeof value !== 'object') return []
  const item = value as Record<string, unknown>
  const tooltip = item.tooltip as { text?: unknown } | undefined
  const own = [item.label, item['aria-label'], item.description, tooltip?.text]
  return [...own.filter((text): text is string => typeof text === 'string'), ...textsOf(item.items)]
}

/** French texts whose English version differs, headings formatted for levels 1 to 3. */
const frenchOnly = new Set(
  (Object.keys(UI_MESSAGES.fr) as Array<keyof typeof UI_MESSAGES.fr>)
    .filter((key) => key.startsWith('jsonformsBuilder.wysiwyg.'))
    .filter((key) => UI_MESSAGES.fr[key] !== UI_MESSAGES.en[key])
    .flatMap((key) => [1, 2, 3].map((level) => formatUiMessage(UI_MESSAGES.fr[key], { level }))),
)

describe('WYSIWYG interface texts', () => {
  it('keep the French labels by default', () => {
    expect(buildDefaultWysiwygToolbar()).toEqual(DEFAULT_TOOLBAR)
    expect(buildWysiwygTableBubble()).toEqual(WYSIWYG_TABLE_BUBBLE)
    expect(DEFAULT_TOOLBAR[0]?.[0]).toMatchObject({ 'aria-label': 'Annuler' })
  })

  it('label the toolbar, bubbles and slash menu in English with an English translator', () => {
    const resolved = resolveWysiwygOptions(
      { ai: { enabled: true, transport }, features: DEFAULT_WYSIWYG_FEATURES },
      'string',
      english,
    )
    const toolbar = resolved.toolbar as unknown[][]
    expect(toolbar[0]?.[0]).toMatchObject({ 'aria-label': 'Undo', tooltip: { text: 'Undo' } })
    expect(toolbar.flat()).toContainEqual(
      expect.objectContaining({ kind: 'heading', level: 2, 'aria-label': 'Heading 2' }),
    )
    expect(toolbar.at(-1)?.[0]).toMatchObject({ label: 'AI' })

    const texts = [
      ...textsOf(toolbar),
      ...textsOf(
        buildWysiwygTextBubble(
          {
            formatting: true,
            features: resolved.features,
            aiActions: resolved.ai.actions,
            aiLabel: resolved.ai.labels.menu,
          },
          english,
        ),
      ),
      ...textsOf(buildWysiwygTableBubble(english)),
      ...textsOf(
        buildWysiwygSlashItems(
          {
            formatting: true,
            features: resolved.features,
            imagesEnabled: true,
            aiActions: resolved.ai.actions,
          },
          english,
        ),
      ),
    ]
    expect(texts).toEqual(
      expect.arrayContaining(['Bold', 'Text color', 'Yellow', 'Delete table', 'Improve writing']),
    )
    expect(texts.filter((text) => frenchOnly.has(text))).toEqual([])
  })

  it('translate the image upload, AI panel and source mode texts', () => {
    const resolved = resolveWysiwygOptions({ ai: { enabled: true, transport } }, 'string', english)
    expect(resolved.imageUpload).toMatchObject({
      label: 'Add an image',
      description: 'PNG, JPG, GIF or WebP (max. 2 MB)',
    })
    expect(resolved.ai.labels).toMatchObject({ ask: 'Ask AI', retry: 'Try again' })
    expect(resolved.ai.actions.find((action) => action.id === 'summarize')?.label).toBe('Summarize')
    expect(parseWysiwygSource('[]', 'json', english)).toEqual({
      ok: false,
      error: 'The JSON must be a Tiptap node of type "doc".',
    })
  })
})
