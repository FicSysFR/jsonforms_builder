import { normalizeWysiwygAiOperations } from './operations'
import type { WysiwygAiResponse, WysiwygAiStreamChunk } from './types'

/** Header set by AI SDK `toUIMessageStreamResponse()` / `createUIMessageStreamResponse()`. */
export const UI_MESSAGE_STREAM_HEADER = 'x-vercel-ai-ui-message-stream'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

async function* readChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      if (text) yield text
    }
    const rest = decoder.decode()
    if (rest) yield rest
  } finally {
    reader.releaseLock()
  }
}

/** Plain text stream — AI SDK `toTextStreamResponse()`. */
export async function* parseTextStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<WysiwygAiStreamChunk> {
  for await (const text of readChunks(body)) {
    yield { type: 'text-delta', delta: text }
  }
}

/** Maps one AI SDK UI message stream part to an editor chunk (other parts are ignored). */
export const uiMessagePartToChunk = (part: unknown): WysiwygAiStreamChunk | undefined => {
  if (!isRecord(part)) return undefined
  if (part.type === 'text-delta') {
    const delta = typeof part.delta === 'string' ? part.delta : part.textDelta
    return typeof delta === 'string' && delta ? { type: 'text-delta', delta } : undefined
  }
  if (part.type === 'error') {
    const errorText = typeof part.errorText === 'string' ? part.errorText : 'Stream error'
    return { type: 'error', errorText }
  }
  // Custom data part, e.g. `writer.write({ type: 'data-operations', data: { operations } })`.
  if (typeof part.type === 'string' && part.type.startsWith('data-') && isRecord(part.data)) {
    const operations = normalizeWysiwygAiOperations(part.data.operations)
    if (!operations.length) return undefined
    const explanation =
      typeof part.data.explanation === 'string' ? part.data.explanation : undefined
    return { type: 'operations', operations, ...(explanation ? { explanation } : {}) }
  }
  return undefined
}

/** Server-sent events — AI SDK `toUIMessageStreamResponse()` (UI message stream v1). */
export async function* parseUiMessageStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<WysiwygAiStreamChunk> {
  let buffer = ''
  let data: string[] = []

  const flush = function* (): Generator<WysiwygAiStreamChunk, boolean> {
    if (!data.length) return false
    const payload = data.join('\n')
    data = []
    if (payload === '[DONE]') return true
    let part: unknown
    try {
      part = JSON.parse(payload)
    } catch {
      return false
    }
    const chunk = uiMessagePartToChunk(part)
    if (chunk) yield chunk
    return false
  }

  for await (const text of readChunks(body)) {
    buffer += text
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, '')
      buffer = buffer.slice(newline + 1)
      if (line === '') {
        if (yield* flush()) return
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).replace(/^ /, ''))
      }
      newline = buffer.indexOf('\n')
    }
  }
  if (buffer.startsWith('data:')) data.push(buffer.slice(5).replace(/^ /, ''))
  yield* flush()
}

/**
 * Normalizes a JSON body: `{ text }`, `{ content }`, `{ operation, content }`
 * (e.g. AI SDK `Output.object()` / `generateObject()`), or `{ operations: [...] }`.
 */
export const parseWysiwygAiJsonResponse = (body: unknown): WysiwygAiResponse => {
  if (typeof body === 'string') return { text: body }
  if (!isRecord(body)) return { text: '' }

  const text =
    typeof body.text === 'string' ? body.text : typeof body.content === 'string' ? body.content : ''
  const explanation = typeof body.explanation === 'string' ? body.explanation : undefined

  let operations = normalizeWysiwygAiOperations(body.operations)
  if (!operations.length && typeof body.operation === 'string') {
    operations = normalizeWysiwygAiOperations([{ ...body, type: body.operation }])
  }

  return {
    text,
    ...(operations.length ? { operations } : {}),
    ...(explanation ? { explanation } : {}),
  }
}

/** Reads a whole streamed body into a single response. */
export const collectWysiwygAiStream = async (
  chunks: AsyncIterable<WysiwygAiStreamChunk>,
): Promise<WysiwygAiResponse> => {
  let text = ''
  const response: WysiwygAiResponse = { text }
  for await (const chunk of chunks) {
    if (typeof chunk === 'string') text += chunk
    else if (chunk.type === 'text-delta') text += chunk.delta
    else if (chunk.type === 'error') throw new Error(chunk.errorText)
    else {
      response.operations = chunk.operations
      if (chunk.explanation) response.explanation = chunk.explanation
    }
  }
  response.text = text
  return response
}
