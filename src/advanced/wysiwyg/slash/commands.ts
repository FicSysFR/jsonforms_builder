import { createUiText, type UiText } from '../../../i18n/ui'
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

/**
 * Items for Nuxt UI `UEditorSuggestionMenu`, grouped (one array per group) and labelled
 * through `t`.
 */
export const buildWysiwygSlashItems = (
  { formatting, features, imagesEnabled, aiActions = [], aiLabel }: BuildSlashOptions,
  t: UiText = createUiText(),
): Item[][] => {
  const groups: Item[][] = []

  if (aiActions.length) {
    groups.push([
      { type: 'label', label: aiLabel ?? t('jsonformsBuilder.wysiwyg.ai.menu') },
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
    const heading = (level: number, icon: string): Item => ({
      kind: 'heading',
      level,
      label: t('jsonformsBuilder.wysiwyg.heading', { level }),
      icon,
    })
    groups.push([
      { type: 'label', label: t('jsonformsBuilder.wysiwyg.slash.text') },
      {
        kind: 'paragraph',
        label: t('jsonformsBuilder.wysiwyg.paragraph'),
        icon: 'i-lucide-pilcrow',
      },
      heading(1, 'i-lucide-heading-1'),
      heading(2, 'i-lucide-heading-2'),
      heading(3, 'i-lucide-heading-3'),
    ])

    const lists: Item[] = [
      { type: 'label', label: t('jsonformsBuilder.wysiwyg.slash.lists') },
      {
        kind: 'bulletList',
        label: t('jsonformsBuilder.wysiwyg.bulletList'),
        icon: 'i-lucide-list',
      },
      {
        kind: 'orderedList',
        label: t('jsonformsBuilder.wysiwyg.orderedList'),
        icon: 'i-lucide-list-ordered',
      },
    ]
    if (features.taskList) {
      lists.push({
        kind: 'taskList',
        label: t('jsonformsBuilder.wysiwyg.taskList'),
        icon: 'i-lucide-list-checks',
      })
    }
    groups.push(lists)

    const blocks: Item[] = [
      { type: 'label', label: t('jsonformsBuilder.wysiwyg.slash.insert') },
      {
        kind: 'blockquote',
        label: t('jsonformsBuilder.wysiwyg.blockquote'),
        icon: 'i-lucide-quote',
      },
      {
        kind: 'codeBlock',
        label: t('jsonformsBuilder.wysiwyg.codeBlock'),
        icon: 'i-lucide-square-code',
      },
      {
        kind: 'horizontalRule',
        label: t('jsonformsBuilder.wysiwyg.horizontalRule'),
        icon: 'i-lucide-minus',
      },
    ]
    if (features.table) {
      blocks.push({
        kind: 'table',
        label: t('jsonformsBuilder.wysiwyg.slash.table'),
        icon: 'i-lucide-table',
      })
    }
    if (imagesEnabled) {
      blocks.push({
        kind: 'imageUpload',
        label: t('jsonformsBuilder.wysiwyg.image'),
        icon: 'i-lucide-image',
      })
    }
    groups.push(blocks)
  }

  return groups
}
