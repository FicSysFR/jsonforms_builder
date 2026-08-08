import { describe, expect, it } from 'vitest'
import {
  PALETTE_CONTAINERS,
  PALETTE_FIELDS,
  createControl,
  findPaletteContainer,
  findPaletteField,
} from '../../src/builder/palette'

describe('PALETTE_FIELDS', () => {
  it('a des clés uniques', () => {
    const keys = PALETTE_FIELDS.map((field) => field.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('couvre les groupes attendus', () => {
    const groups = new Set(PALETTE_FIELDS.map((field) => field.group))
    expect(groups).toEqual(new Set(['Saisie', 'Choix', 'Date & heure', 'Structure']))
  })

  it('produit un schéma valide pour chaque entrée', () => {
    for (const field of PALETTE_FIELDS) {
      const schema = field.schema()
      expect(schema).toBeTypeOf('object')
      expect(schema.type ?? schema.enum ?? schema.allOf ?? schema.oneOf ?? schema.anyOf).toBeDefined()
    }
  })

  it('ne partage pas d’objet schéma entre deux appels', () => {
    const field = findPaletteField('enum')!
    const a = field.schema()
    const b = field.schema()

    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('PALETTE_CONTAINERS', () => {
  it('a des clés uniques', () => {
    const keys = PALETTE_CONTAINERS.map((container) => container.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('crée des éléments avec le type attendu', () => {
    for (const container of PALETTE_CONTAINERS) {
      const created = container.create()
      expect(created.type).toBe(container.key === 'Label' ? 'Label' : container.key)
    }
  })

  it('prépare Categorization avec deux onglets vides', () => {
    const created = findPaletteContainer('Categorization')!.create() as {
      elements: Array<{ type: string; elements: unknown[] }>
    }

    expect(created.elements).toHaveLength(2)
    expect(created.elements.every((tab) => tab.type === 'Category')).toBe(true)
    expect(created.elements.every((tab) => tab.elements.length === 0)).toBe(true)
  })
})

describe('findPaletteField / findPaletteContainer', () => {
  it('retrouve une entrée connue', () => {
    expect(findPaletteField('textarea')?.options?.()).toEqual({ multi: true })
    expect(findPaletteContainer('Group')?.label).toBe('Groupe')
  })

  it('renvoie undefined pour une clé inconnue', () => {
    expect(findPaletteField('nope')).toBeUndefined()
    expect(findPaletteContainer('nope')).toBeUndefined()
  })
})

describe('createControl', () => {
  it('pointe le scope racine de la propriété', () => {
    expect(createControl('prenom')).toEqual({
      type: 'Control',
      scope: '#/properties/prenom',
    })
  })

  it('n’ajoute options que si non vides', () => {
    expect(createControl('x', {})).not.toHaveProperty('options')
    expect(createControl('x', { multi: true }).options).toEqual({ multi: true })
  })
})
