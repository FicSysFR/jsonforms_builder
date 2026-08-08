import { describe, expect, it } from 'vitest'
import { classes, mergeStyles } from '../../src/theme/util'

describe('classes', () => {
  it('concatenates template literal segments with variables', () => {
    const result = classes`btn ${'btn--primary'} ${false && 'hidden'}`

    expect(result).toBe('btn btn--primary')
  })

  it('ignore null et undefined comme interpolations', () => {
    expect(classes`a ${null} b ${undefined} c`).toBe('a  b  c')
  })

  it('stringify les valeurs truthy non-string', () => {
    expect(classes`n-${2} ok-${true}`).toBe('n-2 ok-true')
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

  it('remplace une valeur non-objet par l’override', () => {
    const merged = mergeStyles(
      { control: { root: 'mb-4' } },
      { control: { root: { nested: 'x' } as unknown as string } },
    )

    expect(merged.control?.root).toEqual({ nested: 'x' })
  })

  it('conserve la base quand l’override est undefined en profondeur', () => {
    const merged = mergeStyles(
      { control: { root: 'keep', input: 'a' } },
      { control: { root: undefined as unknown as string } },
    )

    expect(merged.control?.root).toBe('keep')
    expect(merged.control?.input).toBe('a')
  })
})
