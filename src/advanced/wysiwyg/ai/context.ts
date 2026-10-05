import type { Editor } from '@tiptap/core'
import type {
  WysiwygAiAction,
  WysiwygAiActionMode,
  WysiwygAiOutputFormat,
  WysiwygAiRequest,
} from './types'

export const DEFAULT_AI_MAX_CONTEXT_CHARACTERS = 12000

const BLOCK_SEPARATOR = '\n\n'
const LEAF_TEXT = ' '

/** Where an AI result lands once the user accepts it. */
export type WysiwygAiTarget = {
  mode: WysiwygAiActionMode
  /** `selection`: non-empty selection; `block`: current block; `cursor`: insertion point. */
  kind: 'selection' | 'block' | 'cursor'
  from: number
  to: number
  /** Text the action operates on (empty for `cursor`). */
  text: string
  /** Position right after the top-level block containing `to`. */
  blockEnd: number
}

export type BuildWysiwygAiRequestOptions = {
  instruction?: string
  maxContextCharacters?: number
  includeHtml?: boolean
  includeJson?: boolean
  format?: WysiwygAiOutputFormat
  metadata?: Record<string, unknown>
}

const head = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text)
const tail = (text: string, max: number) =>
  text.length > max ? text.slice(text.length - max) : text

const topLevelBlockEnd = (editor: Editor, pos: number): number => {
  const { doc } = editor.state
  const $pos = doc.resolve(Math.min(pos, doc.content.size))
  return $pos.depth >= 1 ? $pos.after(1) : doc.content.size
}

/**
 * Resolves what an action operates on from the current selection:
 * the selection itself, else the current (non-empty) text block for `transform`
 * actions, else the cursor for `generate` actions.
 */
export const resolveWysiwygAiTarget = (
  editor: Editor,
  action: Pick<WysiwygAiAction, 'mode'>,
): WysiwygAiTarget => {
  const { doc, selection } = editor.state
  const requested = action.mode ?? 'transform'

  if (!selection.empty && requested !== 'generate') {
    const { from, to } = selection
    return {
      mode: 'transform',
      kind: 'selection',
      from,
      to,
      text: doc.textBetween(from, to, BLOCK_SEPARATOR, LEAF_TEXT),
      blockEnd: topLevelBlockEnd(editor, to),
    }
  }

  const { $from } = selection
  const parent = $from.parent
  if (requested === 'transform' && parent.isTextblock && parent.textContent.trim()) {
    const from = $from.start()
    const to = $from.end()
    return {
      mode: 'transform',
      kind: 'block',
      from,
      to,
      text: parent.textContent,
      blockEnd: topLevelBlockEnd(editor, to),
    }
  }

  const pos = selection.to
  return {
    mode: 'generate',
    kind: 'cursor',
    from: pos,
    to: pos,
    text: '',
    blockEnd: topLevelBlockEnd(editor, pos),
  }
}

/**
 * Builds the backend payload. Document context is bounded by `maxContextCharacters`;
 * HTML / JSON are only attached when explicitly requested.
 */
export const buildWysiwygAiRequest = (
  editor: Editor,
  action: WysiwygAiAction,
  target: WysiwygAiTarget,
  options: BuildWysiwygAiRequestOptions = {},
): WysiwygAiRequest => {
  const { doc, selection } = editor.state
  const max =
    typeof options.maxContextCharacters === 'number' && options.maxContextCharacters >= 0
      ? Math.floor(options.maxContextCharacters)
      : DEFAULT_AI_MAX_CONTEXT_CHARACTERS
  const half = Math.floor(max / 2)
  const size = doc.content.size

  const fullText = doc.textBetween(0, size, BLOCK_SEPARATOR, LEAF_TEXT)
  const before = doc.textBetween(0, target.from, BLOCK_SEPARATOR, LEAF_TEXT)
  const after = doc.textBetween(target.to, size, BLOCK_SEPARATOR, LEAF_TEXT)
  const block = selection.$from.parent.textContent

  const truncated =
    fullText.length > max || before.length > half || after.length > half || block.length > max

  const instruction = [action.instruction, options.instruction?.trim()]
    .filter((part): part is string => !!part)
    .join('\n\n')

  const request: WysiwygAiRequest = {
    action: action.id,
    mode: target.mode,
    selection: { from: target.from, to: target.to },
    documentText: head(fullText, max),
    currentBlock: head(block, max),
    textBeforeSelection: tail(before, half),
    textAfterSelection: head(after, half),
    format: options.format ?? 'text',
  }
  if (instruction) request.instruction = instruction
  if (target.text) request.selectedText = target.text
  if (truncated) request.truncated = true
  if (options.includeHtml) request.html = editor.getHTML()
  if (options.includeJson) request.json = editor.getJSON()
  if (options.metadata && Object.keys(options.metadata).length) {
    request.metadata = { ...options.metadata }
  }
  return request
}
