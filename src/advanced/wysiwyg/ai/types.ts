import type { JSONContent } from '@tiptap/core'

/**
 * How an AI action relates to the document:
 * - `transform` rewrites a target (the selection, or the current block when nothing is selected);
 * - `generate` produces new content inserted at the cursor.
 */
export type WysiwygAiActionMode = 'transform' | 'generate'

/** `auto` resolves to `transform` with a selection and `generate` without. */
export type WysiwygAiActionModeInput = WysiwygAiActionMode | 'auto'

export type WysiwygAiAction = {
  /** Stable identifier sent to the backend as `request.action`. */
  id: string
  label: string
  icon?: string
  description?: string
  /** Provider-agnostic instruction forwarded to the backend. */
  instruction?: string
  /** Default: `transform`. */
  mode?: WysiwygAiActionModeInput
  /** Ask the user for a free-form instruction before running (e.g. “Ask AI”). */
  promptForInstruction?: boolean
}

/** A default action id (`'improve'`, …) or a custom action. */
export type WysiwygAiActionInput = string | WysiwygAiAction

/** Format the editor expects back from the backend. */
export type WysiwygAiOutputFormat = 'text' | 'html'

export type WysiwygAiSelection = {
  from: number
  to: number
}

/**
 * Payload sent to the consumer backend. It deliberately carries editor context only —
 * no provider, model or AI SDK message format.
 */
export type WysiwygAiRequest = {
  action: string
  instruction?: string
  mode: WysiwygAiActionMode
  /** Range the result applies to (the selection or the current block). */
  selection?: WysiwygAiSelection
  /** Text the action operates on (selection, or current block when nothing is selected). */
  selectedText?: string
  /** Text of the block containing the cursor. */
  currentBlock?: string
  textBeforeSelection?: string
  textAfterSelection?: string
  /** Plain-text document, truncated to `maxContextCharacters`. */
  documentText: string
  /** `true` when any context field above was truncated. */
  truncated?: boolean
  /** Only sent when `ai.includeHtml` is enabled. */
  html?: string
  /** Only sent when `ai.includeJson` is enabled. */
  json?: JSONContent
  format: WysiwygAiOutputFormat
  /** Extra consumer data (`ai.body`), forwarded verbatim. */
  metadata?: Record<string, unknown>
}

/**
 * A proposed document edit. Operations are only ever applied after explicit user
 * approval — they are the contract a future AI SDK agent (tools) can target.
 */
export type WysiwygAiOperation =
  | { type: 'replaceSelection'; content: string }
  | { type: 'insertBelow'; content: string }
  | { type: 'insertAtCursor'; content: string }
  | { type: 'replaceText'; from: number; to: number; content: string }
  | { type: 'insertContent'; at: number; content: string }

export type WysiwygAiResponse = {
  text: string
  /** Structured edits (e.g. from AI SDK `Output.object()` / `generateObject()`). */
  operations?: WysiwygAiOperation[]
  explanation?: string
}

/** Chunk yielded by `transport.stream()`. A bare string is a text delta. */
export type WysiwygAiStreamChunk =
  | string
  | { type: 'text-delta'; delta: string }
  | { type: 'operations'; operations: WysiwygAiOperation[]; explanation?: string }
  | { type: 'error'; errorText: string }

export type WysiwygAiTransportCallOptions = {
  signal?: AbortSignal
}

/**
 * How AI requests reach the consumer's AI SDK backend. The library never talks to
 * a provider and never holds API keys.
 */
export interface WysiwygAiTransport {
  generate(
    request: WysiwygAiRequest,
    options?: WysiwygAiTransportCallOptions,
  ): Promise<WysiwygAiResponse>
  stream?(
    request: WysiwygAiRequest,
    options?: WysiwygAiTransportCallOptions,
  ): AsyncIterable<WysiwygAiStreamChunk>
}

/** UI strings of the AI menu and result panel (French by default). */
export type WysiwygAiLabels = {
  menu: string
  ask: string
  instructionPlaceholder: string
  submit: string
  generating: string
  done: string
  error: string
  replaceSelection: string
  replaceBlock: string
  insert: string
  insertBelow: string
  apply: string
  retry: string
  stop: string
  discard: string
  empty: string
}

/** `options.ai` of the WYSIWYG renderer. Nothing AI-related runs unless `enabled: true`. */
export type WysiwygAiOptions = {
  enabled?: boolean
  /** Backend endpoint consumed by the default HTTP transport. */
  endpoint?: string
  /** Custom transport; takes precedence over `endpoint`. */
  transport?: WysiwygAiTransport
  /** Default ids and/or custom actions. Default: `DEFAULT_WYSIWYG_AI_ACTIONS`. */
  actions?: WysiwygAiActionInput[]
  /** AI entry in the text bubble menu. Default: `true`. */
  bubbleMenu?: boolean
  /** AI entries in the `/` palette. Default: `true`. */
  slashCommands?: boolean
  /** Prefer `transport.stream()` when available. Default: `true`. */
  stream?: boolean
  /** Budget for document context (before/after/document text). Default: `12000`. */
  maxContextCharacters?: number
  /** Send the document HTML. Default: `false`. */
  includeHtml?: boolean
  /** Send the document Tiptap JSON. Default: `false`. */
  includeJson?: boolean
  /** Expected output format. `html` is sanitized before insertion. Default: `text`. */
  format?: WysiwygAiOutputFormat
  /** Extra headers for the default HTTP transport (no provider secrets!). */
  headers?: Record<string, string>
  /** Extra data merged into `request.metadata`. */
  body?: Record<string, unknown>
  labels?: Partial<WysiwygAiLabels>
}
