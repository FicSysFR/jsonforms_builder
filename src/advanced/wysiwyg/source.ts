import type { Editor, JSONContent } from '@tiptap/core'
import type { WysiwygContentType } from '../wysiwygOptions'

export type WysiwygSourceParseResult =
  | { ok: true; content: string | JSONContent }
  | { ok: false; error: string }

export const serializeWysiwygSource = (editor: Editor, contentType: WysiwygContentType): string => {
  if (contentType === 'json') return JSON.stringify(editor.getJSON(), null, 2)
  if (contentType === 'markdown') return editor.getMarkdown()
  return editor.getHTML()
}

/** Validates source-mode input; JSON must be a Tiptap `doc` node, HTML and Markdown pass through. */
export const parseWysiwygSource = (
  source: string,
  contentType: WysiwygContentType,
): WysiwygSourceParseResult => {
  if (contentType !== 'json') return { ok: true, content: source }
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    return { ok: false, error: `JSON invalide : ${(error as Error).message}` }
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    (parsed as JSONContent).type !== 'doc'
  ) {
    return { ok: false, error: 'Le JSON doit être un nœud Tiptap de type « doc ».' }
  }
  return { ok: true, content: parsed as JSONContent }
}
