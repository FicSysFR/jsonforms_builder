import { describe, expect, it, vi } from 'vitest'
import {
  WysiwygAiTransportError,
  createWysiwygAiHttpTransport,
} from '../../src/advanced/wysiwyg/ai/httpTransport'
import {
  collectWysiwygAiStream,
  parseWysiwygAiJsonResponse,
  uiMessagePartToChunk,
} from '../../src/advanced/wysiwyg/ai/stream'
import type { WysiwygAiRequest, WysiwygAiStreamChunk } from '../../src/advanced/wysiwyg/ai/types'

const request: WysiwygAiRequest = {
  action: 'improve',
  mode: 'transform',
  selectedText: 'helo',
  documentText: 'helo world',
  format: 'text',
}

/** Body split at arbitrary byte boundaries, as a network would deliver it. */
const streamOf = (...parts: string[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      controller.close()
    },
  })
}

const collect = async (chunks: AsyncIterable<WysiwygAiStreamChunk>) => {
  const out: WysiwygAiStreamChunk[] = []
  for await (const chunk of chunks) out.push(chunk)
  return out
}

const sse = (...events: unknown[]) =>
  events.map((event) => `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\n\n`)

describe('createWysiwygAiHttpTransport', () => {
  it('posts the editor request as JSON with stream flag, headers and abort signal', async () => {
    const fetch = vi.fn(
      async () => new Response('Hello', { headers: { 'content-type': 'text/plain' } }),
    )
    const controller = new AbortController()
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/api/ai/editor',
      headers: async () => ({ 'x-csrf-token': 'token' }),
      fetch: fetch as unknown as typeof globalThis.fetch,
    })

    await collect(transport.stream!(request, { signal: controller.signal }))

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/ai/editor')
    expect(init.method).toBe('POST')
    expect(init.signal).toBe(controller.signal)
    expect(init.credentials).toBe('same-origin')
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      'x-csrf-token': 'token',
    })
    expect(JSON.parse(String(init.body))).toEqual({ ...request, stream: true })
  })

  it('reads AI SDK text streams (toTextStreamResponse)', async () => {
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () =>
        new Response(streamOf('Hel', 'lo ', 'wörld'), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })) as typeof fetch,
    })
    const chunks = await collect(transport.stream!(request))
    expect(
      chunks.map((c) => (typeof c === 'string' ? c : 'delta' in c ? c.delta : '')).join(''),
    ).toBe('Hello wörld')
  })

  it('reads AI SDK UI message streams split across network chunks', async () => {
    const body = [
      ...sse(
        { type: 'start' },
        { type: 'text-start', id: 't' },
        { type: 'text-delta', id: 't', delta: 'Hello' },
        { type: 'text-delta', id: 't', delta: ', world' },
        { type: 'data-operations', data: { operations: [{ type: 'insertBelow', content: 'x' }] } },
        { type: 'text-end', id: 't' },
        { type: 'finish' },
        '[DONE]',
      ),
    ].join('')
    const middle = Math.floor(body.length / 2)
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () =>
        new Response(streamOf(body.slice(0, 7), body.slice(7, middle), body.slice(middle)), {
          headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
        })) as typeof fetch,
    })

    expect(await collect(transport.stream!(request))).toEqual([
      { type: 'text-delta', delta: 'Hello' },
      { type: 'text-delta', delta: ', world' },
      { type: 'operations', operations: [{ type: 'insertBelow', content: 'x' }] },
    ])
  })

  it('surfaces UI message stream errors', async () => {
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () =>
        new Response(streamOf(...sse({ type: 'error', errorText: 'Quota exceeded' })), {
          headers: { 'content-type': 'text/event-stream' },
        })) as typeof fetch,
    })
    await expect(transport.generate(request)).rejects.toThrow('Quota exceeded')
  })

  it('parses JSON responses for generate() and stream()', async () => {
    const json = () =>
      new Response(
        JSON.stringify({ operation: 'replaceSelection', content: 'hello', explanation: 'Typo.' }),
        { headers: { 'content-type': 'application/json' } },
      )
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () => json()) as typeof fetch,
    })

    expect(await transport.generate(request)).toEqual({
      text: 'hello',
      operations: [{ type: 'replaceSelection', content: 'hello' }],
      explanation: 'Typo.',
    })
    expect(await collectWysiwygAiStream(transport.stream!(request))).toEqual({
      text: 'hello',
      operations: [{ type: 'replaceSelection', content: 'hello' }],
      explanation: 'Typo.',
    })
  })

  it('collects streamed bodies for generate()', async () => {
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () => new Response(streamOf('a', 'b'))) as typeof fetch,
    })
    expect(await transport.generate(request)).toEqual({ text: 'ab' })
  })

  it('throws a typed error with the backend message on HTTP failures', async () => {
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: (async () =>
        new Response(JSON.stringify({ statusMessage: 'Unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
        })) as typeof fetch,
    })
    const error = await transport.generate(request).catch((err: unknown) => err)
    expect(error).toBeInstanceOf(WysiwygAiTransportError)
    expect(error).toMatchObject({ status: 401 })
    expect((error as Error).message).toBe('AI request failed (401 Unauthorized): Unauthorized')
  })

  it('propagates aborts from fetch', async () => {
    const controller = new AbortController()
    const transport = createWysiwygAiHttpTransport({
      endpoint: '/ai',
      fetch: ((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          )
        })) as unknown as typeof fetch,
    })
    const pending = transport.generate(request, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('fails clearly without fetch', async () => {
    const original = globalThis.fetch
    vi.stubGlobal('fetch', undefined)
    try {
      const transport = createWysiwygAiHttpTransport({ endpoint: '/ai' })
      await expect(transport.generate(request)).rejects.toThrow('fetch is not available')
    } finally {
      vi.stubGlobal('fetch', original)
      vi.unstubAllGlobals()
    }
  })
})

describe('AI response normalization', () => {
  it('normalizes JSON shapes and drops malformed operations', () => {
    expect(parseWysiwygAiJsonResponse('plain')).toEqual({ text: 'plain' })
    expect(parseWysiwygAiJsonResponse(null)).toEqual({ text: '' })
    expect(
      parseWysiwygAiJsonResponse({
        content: 'c',
        operations: [
          { type: 'replaceText', from: 2, to: 1, content: 'bad range' },
          { type: 'insertContent', at: -1, content: 'bad pos' },
          { type: 'deleteEverything', content: '' },
          { type: 'insertContent', at: 3, content: 'ok' },
          'junk',
        ],
      }),
    ).toEqual({ text: 'c', operations: [{ type: 'insertContent', at: 3, content: 'ok' }] })
  })

  it('ignores UI message parts the editor does not use', () => {
    expect(uiMessagePartToChunk({ type: 'reasoning-delta', delta: 'thinking' })).toBeUndefined()
    expect(uiMessagePartToChunk({ type: 'text-delta', delta: '' })).toBeUndefined()
    expect(uiMessagePartToChunk({ type: 'text-delta', textDelta: 'legacy' })).toEqual({
      type: 'text-delta',
      delta: 'legacy',
    })
    expect(uiMessagePartToChunk({ type: 'error' })).toEqual({
      type: 'error',
      errorText: 'Stream error',
    })
    expect(uiMessagePartToChunk({ type: 'data-other', data: { foo: 1 } })).toBeUndefined()
    expect(uiMessagePartToChunk('nope')).toBeUndefined()
  })
})
