import { describe, expect, it } from 'vitest'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import {
  addSchemaProperty,
  cloneJson,
  getElementAt,
  insertElementAt,
  moveElement,
  removeElementAt,
  shiftElement,
} from '../../src/builder/tree'
import {
  collectReferencedProperties,
  createEmptyDefinition,
  listPropertyNames,
  useFormBuilder,
} from '../../src/builder/useFormBuilder'
import { findPaletteField, PALETTE_FIELDS } from '../../src/builder/palette'
import { expectWithinBudget, measure } from './helpers'

/**
 * Performances du FormBuilder : mutations d'arbre, historique undo, palette.
 * Correspond au mode `builder` de la page playground.
 */

const buildLargeBuilderTree = (count: number): UISchemaElement => {
  let root = {
    type: 'VerticalLayout',
    elements: [] as UISchemaElement[],
  } as UISchemaElement

  for (let i = 0; i < count; i++) {
    root = insertElementAt(root, [], i, {
      type: 'Control',
      scope: `#/properties/field_${i}`,
      label: `Champ ${i}`,
    } as UISchemaElement)
  }

  return root
}

describe('page builder — performances composants', () => {
  it('insère massivement des contrôles dans l’arbre uischema', () => {
    const result = measure(() => {
      const root = buildLargeBuilderTree(200)
      expect((root as { elements: unknown[] }).elements).toHaveLength(200)
      expect((getElementAt(root, [199]) as { scope?: string })?.scope).toBe(
        '#/properties/field_199',
      )
    })

    expectWithinBudget('insertElementAt × 200', result, 120)
  })

  it('déplace et décale des nœuds dans un arbre large', () => {
    const base = buildLargeBuilderTree(120)

    const result = measure(() => {
      let tree = cloneJson(base)
      for (let i = 0; i < 40; i++) {
        tree = shiftElement(tree, [i], 1)
      }
      for (let i = 0; i < 20; i++) {
        tree = moveElement(tree, [0], [], (tree as { elements: unknown[] }).elements.length)
      }
      expect((tree as { elements: unknown[] }).elements.length).toBe(120)
    })

    expectWithinBudget('shift + move sur 120 nœuds', result, 150)
  })

  it('clone profondément schéma + uischema (commit historique)', () => {
    const properties: Record<string, { type: string }> = {}
    const elements: UISchemaElement[] = []
    for (let i = 0; i < 250; i++) {
      properties[`field_${i}`] = { type: 'string' }
      elements.push({ type: 'Control', scope: `#/properties/field_${i}` } as UISchemaElement)
    }
    const definition = {
      schema: { type: 'object' as const, properties },
      uischema: { type: 'VerticalLayout' as const, elements },
    }

    const result = measure(() => {
      const snapshots = []
      for (let i = 0; i < 30; i++) {
        snapshots.push(cloneJson(definition))
      }
      expect(snapshots).toHaveLength(30)
      expect(Object.keys(snapshots[29].schema.properties ?? {})).toHaveLength(250)
    })

    expectWithinBudget('cloneJson historique × 30', result, 100)
  })

  it('enchaîne ajouts palette via useFormBuilder (undo inclus)', () => {
    const textField = findPaletteField('text')
    expect(textField).toBeTruthy()

    const result = measure(
      () => {
        const builder = useFormBuilder(createEmptyDefinition())

        for (let i = 0; i < 80; i++) {
          const length = (builder.definition.value.uischema as { elements?: unknown[] })
            .elements?.length ?? 0
          builder.addField('text', [], length)
        }

        expect(listPropertyNames(builder.definition.value.schema).length).toBe(80)

        for (let i = 0; i < 20; i++) {
          builder.undo()
        }
        expect(listPropertyNames(builder.definition.value.schema).length).toBe(60)
      },
      { iterations: 3, warmup: 1 },
    )

    expectWithinBudget('useFormBuilder 80 ajouts + 20 undo', result, 250)
  })

  it('collecte les propriétés référencées sur un grand formulaire', () => {
    const elements = Array.from({ length: 300 }, (_, i) => ({
      type: 'Control' as const,
      scope: `#/properties/field_${i}`,
    })) as UISchemaElement[]
    const uischema = { type: 'VerticalLayout', elements } as UISchemaElement

    const result = measure(() => {
      const refs = collectReferencedProperties(uischema)
      expect(refs).toHaveLength(300)
      expect(new Set(refs).size).toBe(300)
    })

    expectWithinBudget('collectReferencedProperties × 300', result, 30)
  })

  it('enrichit le schéma propriété par propriété', () => {
    const result = measure(() => {
      let schema: JsonSchema = { type: 'object', properties: {} }
      for (const field of PALETTE_FIELDS) {
        for (let i = 0; i < 10; i++) {
          schema = addSchemaProperty(schema, `${field.key}_${i}`, field.schema() as any)
        }
      }
      expect(Object.keys(schema.properties ?? {}).length).toBe(PALETTE_FIELDS.length * 10)
    })

    expectWithinBudget('addSchemaProperty palette × 10', result, 40)
  })

  it('supprime la moitié des nœuds d’un arbre dense', () => {
    const base = buildLargeBuilderTree(100)

    const result = measure(() => {
      let tree = cloneJson(base)
      for (let i = 0; i < 50; i++) {
        tree = removeElementAt(tree, [0])
      }
      expect((tree as { elements: unknown[] }).elements).toHaveLength(50)
    })

    expectWithinBudget('removeElementAt × 50', result, 60)
  })
})
