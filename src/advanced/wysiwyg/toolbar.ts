import { createUiText, type UiText } from '../../i18n/ui'
import { buildDefaultWysiwygToolbar } from '../wysiwygToolbar'
import type { WysiwygAiAction } from './ai/types'
import { buildWysiwygHighlightColors, buildWysiwygTextColors } from './colors'
import type { ResolvedWysiwygFeatures } from './features'
import type { WysiwygTableAction } from './handlers'

type Item = Record<string, unknown>

const button = (kind: string, icon: string, label: string, extra: Item = {}): Item => ({
  kind,
  icon,
  'aria-label': label,
  tooltip: { text: label },
  ...extra,
})

export const textColorDropdown = (t: UiText = createUiText()): Item => ({
  icon: 'i-lucide-baseline',
  'aria-label': t('jsonformsBuilder.wysiwyg.textColor'),
  tooltip: { text: t('jsonformsBuilder.wysiwyg.textColor') },
  items: [
    [
      {
        kind: 'textColor',
        label: t('jsonformsBuilder.wysiwyg.defaultTextColor'),
        icon: 'i-lucide-circle-off',
      },
    ],
    buildWysiwygTextColors(t).map((c) => ({
      kind: 'textColor',
      color: c.value,
      label: c.label,
      icon: 'i-lucide-circle',
      ui: { itemLeadingIcon: c.swatch },
    })),
  ],
})

export const highlightDropdown = (t: UiText = createUiText()): Item => ({
  icon: 'i-lucide-highlighter',
  'aria-label': t('jsonformsBuilder.wysiwyg.highlight'),
  tooltip: { text: t('jsonformsBuilder.wysiwyg.highlight') },
  items: [
    [
      {
        kind: 'highlight',
        label: t('jsonformsBuilder.wysiwyg.noHighlight'),
        icon: 'i-lucide-circle-off',
      },
    ],
    buildWysiwygHighlightColors(t).map((c) => ({
      kind: 'highlight',
      color: c.value,
      label: c.label,
      icon: 'i-lucide-circle',
      ui: { itemLeadingIcon: c.swatch },
    })),
  ],
})

export const aiDropdown = (
  actions: WysiwygAiAction[],
  label?: string,
  t: UiText = createUiText(),
): Item => {
  const text = label ?? t('jsonformsBuilder.wysiwyg.ai.menu')
  return {
    icon: 'i-lucide-sparkles',
    label: text,
    'aria-label': text,
    tooltip: { text },
    items: actions.map((action) => ({
      kind: 'ai',
      action: action.id,
      label: action.label,
      icon: action.icon ?? 'i-lucide-sparkles',
      ...(action.description ? { description: action.description } : {}),
    })),
  }
}

type BuildToolbarOptions = {
  features: ResolvedWysiwygFeatures
  imagesEnabled: boolean
  aiActions?: WysiwygAiAction[]
  aiLabel?: string
}

/**
 * Default toolbar: `DEFAULT_TOOLBAR` adapted to the enabled features, plus color,
 * table, tool (find / source / preview) and AI entries, labelled through `t`.
 */
export const buildWysiwygToolbar = (
  { features, imagesEnabled, aiActions = [], aiLabel }: BuildToolbarOptions,
  t: UiText = createUiText(),
): unknown[][] => {
  const groups: Item[][] = buildDefaultWysiwygToolbar(t).map((group) =>
    (group as Item[]).filter((item) => {
      if (item.kind === 'taskList') return features.taskList
      if (item.kind === 'textAlign') return features.textAlign
      if (item.kind === 'imageUpload') return imagesEnabled
      return true
    }),
  )

  const marksIndex = groups.findIndex((group) => group.some((item) => item.kind === 'mark'))
  const colors: Item[] = []
  if (features.textColor) colors.push(textColorDropdown(t))
  if (features.highlight) colors.push(highlightDropdown(t))
  if (colors.length) groups.splice(marksIndex + 1, 0, colors)

  if (features.table) {
    const insertGroup = groups.find((group) => group.some((item) => item.kind === 'link'))
    insertGroup?.push(button('table', 'i-lucide-table', t('jsonformsBuilder.wysiwyg.insertTable')))
  }

  const tools: Item[] = []
  if (features.findReplace) {
    tools.push(button('findReplace', 'i-lucide-search', t('jsonformsBuilder.wysiwyg.findReplace')))
  }
  if (features.sourceMode) {
    tools.push(button('sourceMode', 'i-lucide-code-xml', t('jsonformsBuilder.wysiwyg.sourceMode')))
  }
  if (features.preview) {
    tools.push(button('preview', 'i-lucide-eye', t('jsonformsBuilder.wysiwyg.preview')))
  }
  if (tools.length) groups.push(tools)

  if (aiActions.length) groups.push([aiDropdown(aiActions, aiLabel, t)])

  return groups.filter((group) => group.length > 0)
}

/** Text bubble (non-empty text selection), labelled through `t`. */
export const buildWysiwygTextBubble = (
  {
    formatting,
    features,
    aiActions = [],
    aiLabel,
  }: {
    formatting: boolean
    features: ResolvedWysiwygFeatures
    aiActions?: WysiwygAiAction[]
    aiLabel?: string
  },
  t: UiText = createUiText(),
): unknown[][] => {
  const groups: Item[][] = []
  if (aiActions.length) groups.push([aiDropdown(aiActions, aiLabel, t)])
  if (formatting) {
    groups.push([
      button('mark', 'i-lucide-bold', t('jsonformsBuilder.wysiwyg.bold'), { mark: 'bold' }),
      button('mark', 'i-lucide-italic', t('jsonformsBuilder.wysiwyg.italic'), { mark: 'italic' }),
      button('mark', 'i-lucide-underline', t('jsonformsBuilder.wysiwyg.underline'), {
        mark: 'underline',
      }),
      button('mark', 'i-lucide-strikethrough', t('jsonformsBuilder.wysiwyg.strike'), {
        mark: 'strike',
      }),
      button('mark', 'i-lucide-code', t('jsonformsBuilder.wysiwyg.code'), { mark: 'code' }),
    ])
    groups.push([button('link', 'i-lucide-link', t('jsonformsBuilder.wysiwyg.link'))])
    const colors: Item[] = []
    if (features.textColor) colors.push(textColorDropdown(t))
    if (features.highlight) colors.push(highlightDropdown(t))
    if (colors.length) groups.push(colors)
  }
  return groups
}

/** Table bubble (cursor inside a table), labelled through `t`. */
export const buildWysiwygTableBubble = (t: UiText = createUiText()): unknown[][] => {
  const tableButton = (action: WysiwygTableAction, icon: string) =>
    button('tableAction', icon, t(`jsonformsBuilder.wysiwyg.table.${action}`), { action })
  return [
    [
      tableButton('addRowBefore', 'i-lucide-between-horizontal-end'),
      tableButton('addRowAfter', 'i-lucide-between-horizontal-start'),
      tableButton('deleteRow', 'i-lucide-trash'),
    ],
    [
      tableButton('addColumnBefore', 'i-lucide-between-vertical-end'),
      tableButton('addColumnAfter', 'i-lucide-between-vertical-start'),
      tableButton('deleteColumn', 'i-lucide-trash-2'),
    ],
    [
      tableButton('mergeOrSplit', 'i-lucide-table-cells-merge'),
      tableButton('toggleHeaderRow', 'i-lucide-panel-top'),
      tableButton('toggleHeaderColumn', 'i-lucide-panel-left'),
    ],
    [tableButton('deleteTable', 'i-lucide-grid-2x2-x')],
  ]
}

/** `buildWysiwygTableBubble()` with the French labels. */
export const WYSIWYG_TABLE_BUBBLE: readonly unknown[][] = Object.freeze(buildWysiwygTableBubble())
