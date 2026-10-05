// @vitest-environment jsdom

import { Extension, type Editor } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'
import { isSafeWysiwygUrl, sanitizeWysiwygAiHtml } from '../../src/advanced/wysiwyg/ai/sanitize'
import { textToWysiwygParagraphs } from '../../src/advanced/wysiwyg/ai/operations'
import { createWysiwygEditorTools } from '../../src/advanced/wysiwyg/ai/tools'
import { buildWysiwygFeatureExtensions } from '../../src/advanced/wysiwyg/extensions'
import {
  DEFAULT_WYSIWYG_FEATURES,
  resolveWysiwygFeatures,
} from '../../src/advanced/wysiwyg/features'
import { createWysiwygHandlers, type WysiwygUiState } from '../../src/advanced/wysiwyg/handlers'
import { findWysiwygTextRanges, getWysiwygSearchState } from '../../src/advanced/wysiwyg/search'
import { buildWysiwygSlashItems } from '../../src/advanced/wysiwyg/slash/commands'
import { parseWysiwygSource, serializeWysiwygSource } from '../../src/advanced/wysiwyg/source'
import {
  WYSIWYG_TABLE_BUBBLE,
  buildWysiwygTextBubble,
  buildWysiwygToolbar,
} from '../../src/advanced/wysiwyg/toolbar'
import { DEFAULT_TOOLBAR } from '../../src/advanced/wysiwygToolbar'
import { createTestEditor, posOf, selectText } from './wysiwygEditorHarness'

const editors: Editor[] = []
const editorWith = (content: string, features = DEFAULT_WYSIWYG_FEATURES) => {
  const editor = createTestEditor(content, buildWysiwygFeatureExtensions(features))
  editors.push(editor)
  return editor
}

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy()
  document.body.innerHTML = ''
})

const kinds = (groups: unknown[][]) =>
  groups.flat().map((item) => (item as Record<string, unknown>).kind ?? 'dropdown')

describe('features', () => {
  it('enables everything by default and supports per-feature or global opt-out', () => {
    expect(resolveWysiwygFeatures(undefined)).toEqual(DEFAULT_WYSIWYG_FEATURES)
    expect(resolveWysiwygFeatures({ table: false, preview: 'no' })).toMatchObject({
      table: false,
      preview: true,
    })
    expect(Object.values(resolveWysiwygFeatures(false)).every((v) => v === false)).toBe(true)
  })

  it('registers feature extensions and lets host extensions win on name clashes', () => {
    const all = buildWysiwygFeatureExtensions(DEFAULT_WYSIWYG_FEATURES).map((e) => e.name)
    expect(all).toEqual([
      'taskList',
      'taskItem',
      'textAlign',
      'textStyle',
      'color',
      'highlight',
      'tableKit',
      'wysiwygSearch',
    ])

    const hostTable = TableKit.configure({})
    const hostAlign = Extension.create({ name: 'textAlign' })
    const deduped = buildWysiwygFeatureExtensions(DEFAULT_WYSIWYG_FEATURES, [hostTable, hostAlign])
    expect(deduped.map((e) => e.name)).not.toContain('tableKit')
    expect(deduped.map((e) => e.name)).not.toContain('textAlign')

    expect(buildWysiwygFeatureExtensions(resolveWysiwygFeatures(false))).toEqual([])
    expect(
      buildWysiwygFeatureExtensions({ ...resolveWysiwygFeatures(false), highlight: true }).map(
        (e) => e.name,
      ),
    ).toEqual(['textStyle', 'highlight'])
  })

  it('parses and renders tables, task lists, colors and highlights', () => {
    const html =
      '<table><tbody><tr><th><p>A</p></th></tr><tr><td><p>1</p></td></tr></tbody></table>' +
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Done</p></li></ul>' +
      '<p style="text-align: center"><span style="color: #dc2626">red</span> <mark data-color="#fef08a" style="background-color: #fef08a">hl</mark></p>'
    const editor = editorWith(html)
    const out = editor.getHTML()
    expect(out).toContain('<table')
    expect(out).toContain('data-type="taskList"')
    expect(editor.state.doc.child(1).firstChild?.textContent).toBe('Done')
    expect(out).toContain('text-align: center')
    expect(out).toMatch(/color: (#dc2626|rgb.220, 38, 38.)/)
    expect(out).toContain('<mark')
  })
})

describe('find & replace', () => {
  it('finds matches across marks, case-insensitively by default', () => {
    const editor = editorWith('<p>Foo <strong>fo</strong>o FOO</p><p>foo</p>')
    expect(findWysiwygTextRanges(editor.state.doc, '')).toEqual([])
    expect(findWysiwygTextRanges(editor.state.doc, 'foo')).toHaveLength(4)
    expect(findWysiwygTextRanges(editor.state.doc, 'foo', true)).toHaveLength(2)
  })

  it('highlights, navigates and replaces through commands', () => {
    const editor = editorWith('<p>cat and cat and cat</p>')
    editor.commands.setSearchTerm('cat')
    let state = getWysiwygSearchState(editor.state)
    expect(state).toMatchObject({ term: 'cat', current: 0 })
    expect(state.results).toHaveLength(3)
    expect(editor.view.dom.querySelectorAll('.jf-wysiwyg-search-match')).toHaveLength(3)

    editor.commands.nextSearchResult()
    editor.commands.nextSearchResult()
    editor.commands.nextSearchResult()
    expect(getWysiwygSearchState(editor.state).current).toBe(0)
    editor.commands.previousSearchResult()
    expect(getWysiwygSearchState(editor.state).current).toBe(2)

    editor.commands.replaceSearchResult('dog')
    expect(editor.getText()).toBe('cat and cat and dog')
    state = getWysiwygSearchState(editor.state)
    expect(state.results).toHaveLength(2)

    editor.commands.replaceAllSearchResults('')
    expect(editor.getText()).toBe(' and  and dog')
    expect(editor.commands.replaceAllSearchResults('x')).toBe(false)
    expect(editor.commands.nextSearchResult()).toBe(false)

    editor.commands.setSearchCaseSensitive(true)
    editor.commands.setSearchTerm('')
    expect(editor.view.dom.querySelectorAll('.jf-wysiwyg-search-match')).toHaveLength(0)
  })
})

describe('handlers', () => {
  const setup = (content: string, ai: Parameters<typeof createWysiwygHandlers>[0]['ai'] = null) => {
    const editor = editorWith(content)
    const ui = reactive<WysiwygUiState>({ panel: null, mode: 'edit' })
    const handlers = createWysiwygHandlers({
      ui,
      linkEditor: true,
      ai,
      aiActions: [{ id: 'improve', label: 'Improve' }],
    })
    return { editor, ui, handlers }
  }

  it('applies colors and highlights to the selection', () => {
    const { editor, handlers } = setup('<p>paint me</p>')
    selectText(editor, 'paint')
    const red = { color: '#dc2626' }
    expect(handlers.textColor!.isDisabled!(editor)).toBe(false)
    expect(handlers.textColor!.canExecute(editor, red)).toBe(true)
    handlers.textColor!.execute(editor, red).run()
    expect(handlers.textColor!.isActive(editor, red)).toBe(true)
    expect(editor.getHTML()).toMatch(/color: (#dc2626|rgb.220, 38, 38.)/)
    handlers.textColor!.execute(editor, {}).run()
    expect(editor.getHTML()).not.toContain('color:')

    const yellow = { color: '#fef08a' }
    handlers.highlight!.execute(editor, yellow).run()
    expect(handlers.highlight!.isActive(editor, yellow)).toBe(true)
    expect(handlers.highlight!.isActive(editor, {})).toBe(false)
    handlers.highlight!.execute(editor, {}).run()
    expect(editor.getHTML()).not.toContain('<mark')
    expect(handlers.highlight!.canExecute(editor, {})).toBe(true)
  })

  it('inserts tables and runs table commands', () => {
    const { editor, handlers } = setup('<p>x</p>')
    expect(handlers.table!.canExecute(editor)).toBe(true)
    handlers.table!.execute(editor).run()
    expect(handlers.table!.isActive(editor)).toBe(true)
    expect(editor.getJSON().content?.[0]?.content).toHaveLength(3)

    expect(handlers.tableAction!.canExecute(editor, { action: 'addRowAfter' })).toBe(true)
    expect(handlers.tableAction!.canExecute(editor, { action: 'dropDatabase' })).toBe(false)
    handlers.tableAction!.execute(editor, { action: 'addRowAfter' }).run()
    expect(editor.getJSON().content?.[0]?.content).toHaveLength(4)
    handlers.tableAction!.execute(editor, { action: 'deleteTable' }).run()
    expect(editor.isActive('table')).toBe(false)
    expect(handlers.tableAction!.isDisabled!(editor)).toBe(true)
  })

  it('toggles panels and modes without touching the document', () => {
    const { editor, ui, handlers } = setup('<p>text</p>')
    const before = editor.getHTML()
    handlers.findReplace!.execute(editor).run()
    expect(ui.panel).toBe('find')
    expect(handlers.findReplace!.isActive(editor)).toBe(true)
    handlers.findReplace!.execute(editor).run()
    expect(ui.panel).toBeNull()

    handlers.sourceMode!.execute(editor).run()
    expect(ui.mode).toBe('source')
    handlers.preview!.execute(editor).run()
    expect(ui.mode).toBe('preview')
    expect(handlers.preview!.isActive(editor)).toBe(true)
    handlers.preview!.execute(editor).run()
    expect(ui.mode).toBe('edit')

    expect(handlers.link!.canExecute(editor)).toBe(false)
    selectText(editor, 'text')
    expect(handlers.link!.canExecute(editor)).toBe(true)
    handlers.link!.execute(editor).run()
    expect(ui.panel).toBe('link')
    expect(editor.getHTML()).toBe(before)
  })

  it('opens AI actions through the ai handler', () => {
    const open = vi.fn()
    const ai = {
      open,
      isOpen: computed(() => true),
      isGenerating: ref(false),
      currentAction: ref({ id: 'improve', label: 'Improve' }),
    } as unknown as Parameters<typeof createWysiwygHandlers>[0]['ai']
    const { editor, handlers } = setup('<p>text</p>', ai)
    expect(handlers.ai!.canExecute(editor, { action: 'improve' })).toBe(true)
    expect(handlers.ai!.canExecute(editor, { action: 'missing' })).toBe(false)
    handlers.ai!.execute(editor, { action: 'improve' }).run()
    expect(open).toHaveBeenCalledWith({ id: 'improve', label: 'Improve' })
    expect(handlers.ai!.isActive(editor, { action: 'improve' })).toBe(false)
    expect(handlers.ai!.isDisabled!(editor)).toBe(false)
  })

  it('omits the link override and AI handler when not requested', () => {
    const handlers = createWysiwygHandlers({
      ui: { panel: null, mode: 'edit' },
      linkEditor: false,
    })
    expect(handlers.link).toBeUndefined()
    expect(handlers.ai).toBeUndefined()
  })
})

describe('toolbar, bubbles and slash menu', () => {
  const ai = [{ id: 'improve', label: 'Improve', icon: 'i-lucide-wand' }]

  it('extends the default toolbar without dropping its groups', () => {
    const toolbar = buildWysiwygToolbar({ features: DEFAULT_WYSIWYG_FEATURES, imagesEnabled: true })
    for (const item of DEFAULT_TOOLBAR.flat()) {
      expect(kinds(toolbar)).toContain(item.kind)
    }
    expect(kinds(toolbar)).toEqual(
      expect.arrayContaining(['table', 'findReplace', 'sourceMode', 'preview']),
    )
    expect(kinds(toolbar)).not.toContain('ai')
  })

  it('drops entries of disabled features and images', () => {
    const toolbar = buildWysiwygToolbar({
      features: resolveWysiwygFeatures(false),
      imagesEnabled: false,
      aiActions: ai,
      aiLabel: 'Assistant',
    })
    const all = kinds(toolbar)
    for (const kind of ['taskList', 'textAlign', 'imageUpload', 'table', 'findReplace']) {
      expect(all).not.toContain(kind)
    }
    expect(toolbar.at(-1)?.[0]).toMatchObject({ label: 'Assistant' })
  })

  it('builds text bubble groups for formatting and AI independently', () => {
    expect(
      buildWysiwygTextBubble({ formatting: false, features: DEFAULT_WYSIWYG_FEATURES }),
    ).toEqual([])
    const bubble = buildWysiwygTextBubble({
      formatting: true,
      features: DEFAULT_WYSIWYG_FEATURES,
      aiActions: ai,
    })
    expect(bubble).toHaveLength(4)
    expect(bubble[0]?.[0]).toMatchObject({ items: [{ kind: 'ai', action: 'improve' }] })
    expect(kinds(WYSIWYG_TABLE_BUBBLE as unknown[][]).every((k) => k === 'tableAction')).toBe(true)
  })

  it('exposes AI entries in the slash menu with an `ai` keyword', () => {
    const items = buildWysiwygSlashItems({
      formatting: true,
      features: DEFAULT_WYSIWYG_FEATURES,
      imagesEnabled: true,
      aiActions: ai,
    })
    expect(items[0]?.[1]).toMatchObject({
      kind: 'ai',
      action: 'improve',
      keywords: 'ai ia assistant',
    })
    expect(kinds(items)).toEqual(expect.arrayContaining(['table', 'imageUpload', 'taskList']))
    expect(
      buildWysiwygSlashItems({
        formatting: false,
        features: DEFAULT_WYSIWYG_FEATURES,
        imagesEnabled: true,
      }),
    ).toEqual([])
  })
})

describe('editor tools', () => {
  it('reads editor state and only proposes operations', () => {
    const editor = editorWith('<h2>Intro</h2><p>Some text here.</p>')
    const tools = createWysiwygEditorTools(editor)
    selectText(editor, 'text')
    const before = editor.getHTML()

    expect(tools.getSelection.execute({})).toMatchObject({ text: 'text' })
    expect(tools.getDocumentText.execute({}).text).toBe('Intro\n\nSome text here.')
    expect(tools.getCurrentBlock.execute({})).toEqual({
      type: 'paragraph',
      text: 'Some text here.',
    })
    expect(tools.getHeadings.execute({})).toEqual([{ level: 2, text: 'Intro', pos: 0 }])
    expect(tools.findText.execute({ query: 'TEXT' })).toEqual([
      { from: posOf(editor, 'text'), to: posOf(editor, 'text') + 4 },
    ])
    expect(tools.proposeReplaceSelection.execute({ content: 'x' })).toEqual({
      type: 'replaceSelection',
      content: 'x',
    })
    expect(tools.proposeInsertContent.execute({ content: 'x' })).toEqual({
      type: 'insertAtCursor',
      content: 'x',
    })
    expect(tools.proposeInsertContent.execute({ content: 'x', at: 1 })).toEqual({
      type: 'insertContent',
      at: 1,
      content: 'x',
    })
    expect(tools.proposeReplaceText.execute({ from: 1, to: 2, content: 'x' })).toMatchObject({
      type: 'replaceText',
    })
    expect(Object.values(tools).every((t) => t.kind === 'read' || t.kind === 'propose')).toBe(true)
    expect(editor.getHTML()).toBe(before)
  })
})

describe('source mode helpers', () => {
  it('serializes and validates HTML / JSON sources', () => {
    const editor = editorWith('<p>hi</p>')
    expect(serializeWysiwygSource(editor, 'html')).toBe('<p>hi</p>')
    expect(JSON.parse(serializeWysiwygSource(editor, 'json')).type).toBe('doc')
    expect(parseWysiwygSource('<p>x</p>', 'html')).toEqual({ ok: true, content: '<p>x</p>' })
    expect(parseWysiwygSource('{"type":"doc"}', 'json')).toEqual({
      ok: true,
      content: { type: 'doc' },
    })
    expect(parseWysiwygSource('{', 'json')).toMatchObject({ ok: false })
    expect(parseWysiwygSource('[]', 'json')).toMatchObject({ ok: false })
    expect(parseWysiwygSource('{"type":"paragraph"}', 'json')).toMatchObject({ ok: false })
  })
})

describe('AI output safety', () => {
  it('rejects unsafe URLs', () => {
    for (const url of [
      'https://a.b',
      'http://a',
      'mailto:x@y.z',
      'tel:+33',
      '#top',
      '/p',
      './p',
      'page.html',
    ]) {
      expect(isSafeWysiwygUrl(url)).toBe(true)
    }
    for (const url of [
      'javascript:alert(1)',
      ' java\tscript:alert(1)',
      'data:text/html,x',
      'vbscript:x',
      '//evil.com',
      '\\\\evil',
      '',
    ]) {
      expect(isSafeWysiwygUrl(url)).toBe(false)
    }
  })

  it('keeps allowed markup and strips scripts, handlers and unsafe links', () => {
    const html = sanitizeWysiwygAiHtml(
      '<p onclick="x()">Hi <b>there</b><script>alert(1)</script><style>p{}</style></p>' +
        '<a href="javascript:alert(1)">bad</a><a href="https://ok.test" target="_blank">ok</a>' +
        '<custom-el>kept text</custom-el><iframe src="https://x"></iframe>' +
        '<table><tr><td colspan="2" style="x">c</td><td rowspan="evil">d</td></tr></table>',
    )
    expect(html).toContain('<p>Hi <b>there</b></p>')
    expect(html).not.toMatch(/script|style|onclick|iframe|javascript|target/)
    expect(html).toContain('<a>bad</a>')
    expect(html).toContain('<a href="https://ok.test" rel="noopener noreferrer">ok</a>')
    expect(html).toContain('kept text')
    expect(html).toContain('<td colspan="2">c</td><td>d</td>')
  })

  it('falls back to escaped text without DOMParser', () => {
    vi.stubGlobal('DOMParser', undefined)
    try {
      expect(sanitizeWysiwygAiHtml('<b>x</b> & <script>y</script>')).toBe('x &amp; y')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('splits plain text into paragraphs and hard breaks', () => {
    expect(textToWysiwygParagraphs('\r\nA\nB\n\n\nC  \n\n')).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'A' }, { type: 'hardBreak' }, { type: 'text', text: 'B' }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'C' }] },
    ])
    expect(textToWysiwygParagraphs('   ')).toEqual([])
  })
})

describe('editor styles', () => {
  it('injects table / task list / search styles once and refreshes them', async () => {
    const { ensureWysiwygEditorStyles, refreshWysiwygEditorStyles } = await import(
      '../../src/advanced/wysiwyg/styles'
    )
    ensureWysiwygEditorStyles()
    ensureWysiwygEditorStyles()
    expect(document.querySelectorAll('#jf-wysiwyg-editor')).toHaveLength(1)
    refreshWysiwygEditorStyles()
    const style = document.getElementById('jf-wysiwyg-editor')
    expect(style?.textContent).toContain('.jf-wysiwyg-search-match-current')
    expect(style?.textContent).toContain("ul[data-type='taskList']")
    style?.remove()
  })
})
