import type { WysiwygAiAction } from '../ai/types'
import type { ResolvedWysiwygFeatures } from '../features'

type Item = Record<string, unknown>

/** Fields the `/` palette filters on — `keywords` lets `/ai` match every AI entry. */
export const WYSIWYG_SLASH_FILTER_FIELDS = ['label', 'description', 'keywords']

type BuildSlashOptions = {
  formatting: boolean
  features: ResolvedWysiwygFeatures
  imagesEnabled: boolean
  aiActions?: WysiwygAiAction[]
  aiLabel?: string
}

/** Items for Nuxt UI `UEditorSuggestionMenu`, grouped (one array per group). */
export const buildWysiwygSlashItems = ({
  formatting,
  features,
  imagesEnabled,
  aiActions = [],
  aiLabel = 'IA',
}: BuildSlashOptions): Item[][] => {
  const groups: Item[][] = []

  if (aiActions.length) {
    groups.push([
      { type: 'label', label: aiLabel },
      ...aiActions.map((action) => ({
        kind: 'ai',
        action: action.id,
        label: action.label,
        icon: action.icon ?? 'i-lucide-sparkles',
        description: action.description,
        keywords: 'ai ia assistant',
      })),
    ])
  }

  if (formatting) {
    groups.push([
      { type: 'label', label: 'Texte' },
      { kind: 'paragraph', label: 'Paragraphe', icon: 'i-lucide-pilcrow' },
      { kind: 'heading', level: 1, label: 'Titre 1', icon: 'i-lucide-heading-1' },
      { kind: 'heading', level: 2, label: 'Titre 2', icon: 'i-lucide-heading-2' },
      { kind: 'heading', level: 3, label: 'Titre 3', icon: 'i-lucide-heading-3' },
    ])

    const lists: Item[] = [
      { type: 'label', label: 'Listes' },
      { kind: 'bulletList', label: 'Liste à puces', icon: 'i-lucide-list' },
      { kind: 'orderedList', label: 'Liste numérotée', icon: 'i-lucide-list-ordered' },
    ]
    if (features.taskList) {
      lists.push({ kind: 'taskList', label: 'Liste de tâches', icon: 'i-lucide-list-checks' })
    }
    groups.push(lists)

    const blocks: Item[] = [
      { type: 'label', label: 'Insérer' },
      { kind: 'blockquote', label: 'Citation', icon: 'i-lucide-quote' },
      { kind: 'codeBlock', label: 'Bloc de code', icon: 'i-lucide-square-code' },
      { kind: 'horizontalRule', label: 'Filet horizontal', icon: 'i-lucide-minus' },
    ]
    if (features.table) blocks.push({ kind: 'table', label: 'Tableau', icon: 'i-lucide-table' })
    if (imagesEnabled) blocks.push({ kind: 'imageUpload', label: 'Image', icon: 'i-lucide-image' })
    groups.push(blocks)
  }

  return groups
}
