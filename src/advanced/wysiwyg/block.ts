import type { Editor } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection, type Transaction } from '@tiptap/pm/state'
import { createUiText, type UiText } from '../../i18n/ui'
import type { ResolvedWysiwygFeatures } from './features'

/**
 * Block editing: the document reads as a page, each top-level block gets a gutter handle
 * (`+` to insert below, grip to drag or open the block menu) and empty blocks hint at `/`.
 */
export type WysiwygBlockEditorOptions = {
  /** Gutter handle: `+` button, drag and drop, block menu. Default: `true`. */
  dragHandle?: boolean
  /** Placeholder on the empty block holding the cursor (`Titre 1`, `/` hint). Default: `true`. */
  placeholders?: boolean
  /** Keep the field border around the page. Default: `false`. */
  bordered?: boolean
}

export type ResolvedWysiwygBlockEditor = {
  enabled: boolean
  dragHandle: boolean
  placeholders: boolean
  bordered: boolean
}

export const DISABLED_WYSIWYG_BLOCK_EDITOR: Readonly<ResolvedWysiwygBlockEditor> = Object.freeze({
  enabled: false,
  dragHandle: false,
  placeholders: false,
  bordered: true,
})

/** `true` enables every default; an object overrides them; anything else disables the mode. */
export const resolveWysiwygBlockEditor = (raw: unknown): ResolvedWysiwygBlockEditor => {
  if (raw !== true && !(raw && typeof raw === 'object' && !Array.isArray(raw))) {
    return { ...DISABLED_WYSIWYG_BLOCK_EDITOR }
  }
  const options = (raw === true ? {} : raw) as Record<string, unknown>
  const flag = (key: string, fallback: boolean) =>
    typeof options[key] === 'boolean' ? (options[key] as boolean) : fallback
  return {
    enabled: true,
    dragHandle: flag('dragHandle', true),
    placeholders: flag('placeholders', true),
    bordered: flag('bordered', false),
  }
}

/** Layout defaults of the block mode; explicit `density`, `padding`… still win. */
export const WYSIWYG_BLOCK_LAYOUT = Object.freeze({
  minHeight: 'min-h-52',
  // The gutter handle sits left of the block and is hidden below `sm`.
  padding: 'py-4 pe-4 ps-4 sm:ps-16',
  blockSpacing: '*:!my-1.5',
})

type PlaceholderContext = { editor: Editor; node: ProseMirrorNode }

/**
 * Placeholder of the empty block holding the cursor: the heading level on a heading, the host
 * placeholder on an empty document, the `/` hint elsewhere (when slash commands are on).
 */
export const createWysiwygBlockPlaceholder =
  (
    { hostPlaceholder, slashCommands }: { hostPlaceholder?: string; slashCommands: boolean },
    t: UiText = createUiText(),
  ) =>
  ({ editor, node }: PlaceholderContext): string => {
    if (node.type.name === 'heading') {
      return t('jsonformsBuilder.wysiwyg.heading', { level: node.attrs.level ?? 1 })
    }
    if (node.type.name !== 'paragraph') return ''
    if (hostPlaceholder && editor.isEmpty) return hostPlaceholder
    return slashCommands
      ? t('jsonformsBuilder.wysiwyg.block.placeholder')
      : t('jsonformsBuilder.wysiwyg.block.placeholderNoSlash')
  }

type Item = Record<string, unknown>

/** Block conversions offered by "turn into". */
export type WysiwygBlockType =
  | { type: 'paragraph' }
  | { type: 'heading'; level: 1 | 2 | 3 }
  | { type: 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'codeBlock' }

export type WysiwygBlockAction =
  | { action: 'turnInto'; to: WysiwygBlockType }
  | { action: 'clearFormatting' | 'duplicate' | 'moveUp' | 'moveDown' | 'delete' }

/** Top-level block at `pos`, or `null` when `pos` does not start one. */
const topLevelBlockAt = (editor: Editor, pos: number) => {
  const { doc } = editor.state
  if (!Number.isInteger(pos) || pos < 0 || pos >= doc.content.size) return null
  if (doc.resolve(pos).depth !== 0) return null
  const node = doc.nodeAt(pos)
  if (!node) return null
  let index = 0
  doc.forEach((_child, offset, childIndex) => {
    if (offset === pos) index = childIndex
  })
  return { node, index, count: doc.childCount }
}

/** Selects the inline content of the block, so block commands apply to all of it. */
const selectBlockContent =
  (pos: number, size: number) =>
  ({ tr }: { tr: Transaction }) => {
    const $from = tr.doc.resolve(pos + 1)
    const $to = tr.doc.resolve(pos + size - 1)
    tr.setSelection(TextSelection.between($from, $to))
    return true
  }

/**
 * Runs a block menu action on the top-level block at `pos`, with plain Tiptap commands (no
 * Nuxt UI handler). Returns `false` when the action cannot apply (no block, first block moved
 * up, missing node type…).
 */
export const runWysiwygBlockAction = (
  editor: Editor,
  pos: number,
  command: WysiwygBlockAction,
): boolean => {
  const block = topLevelBlockAt(editor, pos)
  if (!block) return false
  const { node, index, count } = block
  const end = pos + node.nodeSize

  switch (command.action) {
    case 'duplicate':
      return editor.chain().focus().insertContentAt(end, node.toJSON()).run()
    case 'delete':
      return editor.chain().focus().deleteRange({ from: pos, to: end }).run()
    case 'moveUp':
    case 'moveDown': {
      const up = command.action === 'moveUp'
      if (up ? index === 0 : index === count - 1) return false
      const neighbour = editor.state.doc.child(up ? index - 1 : index + 1)
      const target = up ? pos - neighbour.nodeSize : pos + neighbour.nodeSize
      return editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.delete(pos, end).insert(target, node)
          tr.setSelection(NodeSelection.create(tr.doc, target))
          return true
        })
        .run()
    }
    case 'clearFormatting':
      return editor
        .chain()
        .focus()
        .command(selectBlockContent(pos, node.nodeSize))
        .clearNodes()
        .unsetAllMarks()
        .run()
    case 'turnInto': {
      const { to } = command
      if (!editor.schema.nodes[to.type]) return false
      // Back to plain paragraphs first (lifts lists and quotes), then convert.
      const chain = editor
        .chain()
        .focus()
        .command(selectBlockContent(pos, node.nodeSize))
        .clearNodes()
      switch (to.type) {
        case 'paragraph':
          // `clearNodes` already leaves paragraphs; `setParagraph` would fail on them.
          return chain.run()
        case 'heading':
          return chain.setHeading({ level: to.level }).run()
        case 'codeBlock':
          return chain.setCodeBlock().run()
        case 'blockquote':
          return chain.setBlockquote().run()
        case 'bulletList':
          return chain.toggleBulletList().run()
        case 'orderedList':
          return chain.toggleOrderedList().run()
        case 'taskList':
          return chain.toggleTaskList().run()
      }
    }
  }
  return false
}

type BlockMenuOptions = {
  editor: Editor
  features: ResolvedWysiwygFeatures
  /** Document position of the top-level block the menu acts on. */
  pos: number
  /** Copies the block text; omitted when the clipboard is unavailable. */
  onCopy?: () => void
}

/**
 * Block menu items for Nuxt UI `UDropdownMenu`: turn into, clear formatting, duplicate, copy,
 * move and delete, each running `runWysiwygBlockAction` on the block at `pos`.
 */
export const buildWysiwygBlockMenu = (
  { editor, features, pos, onCopy }: BlockMenuOptions,
  t: UiText = createUiText(),
): Item[][] => {
  const block = topLevelBlockAt(editor, pos)
  const run = (command: WysiwygBlockAction) => () => {
    runWysiwygBlockAction(editor, pos, command)
  }
  const turnInto = (to: WysiwygBlockType, label: string, icon: string): Item => ({
    label,
    icon,
    disabled: !editor.schema.nodes[to.type],
    onSelect: run({ action: 'turnInto', to }),
  })

  const conversions: Item[] = [
    { type: 'label', label: t('jsonformsBuilder.wysiwyg.block.turnInto') },
    turnInto({ type: 'paragraph' }, t('jsonformsBuilder.wysiwyg.paragraph'), 'i-lucide-pilcrow'),
    // Full icon names: the published icon lists are checked against the names written here.
    ...(['i-lucide-heading-1', 'i-lucide-heading-2', 'i-lucide-heading-3'] as const).map(
      (icon, index) =>
        turnInto(
          { type: 'heading', level: (index + 1) as 1 | 2 | 3 },
          t('jsonformsBuilder.wysiwyg.heading', { level: index + 1 }),
          icon,
        ),
    ),
    turnInto({ type: 'bulletList' }, t('jsonformsBuilder.wysiwyg.bulletList'), 'i-lucide-list'),
    turnInto(
      { type: 'orderedList' },
      t('jsonformsBuilder.wysiwyg.orderedList'),
      'i-lucide-list-ordered',
    ),
    ...(features.taskList
      ? [
          turnInto(
            { type: 'taskList' },
            t('jsonformsBuilder.wysiwyg.taskList'),
            'i-lucide-list-checks',
          ),
        ]
      : []),
    turnInto({ type: 'blockquote' }, t('jsonformsBuilder.wysiwyg.blockquote'), 'i-lucide-quote'),
    turnInto(
      { type: 'codeBlock' },
      t('jsonformsBuilder.wysiwyg.codeBlock'),
      'i-lucide-square-code',
    ),
  ]

  return [
    [
      {
        label: t('jsonformsBuilder.wysiwyg.block.turnInto'),
        icon: 'i-lucide-repeat',
        children: conversions,
      },
      {
        label: t('jsonformsBuilder.wysiwyg.block.clearFormatting'),
        icon: 'i-lucide-rotate-ccw',
        onSelect: run({ action: 'clearFormatting' }),
      },
    ],
    [
      {
        label: t('jsonformsBuilder.wysiwyg.block.duplicate'),
        icon: 'i-lucide-copy',
        onSelect: run({ action: 'duplicate' }),
      },
      ...(onCopy
        ? [
            {
              label: t('jsonformsBuilder.wysiwyg.block.copy'),
              icon: 'i-lucide-clipboard',
              onSelect: onCopy,
            },
          ]
        : []),
    ],
    [
      {
        label: t('jsonformsBuilder.wysiwyg.block.moveUp'),
        icon: 'i-lucide-arrow-up',
        disabled: !block || block.index === 0,
        onSelect: run({ action: 'moveUp' }),
      },
      {
        label: t('jsonformsBuilder.wysiwyg.block.moveDown'),
        icon: 'i-lucide-arrow-down',
        disabled: !block || block.index === block.count - 1,
        onSelect: run({ action: 'moveDown' }),
      },
    ],
    [
      {
        label: t('jsonformsBuilder.wysiwyg.block.delete'),
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: run({ action: 'delete' }),
      },
    ],
  ]
}

/**
 * Inserts an empty paragraph after the block at `pos` and puts the cursor in it; with
 * `slash`, the paragraph starts with `/` so the command palette opens (Notion's `+`).
 */
export const insertWysiwygBlockAfter = (editor: Editor, pos: number, slash: boolean): boolean => {
  const { doc } = editor.state
  if (pos < 0 || pos >= doc.content.size) return false
  const node = doc.nodeAt(pos)
  if (!node || doc.resolve(pos).depth !== 0) return false
  const at = pos + node.nodeSize
  return editor
    .chain()
    .focus()
    .insertContentAt(
      at,
      slash ? { type: 'paragraph', content: [{ type: 'text', text: '/' }] } : { type: 'paragraph' },
    )
    .setTextSelection(at + (slash ? 2 : 1))
    .run()
}

/**
 * Start of the top-level block nearest to `clientY` (the block under the pointer, or the
 * closest one when the pointer sits in the gap between two blocks or in the gutter).
 */
export const findWysiwygBlockAt = (view: EditorView, clientY: number): number | null => {
  let best: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  view.state.doc.forEach((_node, offset) => {
    const dom = view.nodeDOM(offset)
    if (dom?.nodeType !== 1) return
    const rect = (dom as HTMLElement).getBoundingClientRect()
    const distance =
      clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0
    if (distance < bestDistance) {
      best = offset
      bestDistance = distance
    }
  })
  return best
}
