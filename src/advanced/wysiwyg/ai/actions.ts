import { createUiText, type UiText } from '../../../i18n/ui'
import type { WysiwygAiAction, WysiwygAiActionInput, WysiwygAiLabels } from './types'

type ActionDefinition = Omit<WysiwygAiAction, 'id' | 'label'> & {
  id: (typeof DEFAULT_WYSIWYG_AI_ACTION_IDS)[number]
}

/**
 * Built-in actions; each label comes from `jsonformsBuilder.wysiwyg.ai.action.<id>`.
 * Instructions are provider-agnostic: the backend decides the model, the system prompt and
 * how to use them.
 */
const ACTION_DEFINITIONS: readonly ActionDefinition[] = [
  {
    id: 'improve',
    icon: 'i-lucide-wand-sparkles',
    instruction: 'Improve the selected text while preserving its meaning.',
  },
  {
    id: 'fixGrammar',
    icon: 'i-lucide-spell-check',
    instruction: 'Correct spelling, grammar and punctuation without changing meaning.',
  },
  {
    id: 'shorter',
    icon: 'i-lucide-minimize-2',
    instruction: 'Rewrite the text more concisely.',
  },
  {
    id: 'longer',
    icon: 'i-lucide-maximize-2',
    instruction: 'Expand the text while preserving its original intent.',
  },
  {
    id: 'simplify',
    icon: 'i-lucide-baseline',
    instruction: 'Rewrite using simpler and clearer language.',
  },
  {
    id: 'rewrite',
    icon: 'i-lucide-repeat',
    instruction: 'Rephrase the text differently while keeping the same meaning.',
  },
  {
    id: 'professional',
    icon: 'i-lucide-briefcase',
    instruction: 'Rewrite using a professional tone.',
  },
  {
    id: 'summarize',
    icon: 'i-lucide-list-collapse',
    instruction: 'Summarize the text, keeping only the key points.',
  },
  {
    id: 'translate',
    icon: 'i-lucide-languages',
    instruction:
      'Translate the text into the language given in the user instruction, or into English when none is given.',
    promptForInstruction: true,
  },
  {
    id: 'continue',
    icon: 'i-lucide-pen-line',
    mode: 'generate',
    instruction: 'Continue writing from the cursor, matching the style and language of the text.',
  },
  {
    id: 'paragraph',
    icon: 'i-lucide-pilcrow',
    mode: 'generate',
    instruction: 'Write one paragraph about the subject given in the user instruction.',
    promptForInstruction: true,
  },
  {
    id: 'ask',
    icon: 'i-lucide-sparkles',
    mode: 'auto',
    promptForInstruction: true,
  },
]

/** Built-in actions labelled through `t`. */
export const buildWysiwygAiActions = (t: UiText = createUiText()): WysiwygAiAction[] =>
  ACTION_DEFINITIONS.map(({ id, ...action }) => ({
    id,
    label: t(`jsonformsBuilder.wysiwyg.ai.action.${id}`),
    ...action,
  }))

/** `buildWysiwygAiActions()` with the French labels. */
export const DEFAULT_WYSIWYG_AI_ACTIONS: readonly WysiwygAiAction[] = Object.freeze(
  buildWysiwygAiActions(),
)

/** Actions shown when `ai.actions` is omitted. */
export const DEFAULT_WYSIWYG_AI_ACTION_IDS = [
  'improve',
  'fixGrammar',
  'shorter',
  'longer',
  'simplify',
  'rewrite',
  'professional',
  'summarize',
  'translate',
  'continue',
  'paragraph',
  'ask',
] as const

/** Subset exposed in the `/` palette. */
export const DEFAULT_WYSIWYG_AI_SLASH_ACTION_IDS = [
  'ask',
  'continue',
  'paragraph',
  'improve',
  'summarize',
  'translate',
] as const

/** Texts of the AI menu and result panel, through `t`. */
export const buildWysiwygAiLabels = (t: UiText = createUiText()): WysiwygAiLabels => ({
  menu: t('jsonformsBuilder.wysiwyg.ai.menu'),
  ask: t('jsonformsBuilder.wysiwyg.ai.ask'),
  instructionPlaceholder: t('jsonformsBuilder.wysiwyg.ai.instructionPlaceholder'),
  submit: t('jsonformsBuilder.wysiwyg.ai.submit'),
  generating: t('jsonformsBuilder.wysiwyg.ai.generating'),
  done: t('jsonformsBuilder.wysiwyg.ai.done'),
  error: t('jsonformsBuilder.wysiwyg.ai.error'),
  replaceSelection: t('jsonformsBuilder.wysiwyg.ai.replaceSelection'),
  replaceBlock: t('jsonformsBuilder.wysiwyg.ai.replaceBlock'),
  insert: t('jsonformsBuilder.wysiwyg.ai.insert'),
  insertBelow: t('jsonformsBuilder.wysiwyg.ai.insertBelow'),
  apply: t('jsonformsBuilder.wysiwyg.ai.apply'),
  retry: t('jsonformsBuilder.wysiwyg.ai.retry'),
  stop: t('jsonformsBuilder.wysiwyg.ai.stop'),
  discard: t('jsonformsBuilder.wysiwyg.ai.discard'),
  empty: t('jsonformsBuilder.wysiwyg.ai.empty'),
})

/** `buildWysiwygAiLabels()` with the French texts. */
export const DEFAULT_WYSIWYG_AI_LABELS: Readonly<WysiwygAiLabels> = Object.freeze(
  buildWysiwygAiLabels(),
)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Resolves `ai.actions`: string ids map to defaults labelled through `t` (unknown ids are
 * dropped); objects override a default with the same id or add a custom action. Later
 * duplicates win.
 */
export const resolveWysiwygAiActions = (
  input: unknown,
  t: UiText = createUiText(),
): WysiwygAiAction[] => {
  const defaults = new Map(buildWysiwygAiActions(t).map((a) => [a.id, a]))
  const list: unknown[] = Array.isArray(input) ? input : [...DEFAULT_WYSIWYG_AI_ACTION_IDS]
  const resolved = new Map<string, WysiwygAiAction>()

  for (const item of list as WysiwygAiActionInput[]) {
    if (typeof item === 'string') {
      const found = defaults.get(item)
      if (found) resolved.set(found.id, { ...found })
      continue
    }
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id) continue
    const base = defaults.get(item.id)
    resolved.set(item.id, {
      ...base,
      ...item,
      label: typeof item.label === 'string' && item.label ? item.label : (base?.label ?? item.id),
    })
  }

  return [...resolved.values()]
}

/** Actions to list in the `/` palette: defaults subset, plus every custom action. */
export const selectWysiwygAiSlashActions = (actions: WysiwygAiAction[]): WysiwygAiAction[] => {
  const slashIds = new Set<string>(DEFAULT_WYSIWYG_AI_SLASH_ACTION_IDS)
  const defaultIds = new Set<string>(ACTION_DEFINITIONS.map((a) => a.id))
  return actions.filter((a) => slashIds.has(a.id) || !defaultIds.has(a.id))
}
