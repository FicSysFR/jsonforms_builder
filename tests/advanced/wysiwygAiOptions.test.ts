import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_WYSIWYG_AI_ACTIONS,
  DEFAULT_WYSIWYG_AI_ACTION_IDS,
  DEFAULT_WYSIWYG_AI_LABELS,
  resolveWysiwygAiActions,
  selectWysiwygAiSlashActions,
} from '../../src/advanced/wysiwyg/ai/actions'
import { DISABLED_WYSIWYG_AI, resolveWysiwygAiOptions } from '../../src/advanced/wysiwyg/ai/options'
import { resolveWysiwygOptions } from '../../src/advanced/wysiwygOptions'

const transport = { generate: vi.fn() }

describe('resolveWysiwygAiActions', () => {
  it('defaults to every built-in action, in order', () => {
    expect(resolveWysiwygAiActions(undefined).map((a) => a.id)).toEqual([
      ...DEFAULT_WYSIWYG_AI_ACTION_IDS,
    ])
  })

  it('maps ids, overrides defaults and adds custom actions', () => {
    const actions = resolveWysiwygAiActions([
      'improve',
      'unknown',
      { id: 'shorter', label: 'Plus court' },
      { id: 'professional', label: 'Professional tone', instruction: 'Rewrite formally.' },
      { id: 'legal', label: '', instruction: 'Use legal wording.' },
      { label: 'missing id' },
      42,
    ])
    expect(actions.map((a) => a.id)).toEqual(['improve', 'shorter', 'professional', 'legal'])
    expect(actions[1]).toMatchObject({
      label: 'Plus court',
      instruction: 'Rewrite the text more concisely.',
    })
    expect(actions[2]?.instruction).toBe('Rewrite formally.')
    expect(actions[3]?.label).toBe('legal')
  })

  it('keeps default slash actions plus every custom one', () => {
    const actions = resolveWysiwygAiActions([
      'improve',
      'fixGrammar',
      'ask',
      { id: 'custom', label: 'C' },
    ])
    expect(selectWysiwygAiSlashActions(actions).map((a) => a.id)).toEqual([
      'improve',
      'ask',
      'custom',
    ])
  })

  it('ships provider-agnostic defaults', () => {
    for (const action of DEFAULT_WYSIWYG_AI_ACTIONS) {
      expect(action.instruction ?? '').not.toMatch(/openai|gpt|claude|anthropic|gemini/i)
    }
    expect(Object.isFrozen(DEFAULT_WYSIWYG_AI_ACTIONS)).toBe(true)
  })
})

describe('resolveWysiwygAiOptions', () => {
  it('stays inert unless enabled with a transport or endpoint', () => {
    expect(resolveWysiwygAiOptions(undefined)).toBe(DISABLED_WYSIWYG_AI)
    expect(resolveWysiwygAiOptions({ endpoint: '/ai' })).toBe(DISABLED_WYSIWYG_AI)
    expect(resolveWysiwygAiOptions({ enabled: 'true', endpoint: '/ai' })).toBe(DISABLED_WYSIWYG_AI)
    expect(resolveWysiwygAiOptions({ enabled: true })).toBe(DISABLED_WYSIWYG_AI)
    expect(resolveWysiwygAiOptions({ enabled: true, transport: {} })).toBe(DISABLED_WYSIWYG_AI)
  })

  it('creates the HTTP transport from an endpoint without calling it', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    try {
      const resolved = resolveWysiwygAiOptions({ enabled: true, endpoint: '/api/ai/editor' })
      expect(resolved.enabled).toBe(true)
      expect(typeof resolved.transport?.stream).toBe('function')
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('prefers a custom transport and applies defaults', () => {
    const resolved = resolveWysiwygAiOptions({ enabled: true, endpoint: '/x', transport })
    expect(resolved).toMatchObject({
      enabled: true,
      transport,
      bubbleMenu: true,
      slashCommands: true,
      stream: true,
      maxContextCharacters: 12000,
      includeHtml: false,
      includeJson: false,
      format: 'text',
      labels: DEFAULT_WYSIWYG_AI_LABELS,
    })
    expect(resolved.metadata).toBeUndefined()
  })

  it('honours explicit settings', () => {
    const resolved = resolveWysiwygAiOptions({
      enabled: true,
      transport,
      actions: ['summarize'],
      bubbleMenu: false,
      slashCommands: false,
      stream: false,
      maxContextCharacters: 500,
      includeHtml: true,
      includeJson: true,
      format: 'html',
      body: { locale: 'fr' },
      labels: { menu: 'Assistant' },
    })
    expect(resolved).toMatchObject({
      bubbleMenu: false,
      slashCommands: false,
      stream: false,
      maxContextCharacters: 500,
      includeHtml: true,
      includeJson: true,
      format: 'html',
      metadata: { locale: 'fr' },
    })
    expect(resolved.actions.map((a) => a.id)).toEqual(['summarize'])
    expect(resolved.labels.menu).toBe('Assistant')
    expect(resolved.labels.stop).toBe(DEFAULT_WYSIWYG_AI_LABELS.stop)
    expect(
      resolveWysiwygAiOptions({ enabled: true, transport, maxContextCharacters: -1 })
        .maxContextCharacters,
    ).toBe(12000)
  })
})

describe('resolveWysiwygOptions with AI and features', () => {
  it('keeps `{ wysiwyg: true }` valid with AI off and menus opt-in', () => {
    const resolved = resolveWysiwygOptions({ wysiwyg: true }, 'string')
    expect(resolved.ai.enabled).toBe(false)
    expect(resolved.bubbleMenu).toBe(false)
    expect(resolved.slashCommands).toBe(false)
    expect(resolved.features.table).toBe(true)
    const toolbar = resolved.toolbar as Array<Array<Record<string, unknown>>>
    expect(JSON.stringify(toolbar)).not.toContain('"kind":"ai"')
  })

  it('adds the AI dropdown to the default toolbar when enabled', () => {
    const resolved = resolveWysiwygOptions(
      { ai: { enabled: true, transport, actions: ['improve'] } },
      'object',
    )
    const last = (resolved.toolbar as Array<Array<Record<string, unknown>>>).at(-1)
    expect(last?.[0]).toMatchObject({
      icon: 'i-lucide-sparkles',
      items: [{ kind: 'ai', action: 'improve' }],
    })
  })

  it('never alters a custom toolbar', () => {
    const toolbar = [[{ kind: 'undo' }]]
    expect(
      resolveWysiwygOptions({ toolbar, ai: { enabled: true, transport } }, 'object').toolbar,
    ).toBe(toolbar)
  })

  it('reads menu flags strictly', () => {
    expect(
      resolveWysiwygOptions({ bubbleMenu: true, slashCommands: 'yes' }, 'object'),
    ).toMatchObject({ bubbleMenu: true, slashCommands: false })
  })
})
