import { describe, expect, it } from 'vitest'
import { classes, mergeStyles } from '../../src/theme/util'

describe('classes', () => {
  it('concatenates template literal segments with variables', () => {
    const result = classes`btn ${'btn--primary'} ${false && 'hidden'}`

    expect(result).toBe('btn btn--primary')
  })
})

describe('mergeStyles', () => {
  it('concatenates class strings rather than replacing them', () => {
    const base = {
      control: {
        root: 'mb-4',
        input: 'w-full',
      },
    }

    const override = {
      control: {
        root: 'bg-elevated',
      },
    }

    const merged = mergeStyles(base, override)

    // Deux classes Tailwind qui se rencontrent doivent coexister : un merge classique
    // perdrait `mb-4`, ce qui casserait l'espacement hérité du thème de base.
    expect(merged.control?.root).toBe('mb-4 bg-elevated')
    expect(merged.control?.input).toBe('w-full')
  })

  it('keeps slots present on only one side', () => {
    const base = { verticalLayout: { root: 'grid gap-4' } }
    const override = { verticalLayout: { item: 'min-w-0' } }

    const merged = mergeStyles(base, override)

    expect(merged.verticalLayout?.root).toBe('grid gap-4')
    expect(merged.verticalLayout?.item).toBe('min-w-0')
  })

  it('does not mutate either input', () => {
    const base = { control: { root: 'mb-4' } }
    const override = { control: { input: 'w-full' } }

    mergeStyles(base, override)

    expect((base.control as Record<string, unknown>).input).toBeUndefined()
    expect((override.control as Record<string, unknown>).root).toBeUndefined()
  })
})
