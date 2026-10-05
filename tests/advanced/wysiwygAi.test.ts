// @vitest-environment jsdom

import type { Editor } from '@tiptap/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { DEFAULT_WYSIWYG_AI_ACTIONS } from '../../src/advanced/wysiwyg/ai/actions'
import {
  buildWysiwygAiRequest,
  resolveWysiwygAiTarget,
} from '../../src/advanced/wysiwyg/ai/context'
import { resolveWysiwygAiOptions } from '../../src/advanced/wysiwyg/ai/options'
import type {
  WysiwygAiAction,
  WysiwygAiRequest,
  WysiwygAiStreamChunk,
  WysiwygAiTransport,
} from '../../src/advanced/wysiwyg/ai/types'
import { useWysiwygAi } from '../../src/advanced/wysiwyg/ai/useWysiwygAi'
import { createTestEditor, posOf, selectText } from './wysiwygEditorHarness'

const action = (id: string): WysiwygAiAction => {
  const found = DEFAULT_WYSIWYG_AI_ACTIONS.find((a) => a.id === id)
  if (!found) throw new Error(id)
  return found
}

/** Stream whose chunks are released one by one by the test. */
const controllableStream = () => {
  const queue: Array<WysiwygAiStreamChunk | Error | null> = []
  let wake: (() => void) | null = null
  const push = (item: WysiwygAiStreamChunk | Error | null) => {
    queue.push(item)
    wake?.()
  }
  async function* iterate(signal?: AbortSignal): AsyncGenerator<WysiwygAiStreamChunk> {
    while (true) {
      if (!queue.length) await new Promise<void>((resolve) => (wake = resolve))
      wake = null
      if (signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' })
      const item = queue.shift()
      if (item === null || item === undefined) return
      if (item instanceof Error) throw item
      yield item
    }
  }
  return { push, iterate }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

let editor: Editor

beforeEach(() => {
  editor = createTestEditor('<p>Hello brave world.</p><p>Second paragraph.</p>')
})

afterEach(() => {
  editor.destroy()
  document.body.innerHTML = ''
})

const setup = (transport: WysiwygAiTransport, extra: Record<string, unknown> = {}) => {
  const options = ref(resolveWysiwygAiOptions({ enabled: true, transport, ...extra }))
  return useWysiwygAi({ getEditor: () => editor, options })
}

describe('AI request context', () => {
  it('targets the selected text and bounds document context', () => {
    selectText(editor, 'brave')
    const target = resolveWysiwygAiTarget(editor, action('improve'))
    const request = buildWysiwygAiRequest(editor, action('improve'), target, {
      maxContextCharacters: 10,
    })

    expect(target).toMatchObject({ mode: 'transform', kind: 'selection', text: 'brave' })
    expect(request).toMatchObject({
      action: 'improve',
      mode: 'transform',
      selectedText: 'brave',
      selection: { from: target.from, to: target.to },
      instruction: 'Improve the selected text while preserving its meaning.',
      currentBlock: 'Hello brav',
      textBeforeSelection: 'ello ',
      textAfterSelection: ' worl',
      documentText: 'Hello brav',
      truncated: true,
      format: 'text',
    })
    expect(request.html).toBeUndefined()
    expect(request.json).toBeUndefined()
  })

  it('falls back to the current block, then to the cursor, when nothing is selected', () => {
    editor.commands.setTextSelection(posOf(editor, 'world'))
    const block = resolveWysiwygAiTarget(editor, action('shorter'))
    expect(block).toMatchObject({ kind: 'block', mode: 'transform', text: 'Hello brave world.' })

    const generate = resolveWysiwygAiTarget(editor, action('continue'))
    expect(generate).toMatchObject({ kind: 'cursor', mode: 'generate', text: '' })

    const auto = resolveWysiwygAiTarget(editor, action('ask'))
    expect(auto.mode).toBe('generate')

    editor.commands.setContent('<p></p>')
    expect(resolveWysiwygAiTarget(editor, action('improve')).kind).toBe('cursor')
  })

  it('appends the user instruction and attaches HTML / JSON / metadata only on request', () => {
    selectText(editor, 'world')
    const target = resolveWysiwygAiTarget(editor, action('translate'))
    const request = buildWysiwygAiRequest(editor, action('translate'), target, {
      instruction: '  Spanish ',
      includeHtml: true,
      includeJson: true,
      format: 'html',
      metadata: { locale: 'fr' },
    })
    expect(request.instruction).toMatch(/\n\nSpanish$/)
    expect(request.html).toContain('<p>Hello brave world.</p>')
    expect(request.json?.type).toBe('doc')
    expect(request.metadata).toEqual({ locale: 'fr' })
    expect(request.format).toBe('html')
    expect(request.truncated).toBeUndefined()
  })
})

describe('useWysiwygAi', () => {
  it('streams into the preview without touching the document until accepted', async () => {
    const stream = controllableStream()
    const requests: WysiwygAiRequest[] = []
    const transport: WysiwygAiTransport = {
      generate: vi.fn(),
      stream: (request, options) => {
        requests.push(request)
        return stream.iterate(options?.signal)
      },
    }
    const ai = setup(transport)
    const before = editor.getHTML()
    selectText(editor, 'brave')

    const done = ai.start(action('improve'))
    expect(ai.status.value).toBe('generating')
    expect(ai.isGenerating.value).toBe(true)

    stream.push({ type: 'text-delta', delta: 'cour' })
    stream.push('ageous')
    await flush()
    expect(ai.result.value).toBe('courageous')
    expect(editor.getHTML()).toBe(before)

    stream.push(null)
    await done
    expect(ai.status.value).toBe('done')
    expect(requests[0]).toMatchObject({ action: 'improve', selectedText: 'brave' })
    expect(transport.generate).not.toHaveBeenCalled()
    expect(editor.getHTML()).toBe(before)

    expect(ai.accept('replace')).toBe(true)
    expect(editor.getHTML()).toBe('<p>Hello courageous world.</p><p>Second paragraph.</p>')
    expect(ai.status.value).toBe('idle')
  })

  it('aborts the transport signal on cancel and keeps the partial result', async () => {
    const stream = controllableStream()
    let signal: AbortSignal | undefined
    const ai = setup({
      generate: vi.fn(),
      stream: (_request, options) => {
        signal = options?.signal
        return stream.iterate(options?.signal)
      },
    })
    selectText(editor, 'brave')
    const done = ai.start(action('improve'))
    stream.push('partial')
    await flush()

    ai.cancel()
    expect(signal?.aborted).toBe(true)
    expect(ai.status.value).toBe('stopped')
    stream.push(' ignored')
    await done
    expect(ai.result.value).toBe('partial')
    expect(ai.accept('insertBelow')).toBe(true)
    expect(editor.getHTML()).toBe('<p>Hello brave world.</p><p>partial</p><p>Second paragraph.</p>')
  })

  it('reports transport errors and retries the same request', async () => {
    const generate = vi
      .fn()
      .mockRejectedValueOnce(new Error('Backend unavailable'))
      .mockResolvedValueOnce({ text: 'Fixed.' })
    const ai = setup({ generate })
    selectText(editor, 'brave')

    await ai.start(action('fixGrammar'))
    expect(ai.status.value).toBe('error')
    expect(ai.error.value).toBe('Backend unavailable')
    expect(ai.accept('replace')).toBe(false)

    await ai.retry()
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate.mock.calls[1]?.[0]).toBe(generate.mock.calls[0]?.[0])
    expect(ai.status.value).toBe('done')
    expect(ai.result.value).toBe('Fixed.')
    expect(ai.error.value).toBeNull()
  })

  it('turns stream error chunks into an error state', async () => {
    const ai = setup({
      generate: vi.fn(),
      async *stream() {
        yield 'half'
        yield { type: 'error', errorText: 'Rate limited' }
      },
    })
    selectText(editor, 'brave')
    await ai.start(action('improve'))
    expect(ai.status.value).toBe('error')
    expect(ai.error.value).toBe('Rate limited')
  })

  it('uses generate() when streaming is disabled and inserts at the cursor', async () => {
    const generate = vi.fn().mockResolvedValue({ text: ' Continued text' })
    const stream = vi.fn()
    const ai = setup({ generate, stream }, { stream: false })
    editor.commands.setTextSelection(posOf(editor, '.') + 1)

    await ai.start(action('continue'))
    expect(stream).not.toHaveBeenCalled()
    expect(ai.target.value?.kind).toBe('cursor')
    expect(ai.accept('insert')).toBe(true)
    expect(editor.getText()).toContain('Hello brave world. Continued text')
  })

  it('asks for a custom instruction before running prompt actions', async () => {
    const generate = vi.fn().mockResolvedValue({ text: 'Bonjour' })
    const ai = setup({ generate })
    selectText(editor, 'Hello')

    ai.open(action('ask'))
    expect(ai.status.value).toBe('prompting')
    expect(generate).not.toHaveBeenCalled()

    await ai.start(action('ask'), 'Translate to French')
    expect(generate.mock.calls[0]?.[0]).toMatchObject({
      action: 'ask',
      mode: 'transform',
      instruction: 'Translate to French',
      selectedText: 'Hello',
    })
  })

  it('replaces the whole current block with multi-paragraph output', async () => {
    const ai = setup({ generate: vi.fn().mockResolvedValue({ text: 'One.\n\nTwo.' }) })
    editor.commands.setTextSelection(posOf(editor, 'brave'))
    await ai.start(action('longer'))
    expect(ai.target.value?.kind).toBe('block')
    expect(ai.accept('replace')).toBe(true)
    expect(editor.getHTML()).toBe('<p>One.</p><p>Two.</p><p>Second paragraph.</p>')
  })

  it('never interprets plain-text output as markup', async () => {
    const ai = setup({
      generate: vi.fn().mockResolvedValue({ text: '<img src=x onerror=alert(1)>' }),
    })
    selectText(editor, 'brave')
    await ai.start(action('rewrite'))
    ai.accept('replace')
    expect(editor.getHTML()).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(editor.view.dom.querySelector('img')).toBeNull()
  })

  it('sanitizes HTML output before parsing it with the editor schema', async () => {
    const ai = setup(
      {
        generate: vi.fn().mockResolvedValue({
          text: '<strong>bold</strong><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
        }),
      },
      { format: 'html' },
    )
    selectText(editor, 'brave')
    await ai.start(action('rewrite'))
    ai.accept('replace')
    const html = editor.getHTML()
    expect(html).toContain('<strong>bold</strong>')
    expect(html).not.toContain('script')
    expect(html).not.toContain('javascript:')
  })

  it('refuses to replace text that changed during generation', async () => {
    const ai = setup({ generate: vi.fn().mockResolvedValue({ text: 'bold' }) })
    selectText(editor, 'brave')
    await ai.start(action('rewrite'))

    const from = posOf(editor, 'brave')
    editor.commands.insertContentAt({ from, to: from + 1 }, 'c')
    expect(ai.accept('replace')).toBe(false)
    expect(ai.error.value).toMatch(/modifié/)
    expect(editor.getText()).toContain('crave')
  })

  it('maps the target through unrelated edits made while generating', async () => {
    const ai = setup({ generate: vi.fn().mockResolvedValue({ text: 'bold' }) })
    selectText(editor, 'brave')
    await ai.start(action('rewrite'))

    editor.commands.insertContentAt(1, 'Oh, ')
    expect(ai.accept('replace')).toBe(true)
    expect(editor.getText()).toContain('Oh, Hello bold world.')
  })

  it('applies structured operations only on explicit acceptance', async () => {
    const ai = setup({
      generate: vi.fn().mockResolvedValue({
        text: '',
        operations: [{ type: 'replaceText', from: 1, to: 6, content: 'Hi' }],
        explanation: 'Shorter greeting.',
      }),
    })
    editor.commands.setTextSelection(1)
    await ai.start(action('shorter'))
    expect(editor.getText()).toContain('Hello brave')
    expect(ai.explanation.value).toBe('Shorter greeting.')
    expect(ai.accept('operations')).toBe(true)
    expect(editor.getText()).toContain('Hi brave world.')
  })

  it('does nothing when the editor is read-only or disabled', async () => {
    const generate = vi.fn().mockResolvedValue({ text: 'x' })
    const ai = setup({ generate })
    selectText(editor, 'brave')
    editor.setEditable(false)

    ai.open(action('improve'))
    await ai.start(action('improve'))
    expect(generate).not.toHaveBeenCalled()
    expect(ai.status.value).toBe('idle')

    editor.setEditable(true)
    await ai.start(action('improve'))
    editor.setEditable(false)
    const before = editor.getHTML()
    expect(ai.accept('replace')).toBe(false)
    expect(editor.getHTML()).toBe(before)
  })

  it('discards results and ignores late chunks', async () => {
    const stream = controllableStream()
    const ai = setup({
      generate: vi.fn(),
      stream: (_request, options) => stream.iterate(options?.signal),
    })
    selectText(editor, 'brave')
    const done = ai.start(action('improve'))
    ai.discard()
    stream.push('late')
    stream.push(null)
    await done
    expect(ai.status.value).toBe('idle')
    expect(ai.result.value).toBe('')
    expect(ai.target.value).toBeNull()
  })
})
