import type { AnyExtension } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import type { ResolvedWysiwygFeatures } from './features'
import { WysiwygSearch } from './search'

/** Names a host extension may already register; the host's version always wins. */
const CONFLICTS: Record<string, string[]> = {
  taskList: ['taskList'],
  taskItem: ['taskItem'],
  textAlign: ['textAlign'],
  textStyle: ['textStyle', 'textStyleKit'],
  color: ['color', 'textStyleKit'],
  highlight: ['highlight'],
  tableKit: ['tableKit', 'table', 'tableRow', 'tableCell', 'tableHeader'],
  wysiwygSearch: ['wysiwygSearch'],
}

/**
 * Built-in feature extensions, minus any whose name the host already provides through
 * `options.extensions` (duplicated keyed ProseMirror plugins would throw).
 */
export const buildWysiwygFeatureExtensions = (
  features: ResolvedWysiwygFeatures,
  hostExtensions: readonly AnyExtension[] = [],
): AnyExtension[] => {
  const taken = new Set(hostExtensions.map((extension) => extension.name))
  const candidates: AnyExtension[] = []

  if (features.taskList) candidates.push(TaskList, TaskItem.configure({ nested: true }))
  if (features.textAlign) candidates.push(TextAlign.configure({ types: ['heading', 'paragraph'] }))
  if (features.textColor || features.highlight) candidates.push(TextStyle)
  if (features.textColor) candidates.push(Color)
  if (features.highlight) candidates.push(Highlight.configure({ multicolor: true }))
  if (features.table) candidates.push(TableKit.configure({ table: { resizable: false } }))
  if (features.findReplace) candidates.push(WysiwygSearch)

  return candidates.filter(
    (extension) => !(CONFLICTS[extension.name] ?? [extension.name]).some((name) => taken.has(name)),
  )
}
