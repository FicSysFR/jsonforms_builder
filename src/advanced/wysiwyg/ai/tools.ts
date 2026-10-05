import type { Editor } from '@tiptap/core'
import { findWysiwygTextRanges } from '../search'
import type { WysiwygAiOperation } from './types'

/**
 * Editor tools for a future AI SDK agent. Shapes mirror AI SDK `tool()`
 * (`description`, JSON Schema `inputSchema`, `execute`) without depending on `ai`:
 * wrap `inputSchema` with `jsonSchema()` when registering them client-side
 * (e.g. `useChat({ onToolCall })`).
 *
 * - `read` tools only inspect the editor and may run automatically.
 * - `propose` tools never mutate: they return a `WysiwygAiOperation` the user must
 *   approve before it is applied (see `applyWysiwygAiOperation`).
 */
export type WysiwygEditorToolKind = 'read' | 'propose'

export type WysiwygEditorTool<Input = Record<string, unknown>, Output = unknown> = {
  kind: WysiwygEditorToolKind
  description: string
  inputSchema: Record<string, unknown>
  execute: (input: Input) => Output
}

const MAX_TOOL_TEXT = 20000

const emptySchema = { type: 'object', properties: {}, additionalProperties: false }

const contentSchema = {
  type: 'object',
  properties: { content: { type: 'string', description: 'Plain text content.' } },
  required: ['content'],
  additionalProperties: false,
}

const text = (editor: Editor, from: number, to: number) =>
  editor.state.doc.textBetween(from, to, '\n\n', ' ').slice(0, MAX_TOOL_TEXT)

export const createWysiwygEditorTools = (editor: Editor) => {
  const getSelection: WysiwygEditorTool<
    Record<string, never>,
    { from: number; to: number; text: string }
  > = {
    kind: 'read',
    description: 'Get the current selection range and its text.',
    inputSchema: emptySchema,
    execute: () => {
      const { from, to } = editor.state.selection
      return { from, to, text: text(editor, from, to) }
    },
  }

  const getDocumentText: WysiwygEditorTool<Record<string, never>, { text: string }> = {
    kind: 'read',
    description: 'Get the document as plain text.',
    inputSchema: emptySchema,
    execute: () => ({ text: text(editor, 0, editor.state.doc.content.size) }),
  }

  const getCurrentBlock: WysiwygEditorTool<
    Record<string, never>,
    { type: string; text: string }
  > = {
    kind: 'read',
    description: 'Get the block containing the cursor.',
    inputSchema: emptySchema,
    execute: () => {
      const parent = editor.state.selection.$from.parent
      return { type: parent.type.name, text: parent.textContent.slice(0, MAX_TOOL_TEXT) }
    },
  }

  const getHeadings: WysiwygEditorTool<
    Record<string, never>,
    Array<{ level: number; text: string; pos: number }>
  > = {
    kind: 'read',
    description: 'List the document headings with their level and position.',
    inputSchema: emptySchema,
    execute: () => {
      const headings: Array<{ level: number; text: string; pos: number }> = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({ level: Number(node.attrs.level) || 1, text: node.textContent, pos })
          return false
        }
        return true
      })
      return headings
    },
  }

  const findText: WysiwygEditorTool<
    { query: string; caseSensitive?: boolean },
    Array<{ from: number; to: number }>
  > = {
    kind: 'read',
    description: 'Find every occurrence of a text in the document.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, caseSensitive: { type: 'boolean' } },
      required: ['query'],
      additionalProperties: false,
    },
    execute: ({ query, caseSensitive }) =>
      findWysiwygTextRanges(editor.state.doc, query, caseSensitive === true),
  }

  const proposeReplaceSelection: WysiwygEditorTool<{ content: string }, WysiwygAiOperation> = {
    kind: 'propose',
    description: 'Propose replacing the current selection. Requires user approval.',
    inputSchema: contentSchema,
    execute: ({ content }) => ({ type: 'replaceSelection', content }),
  }

  const proposeInsertContent: WysiwygEditorTool<
    { content: string; at?: number },
    WysiwygAiOperation
  > = {
    kind: 'propose',
    description:
      'Propose inserting content at a position (default: cursor). Requires user approval.',
    inputSchema: {
      type: 'object',
      properties: { content: { type: 'string' }, at: { type: 'integer', minimum: 0 } },
      required: ['content'],
      additionalProperties: false,
    },
    execute: ({ content, at }) =>
      typeof at === 'number'
        ? { type: 'insertContent', at, content }
        : { type: 'insertAtCursor', content },
  }

  const proposeReplaceText: WysiwygEditorTool<
    { from: number; to: number; content: string },
    WysiwygAiOperation
  > = {
    kind: 'propose',
    description: 'Propose replacing a document range (from findText). Requires user approval.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'integer', minimum: 0 },
        to: { type: 'integer', minimum: 0 },
        content: { type: 'string' },
      },
      required: ['from', 'to', 'content'],
      additionalProperties: false,
    },
    execute: ({ from, to, content }) => ({ type: 'replaceText', from, to, content }),
  }

  return {
    getSelection,
    getDocumentText,
    getCurrentBlock,
    getHeadings,
    findText,
    proposeReplaceSelection,
    proposeInsertContent,
    proposeReplaceText,
  }
}
