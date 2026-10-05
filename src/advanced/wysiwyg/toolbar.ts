import { DEFAULT_TOOLBAR } from '../wysiwygToolbar'
import type { WysiwygAiAction } from './ai/types'
import { WYSIWYG_HIGHLIGHT_COLORS, WYSIWYG_TEXT_COLORS } from './colors'
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

export const textColorDropdown = (): Item => ({
  icon: 'i-lucide-baseline',
  'aria-label': 'Couleur du texte',
  tooltip: { text: 'Couleur du texte' },
  items: [
    [{ kind: 'textColor', label: 'Couleur par défaut', icon: 'i-lucide-circle-off' }],
    WYSIWYG_TEXT_COLORS.map((c) => ({
      kind: 'textColor',
      color: c.value,
      label: c.label,
      icon: 'i-lucide-circle',
      ui: { itemLeadingIcon: c.swatch },
    })),
  ],
})

export const highlightDropdown = (): Item => ({
  icon: 'i-lucide-highlighter',
  'aria-label': 'Surlignage',
  tooltip: { text: 'Surlignage' },
  items: [
    [{ kind: 'highlight', label: 'Aucun surlignage', icon: 'i-lucide-circle-off' }],
    WYSIWYG_HIGHLIGHT_COLORS.map((c) => ({
      kind: 'highlight',
      color: c.value,
      label: c.label,
      icon: 'i-lucide-circle',
      ui: { itemLeadingIcon: c.swatch },
    })),
  ],
})

export const aiDropdown = (actions: WysiwygAiAction[], label = 'IA'): Item => ({
  icon: 'i-lucide-sparkles',
  label,
  'aria-label': label,
  tooltip: { text: label },
  items: actions.map((action) => ({
    kind: 'ai',
    action: action.id,
    label: action.label,
    icon: action.icon ?? 'i-lucide-sparkles',
    ...(action.description ? { description: action.description } : {}),
  })),
})

type BuildToolbarOptions = {
  features: ResolvedWysiwygFeatures
  imagesEnabled: boolean
  aiActions?: WysiwygAiAction[]
  aiLabel?: string
}

/**
 * Default toolbar: `DEFAULT_TOOLBAR` adapted to the enabled features, plus color,
 * table, tool (find / source / preview) and AI entries.
 */
export const buildWysiwygToolbar = ({
  features,
  imagesEnabled,
  aiActions = [],
  aiLabel,
}: BuildToolbarOptions): unknown[][] => {
  const groups: Item[][] = DEFAULT_TOOLBAR.map((group) =>
    (group as Item[]).filter((item) => {
      if (item.kind === 'taskList') return features.taskList
      if (item.kind === 'textAlign') return features.textAlign
      if (item.kind === 'imageUpload') return imagesEnabled
      return true
    }),
  )

  const marksIndex = groups.findIndex((group) => group.some((item) => item.kind === 'mark'))
  const colors: Item[] = []
  if (features.textColor) colors.push(textColorDropdown())
  if (features.highlight) colors.push(highlightDropdown())
  if (colors.length) groups.splice(marksIndex + 1, 0, colors)

  if (features.table) {
    const insertGroup = groups.find((group) => group.some((item) => item.kind === 'link'))
    insertGroup?.push(button('table', 'i-lucide-table', 'Insérer un tableau'))
  }

  const tools: Item[] = []
  if (features.findReplace) {
    tools.push(button('findReplace', 'i-lucide-search', 'Rechercher et remplacer'))
  }
  if (features.sourceMode) tools.push(button('sourceMode', 'i-lucide-code-xml', 'Code source'))
  if (features.preview) tools.push(button('preview', 'i-lucide-eye', 'Aperçu'))
  if (tools.length) groups.push(tools)

  if (aiActions.length) groups.push([aiDropdown(aiActions, aiLabel)])

  return groups.filter((group) => group.length > 0)
}

/** Text bubble (non-empty text selection). */
export const buildWysiwygTextBubble = ({
  formatting,
  features,
  aiActions = [],
  aiLabel,
}: {
  formatting: boolean
  features: ResolvedWysiwygFeatures
  aiActions?: WysiwygAiAction[]
  aiLabel?: string
}): unknown[][] => {
  const groups: Item[][] = []
  if (aiActions.length) groups.push([aiDropdown(aiActions, aiLabel)])
  if (formatting) {
    groups.push([
      button('mark', 'i-lucide-bold', 'Gras', { mark: 'bold' }),
      button('mark', 'i-lucide-italic', 'Italique', { mark: 'italic' }),
      button('mark', 'i-lucide-underline', 'Souligné', { mark: 'underline' }),
      button('mark', 'i-lucide-strikethrough', 'Barré', { mark: 'strike' }),
      button('mark', 'i-lucide-code', 'Code', { mark: 'code' }),
    ])
    groups.push([button('link', 'i-lucide-link', 'Lien')])
    const colors: Item[] = []
    if (features.textColor) colors.push(textColorDropdown())
    if (features.highlight) colors.push(highlightDropdown())
    if (colors.length) groups.push(colors)
  }
  return groups
}

const tableButton = (action: WysiwygTableAction, icon: string, label: string) =>
  button('tableAction', icon, label, { action })

/** Table bubble (cursor inside a table). */
export const WYSIWYG_TABLE_BUBBLE: readonly unknown[][] = Object.freeze([
  [
    tableButton('addRowBefore', 'i-lucide-between-horizontal-end', 'Ligne au-dessus'),
    tableButton('addRowAfter', 'i-lucide-between-horizontal-start', 'Ligne en dessous'),
    tableButton('deleteRow', 'i-lucide-trash', 'Supprimer la ligne'),
  ],
  [
    tableButton('addColumnBefore', 'i-lucide-between-vertical-end', 'Colonne à gauche'),
    tableButton('addColumnAfter', 'i-lucide-between-vertical-start', 'Colonne à droite'),
    tableButton('deleteColumn', 'i-lucide-trash-2', 'Supprimer la colonne'),
  ],
  [
    tableButton('mergeOrSplit', 'i-lucide-table-cells-merge', 'Fusionner / scinder'),
    tableButton('toggleHeaderRow', 'i-lucide-panel-top', 'Ligne d’en-tête'),
    tableButton('toggleHeaderColumn', 'i-lucide-panel-left', 'Colonne d’en-tête'),
  ],
  [tableButton('deleteTable', 'i-lucide-grid-2x2-x', 'Supprimer le tableau')],
])
