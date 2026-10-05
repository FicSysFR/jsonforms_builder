import {
  UI_MESSAGE_STREAM_HEADER,
  collectWysiwygAiStream,
  parseTextStream,
  parseUiMessageStream,
  parseWysiwygAiJsonResponse,
} from './stream'
import type {
  WysiwygAiRequest,
  WysiwygAiStreamChunk,
  WysiwygAiTransport,
  WysiwygAiTransportCallOptions,
} from './types'

export type WysiwygAiHttpTransportOptions = {
  /** Backend route implemented with AI SDK, e.g. `/api/ai/editor`. */
  endpoint: string
  /** Static headers, or a function resolved per request (e.g. CSRF token). Never provider keys. */
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>)
  /** Default: `same-origin`. */
  credentials?: RequestCredentials
  /** Custom `fetch` (tests, SSR, interceptors). Default: `globalThis.fetch`. */
  fetch?: typeof fetch
}

export class WysiwygAiTransportError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'WysiwygAiTransportError'
    this.status = status
  }
}

const MAX_ERROR_LENGTH = 300

type StreamProtocol = 'ui-message' | 'json' | 'text'

const detectProtocol = (response: Response): StreamProtocol => {
  const contentType = response.headers.get('content-type') ?? ''
  if (response.headers.has(UI_MESSAGE_STREAM_HEADER) || contentType.includes('text/event-stream')) {
    return 'ui-message'
  }
  if (contentType.includes('application/json')) return 'json'
  return 'text'
}

const errorMessage = async (response: Response): Promise<string> => {
  let detail = ''
  try {
    const text = (await response.text()).trim()
    try {
      const json = JSON.parse(text) as Record<string, unknown>
      const message = json.message ?? json.statusMessage ?? json.error
      detail = typeof message === 'string' ? message : text
    } catch {
      detail = text
    }
  } catch {
    // Body unreadable: fall back to the status line.
  }
  const base = `AI request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`
  return detail ? `${base}: ${detail.slice(0, MAX_ERROR_LENGTH)}` : base
}

/**
 * Default transport: POSTs the editor request as JSON and understands the responses an
 * AI SDK backend produces:
 * - `result.toUIMessageStreamResponse()` (SSE, `text-delta` / `error` / `data-*` parts);
 * - `result.toTextStreamResponse()` (plain text stream);
 * - JSON `{ text }` / `{ operation, content }` / `{ operations }` (e.g. `generateText`
 *   with `Output.object()`, or `generateObject()`).
 *
 * The body carries `stream: true | false` so one route can serve both calls.
 */
export const createWysiwygAiHttpTransport = (
  options: WysiwygAiHttpTransportOptions,
): WysiwygAiTransport => {
  const post = async (
    request: WysiwygAiRequest,
    stream: boolean,
    call: WysiwygAiTransportCallOptions = {},
  ): Promise<Response> => {
    const fetchImpl = options.fetch ?? globalThis.fetch
    if (typeof fetchImpl !== 'function') {
      throw new WysiwygAiTransportError('fetch is not available', 0)
    }
    const extra = typeof options.headers === 'function' ? await options.headers() : options.headers
    const response = await fetchImpl(options.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: stream ? 'text/event-stream, text/plain, application/json' : 'application/json',
        ...extra,
      },
      credentials: options.credentials ?? 'same-origin',
      body: JSON.stringify({ ...request, stream }),
      signal: call.signal,
    })
    if (!response.ok) {
      throw new WysiwygAiTransportError(await errorMessage(response), response.status)
    }
    return response
  }

  const chunksOf = (response: Response): AsyncIterable<WysiwygAiStreamChunk> => {
    const protocol = detectProtocol(response)
    if (protocol === 'json' || !response.body) {
      return (async function* () {
        const body =
          protocol === 'json' ? ((await response.json()) as unknown) : await response.text()
        const parsed = parseWysiwygAiJsonResponse(body)
        if (parsed.text) yield { type: 'text-delta', delta: parsed.text }
        if (parsed.operations) {
          yield {
            type: 'operations',
            operations: parsed.operations,
            ...(parsed.explanation ? { explanation: parsed.explanation } : {}),
          }
        }
      })()
    }
    return protocol === 'ui-message'
      ? parseUiMessageStream(response.body)
      : parseTextStream(response.body)
  }

  return {
    async generate(request, call) {
      const response = await post(request, false, call)
      if (detectProtocol(response) === 'json') {
        return parseWysiwygAiJsonResponse(await response.json())
      }
      return collectWysiwygAiStream(chunksOf(response))
    },
    async *stream(request, call) {
      const response = await post(request, true, call)
      yield* chunksOf(response)
    },
  }
}
