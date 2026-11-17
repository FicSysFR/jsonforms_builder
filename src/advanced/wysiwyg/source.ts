import type { Editor, JSONContent } from '@tiptap/core'
import { createUiText, type UiText } from '../../i18n/ui'
import type { WysiwygContentType } from '../wysiwygOptions'

export type WysiwygSourceParseResult =
  | { ok: true; content: string | JSONContent }
  | { ok: false; error: string }

export const serializeWysiwygSource = (editor: Editor, contentType: WysiwygContentType): string => {
  if (contentType === 'json') return JSON.stringify(editor.getJSON(), null, 2)
  if (contentType === 'markdown') return editor.getMarkdown()
  return editor.getHTML()
}

/**
 * Validates source-mode input; JSON must be a Tiptap `doc` node, HTML and Markdown pass through.
 * Error messages come from `t`.
 */
export const parseWysiwygSource = (
  source: string,
  contentType: WysiwygContentType,
  t: UiText = createUiText(),
): WysiwygSourceParseResult => {
  if (contentType !== 'json') return { ok: true, content: source }
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    return {
      ok: false,
      error: t('jsonformsBuilder.wysiwyg.source.invalidJson', {
        message: (error as Error).message,
      }),
    }
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    (parsed as JSONContent).type !== 'doc'
  ) {
    return { ok: false, error: t('jsonformsBuilder.wysiwyg.source.notDoc') }
  }
  return { ok: true, content: parsed as JSONContent }
}
