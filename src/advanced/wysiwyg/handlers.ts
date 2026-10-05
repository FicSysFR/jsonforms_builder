import type { Editor } from '@tiptap/vue-3'
import type { WysiwygAiController } from './ai/useWysiwygAi'
import type { WysiwygAiAction } from './ai/types'

/** Panels and modes driven by toolbar / slash / bubble items. */
export type WysiwygUiState = {
  panel: null | 'find' | 'link'
  mode: 'edit' | 'source' | 'preview'
}

/** Same contract as Nuxt UI's `EditorHandler` (not re-exported by `@nuxt/ui`). */
export type WysiwygEditorHandler = {
  canExecute: (editor: Editor, cmd?: Record<string, unknown>) => boolean
  execute: (editor: Editor, cmd?: Record<string, unknown>) => { run: () => boolean }
  isActive: (editor: Editor, cmd?: Record<string, unknown>) => boolean
  isDisabled?: (editor: Editor, cmd?: Record<string, unknown>) => boolean
}

export const WYSIWYG_TABLE_ACTIONS = [
  'addRowBefore',
  'addRowAfter',
  'deleteRow',
  'addColumnBefore',
  'addColumnAfter',
  'deleteColumn',
  'mergeOrSplit',
  'toggleHeaderRow',
  'toggleHeaderColumn',
  'deleteTable',
] as const

export type WysiwygTableAction = (typeof WYSIWYG_TABLE_ACTIONS)[number]

const hasExtension = (editor: Editor, name: string) =>
  editor.extensionManager.extensions.some((extension) => extension.name === name)

const inImageOrCode = (editor: Editor) => editor.isActive('image') || editor.isActive('codeBlock')

const color = (cmd?: Record<string, unknown>) =>
  typeof cmd?.color === 'string' && cmd.color ? cmd.color : undefined

/** Chain-shaped no-op returned by handlers that only change UI state. */
const done = (editor: Editor) => editor.chain()

type CreateWysiwygHandlersOptions = {
  ui: WysiwygUiState
  linkEditor: boolean
  ai?: WysiwygAiController | null
  aiActions?: WysiwygAiAction[]
}

/**
 * Handlers backing the `kind`s used by the built-in toolbar, bubbles and slash menu.
 * Host `options.handlers` are merged after these and can override any of them.
 */
export const createWysiwygHandlers = ({
  ui,
  linkEditor,
  ai,
  aiActions = [],
}: CreateWysiwygHandlersOptions): Record<string, WysiwygEditorHandler> => {
  const handlers: Record<string, WysiwygEditorHandler> = {
    textColor: {
      canExecute: (editor, cmd) => {
        const value = color(cmd)
        return value ? editor.can().setColor(value) : editor.can().unsetColor()
      },
      execute: (editor, cmd) => {
        const value = color(cmd)
        const chain = editor.chain().focus()
        return value ? chain.setColor(value) : chain.unsetColor()
      },
      isActive: (editor, cmd) => {
        const value = color(cmd)
        return !!value && editor.isActive('textStyle', { color: value })
      },
      isDisabled: (editor) => !hasExtension(editor, 'color') || inImageOrCode(editor),
    },
    highlight: {
      canExecute: (editor, cmd) => {
        const value = color(cmd)
        return value
          ? editor.can().toggleHighlight({ color: value })
          : editor.can().unsetHighlight()
      },
      execute: (editor, cmd) => {
        const value = color(cmd)
        const chain = editor.chain().focus()
        return value ? chain.toggleHighlight({ color: value }) : chain.unsetHighlight()
      },
      isActive: (editor, cmd) => {
        const value = color(cmd)
        return value ? editor.isActive('highlight', { color: value }) : false
      },
      isDisabled: (editor) => !hasExtension(editor, 'highlight') || inImageOrCode(editor),
    },
    table: {
      canExecute: (editor) => editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
      execute: (editor) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
      isActive: (editor) => editor.isActive('table'),
      isDisabled: (editor) => !hasExtension(editor, 'table') || inImageOrCode(editor),
    },
    tableAction: {
      canExecute: (editor, cmd) => {
        const action = cmd?.action as WysiwygTableAction | undefined
        if (!action || !WYSIWYG_TABLE_ACTIONS.includes(action)) return false
        return editor.can()[action]()
      },
      execute: (editor, cmd) => {
        const action = cmd?.action as WysiwygTableAction | undefined
        const chain = editor.chain().focus()
        return action && WYSIWYG_TABLE_ACTIONS.includes(action) ? chain[action]() : chain
      },
      isActive: () => false,
      isDisabled: (editor) => !editor.isActive('table'),
    },
    findReplace: {
      canExecute: (editor) => hasExtension(editor, 'wysiwygSearch'),
      execute: (editor) => {
        ui.panel = ui.panel === 'find' ? null : 'find'
        return done(editor)
      },
      isActive: () => ui.panel === 'find',
    },
    sourceMode: {
      canExecute: () => true,
      execute: (editor) => {
        ui.panel = null
        ui.mode = ui.mode === 'source' ? 'edit' : 'source'
        return done(editor)
      },
      isActive: () => ui.mode === 'source',
    },
    preview: {
      canExecute: () => true,
      execute: (editor) => {
        ui.panel = null
        ui.mode = ui.mode === 'preview' ? 'edit' : 'preview'
        return done(editor)
      },
      isActive: () => ui.mode === 'preview',
    },
  }

  if (linkEditor) {
    handlers.link = {
      canExecute: (editor) => !editor.state.selection.empty || editor.isActive('link'),
      execute: (editor) => {
        ui.panel = ui.panel === 'link' ? null : 'link'
        return done(editor)
      },
      isActive: (editor) => editor.isActive('link'),
      isDisabled: (editor) => !hasExtension(editor, 'link') || editor.isActive('image'),
    }
  }

  if (ai) {
    const find = (cmd?: Record<string, unknown>) =>
      aiActions.find((action) => action.id === cmd?.action)
    handlers.ai = {
      canExecute: (editor, cmd) => editor.isEditable && !!find(cmd),
      execute: (editor, cmd) => {
        const action = find(cmd)
        if (action) ai.open(action)
        return done(editor)
      },
      // Never "active": Nuxt UI would relabel the AI dropdown with the running action.
      isActive: () => false,
      isDisabled: () => ai.isGenerating.value,
    }
  }

  return handlers
}
