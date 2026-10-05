import type { Editor, JSONContent } from '@tiptap/core'

export type WysiwygSourceParseResult =
  | { ok: true; content: string | JSONContent }
  | { ok: false; error: string }

export const serializeWysiwygSource = (editor: Editor, contentType: 'html' | 'json'): string =>
  contentType === 'json' ? JSON.stringify(editor.getJSON(), null, 2) : editor.getHTML()

/** Validates source-mode input; JSON must be a Tiptap `doc` node. */
export const parseWysiwygSource = (
  source: string,
  contentType: 'html' | 'json',
): WysiwygSourceParseResult => {
  if (contentType === 'html') return { ok: true, content: source }
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
