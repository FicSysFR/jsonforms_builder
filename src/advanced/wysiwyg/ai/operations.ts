import type { Editor, JSONContent } from '@tiptap/core'
import type { WysiwygAiTarget } from './context'
import { sanitizeWysiwygAiHtml } from './sanitize'
import type { WysiwygAiOperation, WysiwygAiOutputFormat } from './types'

const OPERATION_TYPES = new Set<WysiwygAiOperation['type']>([
  'replaceSelection',
  'insertBelow',
  'insertAtCursor',
  'replaceText',
  'insertContent',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isPos = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

/** Keeps only well-formed operations; anything else from the backend is dropped. */
export const normalizeWysiwygAiOperations = (input: unknown): WysiwygAiOperation[] => {
  if (!Array.isArray(input)) return []
  const out: WysiwygAiOperation[] = []
  for (const raw of input) {
    if (!isRecord(raw) || typeof raw.content !== 'string') continue
    const type = raw.type as WysiwygAiOperation['type']
    if (!OPERATION_TYPES.has(type)) continue
    if (type === 'replaceText') {
      if (!isPos(raw.from) || !isPos(raw.to) || raw.to < raw.from) continue
      out.push({ type, from: raw.from, to: raw.to, content: raw.content })
    } else if (type === 'insertContent') {
      if (!isPos(raw.at)) continue
      out.push({ type, at: raw.at, content: raw.content })
    } else {
      out.push({ type, content: raw.content })
    }
  }
  return out
}

const inlineFromLine = (text: string): JSONContent[] => {
  const nodes: JSONContent[] = []
  text.split('\n').forEach((line, index) => {
    if (index > 0) nodes.push({ type: 'hardBreak' })
    if (line) nodes.push({ type: 'text', text: line })
  })
  return nodes
}

/**
 * Plain text → paragraphs (blank lines) with hard breaks (single newlines).
 * Text nodes are never parsed as markup, so model output cannot inject HTML.
 */
export const textToWysiwygParagraphs = (text: string): JSONContent[] =>
  text
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({ type: 'paragraph', content: inlineFromLine(paragraph) }))

/** Single-paragraph text inserted inline keeps its edge spaces (“ continued…”). */
const inlineText = (text: string): JSONContent[] | null => {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '')
  if (!normalized.trim() || /\n{2,}/.test(normalized)) return null
  return inlineFromLine(normalized)
}

type InsertMode = 'inline' | 'block'

const toInsertable = (
  content: string,
  format: WysiwygAiOutputFormat,
  mode: InsertMode,
): JSONContent[] | string | null => {
  if (format === 'html') {
    const html = sanitizeWysiwygAiHtml(content).trim()
    if (!html) return null
    return mode === 'block' && !/^<(p|h[1-6]|ul|ol|pre|blockquote|table|hr)\b/i.test(html)
      ? `<p>${html}</p>`
      : html
  }
  if (mode === 'inline') {
    const inline = inlineText(content)
    if (inline) return inline
  }
  const paragraphs = textToWysiwygParagraphs(content)
  return paragraphs.length ? paragraphs : null
}

/** Resolves the document range an operation writes to, or `null` when it is invalid. */
const resolveRange = (
  editor: Editor,
  operation: WysiwygAiOperation,
  target: WysiwygAiTarget,
): { from: number; to: number; mode: InsertMode } | null => {
  const size = editor.state.doc.content.size
  switch (operation.type) {
    case 'replaceSelection':
      return { from: target.from, to: target.to, mode: 'inline' }
    case 'insertAtCursor':
      return { from: target.to, to: target.to, mode: 'inline' }
    case 'insertBelow':
      return { from: target.blockEnd, to: target.blockEnd, mode: 'block' }
    case 'replaceText':
      return operation.to <= size ? { ...operation, mode: 'inline' } : null
    case 'insertContent':
      return operation.at <= size ? { from: operation.at, to: operation.at, mode: 'inline' } : null
  }
}

/**
 * Applies one approved operation as a single Tiptap transaction (one undo step).
 * Returns `false` when the operation is out of range or has no content.
 */
export const applyWysiwygAiOperation = (
  editor: Editor,
  operation: WysiwygAiOperation,
  target: WysiwygAiTarget,
  format: WysiwygAiOutputFormat = 'text',
): boolean => {
  if (editor.isDestroyed || !editor.isEditable) return false
  const range = resolveRange(editor, operation, target)
  if (!range) return false

  let { from, to } = range
  const insertable = toInsertable(operation.content, format, range.mode)
  if (insertable == null) return false

  // Several paragraphs replacing a whole block: swap the block node itself instead of
  // splitting paragraphs inside it.
  if (
    target.kind === 'block' &&
    operation.type === 'replaceSelection' &&
    Array.isArray(insertable) &&
    insertable.every((node) => node.type === 'paragraph')
  ) {
    from -= 1
    to += 1
  }

  return editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, insertable, { updateSelection: true })
    .run()
}
