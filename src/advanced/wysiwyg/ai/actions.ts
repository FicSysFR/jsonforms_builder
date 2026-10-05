import type { WysiwygAiAction, WysiwygAiActionInput, WysiwygAiLabels } from './types'

/**
 * Built-in actions. Instructions are provider-agnostic: the backend decides the model,
 * the system prompt and how to use them.
 */
export const DEFAULT_WYSIWYG_AI_ACTIONS: readonly WysiwygAiAction[] = Object.freeze([
  {
    id: 'improve',
    label: 'Améliorer la rédaction',
    icon: 'i-lucide-wand-sparkles',
    instruction: 'Improve the selected text while preserving its meaning.',
  },
  {
    id: 'fixGrammar',
    label: 'Corriger orthographe et grammaire',
    icon: 'i-lucide-spell-check',
    instruction: 'Correct spelling, grammar and punctuation without changing meaning.',
  },
  {
    id: 'shorter',
    label: 'Raccourcir',
    icon: 'i-lucide-minimize-2',
    instruction: 'Rewrite the text more concisely.',
  },
  {
    id: 'longer',
    label: 'Développer',
    icon: 'i-lucide-maximize-2',
    instruction: 'Expand the text while preserving its original intent.',
  },
  {
    id: 'simplify',
    label: 'Simplifier',
    icon: 'i-lucide-baseline',
    instruction: 'Rewrite using simpler and clearer language.',
  },
  {
    id: 'rewrite',
    label: 'Reformuler',
    icon: 'i-lucide-repeat',
    instruction: 'Rephrase the text differently while keeping the same meaning.',
  },
  {
    id: 'professional',
    label: 'Ton professionnel',
    icon: 'i-lucide-briefcase',
    instruction: 'Rewrite using a professional tone.',
  },
  {
    id: 'summarize',
    label: 'Résumer',
    icon: 'i-lucide-list-collapse',
    instruction: 'Summarize the text, keeping only the key points.',
  },
  {
    id: 'translate',
    label: 'Traduire',
    icon: 'i-lucide-languages',
    instruction:
      'Translate the text into the language given in the user instruction, or into English when none is given.',
    promptForInstruction: true,
  },
  {
    id: 'continue',
    label: 'Continuer la rédaction',
    icon: 'i-lucide-pen-line',
    mode: 'generate',
    instruction: 'Continue writing from the cursor, matching the style and language of the text.',
  },
  {
    id: 'paragraph',
    label: 'Générer un paragraphe',
    icon: 'i-lucide-pilcrow',
    mode: 'generate',
    instruction: 'Write one paragraph about the subject given in the user instruction.',
    promptForInstruction: true,
  },
  {
    id: 'ask',
    label: 'Demander à l’IA',
    icon: 'i-lucide-sparkles',
    mode: 'auto',
    promptForInstruction: true,
  },
])

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

export const DEFAULT_WYSIWYG_AI_LABELS: Readonly<WysiwygAiLabels> = Object.freeze({
  menu: 'IA',
  ask: 'Demander à l’IA',
  instructionPlaceholder: 'Décrivez ce que l’IA doit faire…',
  submit: 'Envoyer',
  generating: 'Génération…',
  done: 'Proposition prête',
  error: 'La génération a échoué',
  replaceSelection: 'Remplacer la sélection',
  replaceBlock: 'Remplacer le bloc',
  insert: 'Insérer',
  insertBelow: 'Insérer en dessous',
  apply: 'Appliquer',
  retry: 'Réessayer',
  stop: 'Arrêter',
  discard: 'Ignorer',
  empty: 'Aucun contenu proposé.',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Resolves `ai.actions`: string ids map to defaults (unknown ids are dropped); objects
 * override a default with the same id or add a custom action. Later duplicates win.
 */
export const resolveWysiwygAiActions = (input: unknown): WysiwygAiAction[] => {
  const defaults = new Map(DEFAULT_WYSIWYG_AI_ACTIONS.map((a) => [a.id, a]))
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
  const defaultIds = new Set(DEFAULT_WYSIWYG_AI_ACTIONS.map((a) => a.id))
  return actions.filter((a) => slashIds.has(a.id) || !defaultIds.has(a.id))
}
