import { describe, expect, it } from 'vitest'
import {
  PALETTE_CONTAINERS,
  PALETTE_FIELDS,
  createControl,
  findPaletteContainer,
  findPaletteField,
} from '../../src/builder/palette'

describe('PALETTE_FIELDS', () => {
  it('has unique keys', () => {
    const keys = PALETTE_FIELDS.map((field) => field.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('covers the expected groups', () => {
    const groups = new Set(PALETTE_FIELDS.map((field) => field.group))
    expect(groups).toEqual(new Set(['Saisie', 'Choix', 'Date & heure', 'Structure']))
  })

  it('produces a valid schema for each entry', () => {
    for (const field of PALETTE_FIELDS) {
      const schema = field.schema()
      expect(schema).toBeTypeOf('object')
      expect(schema.type ?? schema.enum ?? schema.allOf ?? schema.oneOf ?? schema.anyOf).toBeDefined()
    }
  })

  it('does not share a schema object across two calls', () => {
    const field = findPaletteField('enum')!
    const a = field.schema()
    const b = field.schema()

    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('PALETTE_CONTAINERS', () => {
  it('has unique keys', () => {
    const keys = PALETTE_CONTAINERS.map((container) => container.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('creates elements with the expected type', () => {
    for (const container of PALETTE_CONTAINERS) {
      const created = container.create()
      expect(created.type).toBe(container.key === 'Label' ? 'Label' : container.key)
    }
  })

  it('prepares Categorization with two empty tabs', () => {
    const created = findPaletteContainer('Categorization')!.create() as {
      elements: Array<{ type: string; elements: unknown[] }>
    }

    expect(created.elements).toHaveLength(2)
    expect(created.elements.every((tab) => tab.type === 'Category')).toBe(true)
    expect(created.elements.every((tab) => tab.elements.length === 0)).toBe(true)
  })
})

describe('findPaletteField / findPaletteContainer', () => {
  it('finds a known entry', () => {
    expect(findPaletteField('textarea')?.options?.()).toEqual({ multi: true })
    expect(findPaletteContainer('Group')?.label).toBe('Groupe')
  })

  it('returns undefined for an unknown key', () => {
    expect(findPaletteField('nope')).toBeUndefined()
    expect(findPaletteContainer('nope')).toBeUndefined()
  })
})

describe('createControl', () => {
  it('points at the root property scope', () => {
    expect(createControl('prenom')).toEqual({
      type: 'Control',
      scope: '#/properties/prenom',
    })
  })

  it('adds options only when non-empty', () => {
    expect(createControl('x', {})).not.toHaveProperty('options')
    expect(createControl('x', { multi: true }).options).toEqual({ multi: true })
  })
})
