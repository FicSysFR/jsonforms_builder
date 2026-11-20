// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import type { Editor } from '@tiptap/core'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import {
  DISABLED_WYSIWYG_BLOCK_EDITOR,
  findWysiwygBlockAt,
  WYSIWYG_BLOCK_LAYOUT,
  buildWysiwygBlockMenu,
  createWysiwygBlockPlaceholder,
  insertWysiwygBlockAfter,
  resolveWysiwygBlockEditor,
  runWysiwygBlockAction,
  type WysiwygBlockAction,
  type WysiwygBlockType,
} from '../../src/advanced/wysiwyg/block'
import { DEFAULT_WYSIWYG_FEATURES } from '../../src/advanced/wysiwyg/features'
import { resolveWysiwygOptions } from '../../src/advanced/wysiwygOptions'
import { buildWysiwygToolbar } from '../../src/advanced/wysiwyg/toolbar'
import { createJsonFormsTranslator } from '../../src/i18n/createJsonFormsTranslator'
import { createUiText } from '../../src/i18n/ui'
import { createTestEditor } from './wysiwygEditorHarness'

type Item = Record<string, unknown>

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
})

/** Position of the n-th top-level block. */
const blockPos = (target: Editor, index: number) => {
  let pos = 0
  for (let i = 0; i < index; i++) pos += target.state.doc.child(i).nodeSize
  return pos
}

describe('resolveWysiwygBlockEditor', () => {
  it('stays off unless true or an object is given', () => {
    for (const raw of [undefined, false, 'yes', 1, []]) {
      expect(resolveWysiwygBlockEditor(raw)).toEqual(DISABLED_WYSIWYG_BLOCK_EDITOR)
    }
  })

  it('enables the handle and placeholders on a borderless page by default', () => {
    expect(resolveWysiwygBlockEditor(true)).toEqual({
      enabled: true,
      dragHandle: true,
      placeholders: true,
      bordered: false,
    })
    expect(
      resolveWysiwygBlockEditor({ dragHandle: false, placeholders: 'no', bordered: true }),
    ).toEqual({ enabled: true, dragHandle: false, placeholders: true, bordered: true })
  })
})

describe('resolveWysiwygOptions with blockEditor', () => {
  it('keeps the historical defaults without blockEditor', () => {
    const resolved = resolveWysiwygOptions({}, 'object')
    expect(resolved).toMatchObject({
      bubbleMenu: false,
      slashCommands: false,
      padding: 'p-3',
      blockEditor: DISABLED_WYSIWYG_BLOCK_EDITOR,
    })
    expect(resolved.toolbar).not.toBe(false)
  })

  it('swaps the fixed toolbar for the bubble menu, the / palette and a page layout', () => {
    expect(resolveWysiwygOptions({ blockEditor: true }, 'object')).toMatchObject({
      toolbar: false,
      bubbleMenu: true,
      slashCommands: true,
      ...WYSIWYG_BLOCK_LAYOUT,
      blockEditor: { enabled: true, dragHandle: true },
    })
  })

  it('lets explicit options win over the block mode defaults', () => {
    const toolbar = [[{ kind: 'bold' }]]
    const resolved = resolveWysiwygOptions(
      { blockEditor: true, toolbar, bubbleMenu: false, slashCommands: false, density: 'prose' },
      'object',
    )
    expect(resolved).toMatchObject({
      toolbar,
      bubbleMenu: false,
      slashCommands: false,
      padding: 'p-6',
    })
    expect(resolveWysiwygOptions({ blockEditor: true, padding: 'p-2' }, 'object').padding).toBe(
      'p-2',
    )
    expect(
      resolveWysiwygOptions({ blockEditor: { bordered: true }, toolbar: undefined }, 'object')
        .toolbar,
    ).toBe(false)
    // An unknown density still beats the block layout and falls back to `compact`.
    expect(
      resolveWysiwygOptions({ blockEditor: true, density: 'huge' as 'compact' }, 'object').padding,
    ).toBe('p-3')
    expect(resolveWysiwygOptions({ blockEditor: false }, 'object').toolbar).toEqual(
      buildWysiwygToolbar({ features: DEFAULT_WYSIWYG_FEATURES, imagesEnabled: true }),
    )
  })
})

describe('createWysiwygBlockPlaceholder', () => {
  it('names headings, hints at / and keeps the host placeholder on an empty document', () => {
    editor = createTestEditor('<h2></h2><p></p>')
    const heading = editor.state.doc.child(0)
    const paragraph = editor.state.doc.child(1)

    const hint = createWysiwygBlockPlaceholder({ slashCommands: true })
    expect(hint({ editor, node: heading })).toBe('Titre 2')
    expect(hint({ editor, node: paragraph })).toBe('Écrivez, ou tapez « / » pour les commandes…')

    const noSlash = createWysiwygBlockPlaceholder({ slashCommands: false })
    expect(noSlash({ editor, node: paragraph })).toBe('Écrivez…')

    const english = createWysiwygBlockPlaceholder(
      { slashCommands: true },
      createUiText(createJsonFormsTranslator({ locale: 'en' })),
    )
    expect(english({ editor, node: paragraph })).toBe("Write, or type '/' for commands…")
  })

  it('shows the host placeholder only while the document is empty', () => {
    editor = createTestEditor('<p></p>')
    const host = createWysiwygBlockPlaceholder({
      hostPlaceholder: 'Décrivez…',
      slashCommands: true,
    })
    expect(host({ editor, node: editor.state.doc.child(0) })).toBe('Décrivez…')

    editor.commands.setContent('<p>Texte</p><p></p>')
    expect(host({ editor, node: editor.state.doc.child(1) })).toBe(
      'Écrivez, ou tapez « / » pour les commandes…',
    )
  })

  it('falls back to level 1 for a heading without level', () => {
    editor = createTestEditor('<p></p>')
    const heading = editor.schema.nodes.heading?.create({ level: null })
    if (!heading) throw new Error('heading node missing')
    const hint = createWysiwygBlockPlaceholder({ slashCommands: true })
    expect(hint({ editor, node: heading })).toBe('Titre 1')
  })

  it('leaves code blocks without hint', () => {
    editor = createTestEditor('<pre><code></code></pre>')
    const hint = createWysiwygBlockPlaceholder({ slashCommands: true })
    expect(hint({ editor, node: editor.state.doc.child(0) })).toBe('')
  })
})

describe('buildWysiwygBlockMenu', () => {
  const menuOf = (target: Editor, pos: number, extra: Partial<{ onCopy: () => void }> = {}) =>
    buildWysiwygBlockMenu({ editor: target, features: DEFAULT_WYSIWYG_FEATURES, pos, ...extra })
  const labels = (items: Item[]) => items.map((item) => item.label)

  it('groups turn-into, duplicate/copy, move and delete entries', () => {
    editor = createTestEditor('<p>Un</p><p>Deux</p>')
    const onCopy = () => undefined
    const groups = menuOf(editor, 0, { onCopy })
    expect(groups.map(labels)).toEqual([
      ['Transformer en', 'Effacer la mise en forme'],
      ['Dupliquer', 'Copier le texte'],
      ['Monter', 'Descendre'],
      ['Supprimer'],
    ])
    expect(groups[1]?.[1]?.onSelect).toBe(onCopy)
    expect(labels((groups[0]?.[0]?.children ?? []) as Item[])).toEqual([
      'Transformer en',
      'Paragraphe',
      'Titre 1',
      'Titre 2',
      'Titre 3',
      'Liste à puces',
      'Liste numérotée',
      'Liste de tâches',
      'Citation',
      'Bloc de code',
    ])
    // First block: nothing above; second block: nothing below.
    expect(groups[2]?.map((item) => item.disabled)).toEqual([true, false])
    expect(menuOf(editor, blockPos(editor, 1))[2]?.map((item) => item.disabled)).toEqual([
      false,
      true,
    ])
  })

  it('drops the task list without the feature and copy without a clipboard', () => {
    editor = createTestEditor('<p>Un</p>')
    const groups = buildWysiwygBlockMenu({
      editor,
      features: { ...DEFAULT_WYSIWYG_FEATURES, taskList: false },
      pos: 0,
    })
    const turnInto = (groups[0]?.[0]?.children ?? []) as Item[]
    expect(turnInto.some((item) => item.icon === 'i-lucide-list-checks')).toBe(false)
    expect(groups[1]).toHaveLength(1)
  })

  it('disables conversions whose node type the editor lacks', () => {
    editor = createTestEditor('<p>Un</p>')
    const turnInto = (menuOf(editor, 0)[0]?.[0]?.children ?? []) as Item[]
    const taskList = turnInto.find((item) => item.icon === 'i-lucide-list-checks')
    expect(taskList?.disabled).toBe(true)
  })

  it('runs its entries on the targeted block', () => {
    editor = createTestEditor('<p>Un</p><p>Deux</p><p>Trois</p>')
    const target = editor
    const select = (pos: number, group: number, index: number) => {
      const onSelect = menuOf(target, pos)[group]?.[index]?.onSelect
      if (typeof onSelect !== 'function') throw new Error(`no entry at ${group}/${index}`)
      onSelect()
    }
    select(blockPos(target, 1), 2, 0) // move up
    expect(target.getText({ blockSeparator: '|' })).toBe('Deux|Un|Trois')
    select(0, 1, 0) // duplicate
    expect(target.getText({ blockSeparator: '|' })).toBe('Deux|Deux|Un|Trois')
    select(blockPos(target, 3), 3, 0) // delete
    expect(target.getText({ blockSeparator: '|' })).toBe('Deux|Deux|Un')
  })

  it('translates the menu', () => {
    editor = createTestEditor('<p>Un</p>')
    const groups = buildWysiwygBlockMenu(
      { editor, features: DEFAULT_WYSIWYG_FEATURES, pos: 0 },
      createUiText(createJsonFormsTranslator({ locale: 'en' })),
    )
    expect(groups[0]?.[0]?.label).toBe('Turn into')
    expect(groups[3]?.[0]?.label).toBe('Delete')
  })
})

describe('runWysiwygBlockAction', () => {
  const types = (target: Editor) => {
    const names: string[] = []
    target.state.doc.forEach((node) => {
      names.push(node.type.name === 'heading' ? `h${node.attrs.level}` : node.type.name)
    })
    return names
  }

  it('turns a block into each type, through plain paragraphs', () => {
    editor = createTestEditor('<p>Un</p><p><strong>Deux</strong></p><p>Trois</p>', [
      TaskList,
      TaskItem,
    ])
    const pos = () => blockPos(editor as Editor, 1)
    const turn = (to: WysiwygBlockType) =>
      runWysiwygBlockAction(editor as Editor, pos(), { action: 'turnInto', to })

    expect(turn({ type: 'heading', level: 2 })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'h2', 'paragraph'])
    expect(turn({ type: 'bulletList' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'bulletList', 'paragraph'])
    expect(turn({ type: 'orderedList' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'orderedList', 'paragraph'])
    expect(turn({ type: 'taskList' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'taskList', 'paragraph'])
    expect(turn({ type: 'blockquote' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'blockquote', 'paragraph'])
    expect(turn({ type: 'codeBlock' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'codeBlock', 'paragraph'])
    expect(turn({ type: 'paragraph' })).toBe(true)
    expect(types(editor)).toEqual(['paragraph', 'paragraph', 'paragraph'])
    expect(editor.getText({ blockSeparator: '|' })).toBe('Un|Deux|Trois')
  })

  it('clears marks and block type', () => {
    editor = createTestEditor('<h3><em>Un</em></h3><p>Deux</p>')
    expect(runWysiwygBlockAction(editor, 0, { action: 'clearFormatting' })).toBe(true)
    expect(editor.getHTML()).toBe('<p>Un</p><p>Deux</p>')
  })

  it('moves blocks within bounds and refuses positions that start no top-level block', () => {
    editor = createTestEditor('<p>Un</p><p>Deux</p>')
    expect(runWysiwygBlockAction(editor, 0, { action: 'moveUp' })).toBe(false)
    expect(runWysiwygBlockAction(editor, 0, { action: 'moveDown' })).toBe(true)
    expect(editor.getText({ blockSeparator: '|' })).toBe('Deux|Un')
    expect(runWysiwygBlockAction(editor, blockPos(editor, 1), { action: 'moveDown' })).toBe(false)
    expect(runWysiwygBlockAction(editor, 1, { action: 'delete' })).toBe(false)
    expect(runWysiwygBlockAction(editor, 999, { action: 'delete' })).toBe(false)
    expect(runWysiwygBlockAction(editor, -1, { action: 'delete' })).toBe(false)
    expect(runWysiwygBlockAction(editor, 0.5, { action: 'delete' })).toBe(false)
    expect(runWysiwygBlockAction(editor, 0, { action: 'turnInto', to: { type: 'taskList' } })).toBe(
      false,
    )
  })

  it('ignores unknown actions and conversions', () => {
    editor = createTestEditor('<p>Un</p>')
    const unknownAction = { action: 'archive' } as unknown as WysiwygBlockAction
    const unknownType = {
      action: 'turnInto',
      to: { type: 'text' },
    } as unknown as WysiwygBlockAction
    expect(runWysiwygBlockAction(editor, 0, unknownAction)).toBe(false)
    expect(runWysiwygBlockAction(editor, 0, unknownType)).toBe(false)
    expect(editor.getHTML()).toBe('<p>Un</p>')
  })
})

describe('insertWysiwygBlockAfter', () => {
  it('inserts an empty paragraph after the block and moves the cursor into it', () => {
    editor = createTestEditor('<h1>Titre</h1><p>Fin</p>')
    expect(insertWysiwygBlockAfter(editor, 0, false)).toBe(true)
    expect(editor.state.doc.child(1).type.name).toBe('paragraph')
    expect(editor.state.doc.child(1).textContent).toBe('')
    expect(editor.state.selection.$from.parent).toBe(editor.state.doc.child(1))
  })

  it('starts the new block with / to open the command palette', () => {
    editor = createTestEditor('<p>Un</p>')
    insertWysiwygBlockAfter(editor, 0, true)
    expect(editor.state.doc.child(1).textContent).toBe('/')
    expect(editor.state.selection.from).toBe(blockPos(editor, 1) + 2)
  })

  it('refuses a position without top-level block', () => {
    editor = createTestEditor('<p>Un</p><ul><li><p>Item</p></li></ul>')
    expect(insertWysiwygBlockAfter(editor, 999, true)).toBe(false)
    expect(insertWysiwygBlockAfter(editor, -1, true)).toBe(false)
    expect(insertWysiwygBlockAfter(editor, blockPos(editor, 1) + 1, true)).toBe(false)
  })
})

describe('findWysiwygBlockAt', () => {
  it('returns the block under the pointer, or the nearest one', () => {
    editor = createTestEditor('<p>Un</p><p>Deux</p><p>Trois</p>')
    const rects = [
      { top: 0, bottom: 20 },
      { top: 30, bottom: 50 },
      { top: 60, bottom: 80 },
    ]
    Array.from(editor.view.dom.children).forEach((child, index) => {
      ;(child as HTMLElement).getBoundingClientRect = () => rects[index] as DOMRect
    })
    expect(findWysiwygBlockAt(editor.view, 40)).toBe(blockPos(editor, 1))
    expect(findWysiwygBlockAt(editor.view, 27)).toBe(blockPos(editor, 1))
    expect(findWysiwygBlockAt(editor.view, 200)).toBe(blockPos(editor, 2))
    expect(findWysiwygBlockAt(editor.view, -50)).toBe(0)
  })

  it('skips blocks without rendered element', () => {
    editor = createTestEditor('<p>Un</p>')
    const view = { state: editor.state, nodeDOM: () => null } as unknown as Editor['view']
    expect(findWysiwygBlockAt(view, 0)).toBeNull()
  })
})
