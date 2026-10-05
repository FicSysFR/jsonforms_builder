import { DEFAULT_WYSIWYG_AI_LABELS, resolveWysiwygAiActions } from './actions'
import { DEFAULT_AI_MAX_CONTEXT_CHARACTERS } from './context'
import { createWysiwygAiHttpTransport } from './httpTransport'
import type {
  WysiwygAiAction,
  WysiwygAiLabels,
  WysiwygAiOptions,
  WysiwygAiOutputFormat,
  WysiwygAiTransport,
} from './types'

export type ResolvedWysiwygAiOptions = {
  /** `true` only when `enabled: true` and a transport (or endpoint) is configured. */
  enabled: boolean
  transport: WysiwygAiTransport | null
  actions: WysiwygAiAction[]
  bubbleMenu: boolean
  slashCommands: boolean
  stream: boolean
  maxContextCharacters: number
  includeHtml: boolean
  includeJson: boolean
  format: WysiwygAiOutputFormat
  metadata?: Record<string, unknown>
  labels: WysiwygAiLabels
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isTransport = (value: unknown): value is WysiwygAiTransport =>
  isRecord(value) && typeof value.generate === 'function'

export const DISABLED_WYSIWYG_AI: ResolvedWysiwygAiOptions = Object.freeze({
  enabled: false,
  transport: null,
  actions: [],
  bubbleMenu: false,
  slashCommands: false,
  stream: false,
  maxContextCharacters: DEFAULT_AI_MAX_CONTEXT_CHARACTERS,
  includeHtml: false,
  includeJson: false,
  format: 'text',
  labels: DEFAULT_WYSIWYG_AI_LABELS,
}) as ResolvedWysiwygAiOptions

/**
 * Resolves `options.ai`. Anything but an object with `enabled: true` and a usable
 * transport/endpoint yields the inert `DISABLED_WYSIWYG_AI` (no transport is created).
 */
export const resolveWysiwygAiOptions = (raw: unknown): ResolvedWysiwygAiOptions => {
  if (!isRecord(raw) || raw.enabled !== true) return DISABLED_WYSIWYG_AI
  const opts = raw as WysiwygAiOptions

  const transport = isTransport(opts.transport)
    ? opts.transport
    : typeof opts.endpoint === 'string' && opts.endpoint
      ? createWysiwygAiHttpTransport({ endpoint: opts.endpoint, headers: opts.headers })
      : null
  if (!transport) return DISABLED_WYSIWYG_AI

  return {
    enabled: true,
    transport,
    actions: resolveWysiwygAiActions(opts.actions),
    bubbleMenu: opts.bubbleMenu !== false,
    slashCommands: opts.slashCommands !== false,
    stream: opts.stream !== false,
    maxContextCharacters:
      typeof opts.maxContextCharacters === 'number' && opts.maxContextCharacters >= 0
        ? opts.maxContextCharacters
        : DEFAULT_AI_MAX_CONTEXT_CHARACTERS,
    includeHtml: opts.includeHtml === true,
    includeJson: opts.includeJson === true,
    format: opts.format === 'html' ? 'html' : 'text',
    ...(isRecord(opts.body) ? { metadata: opts.body } : {}),
    labels: { ...DEFAULT_WYSIWYG_AI_LABELS, ...(isRecord(opts.labels) ? opts.labels : {}) },
  }
}
