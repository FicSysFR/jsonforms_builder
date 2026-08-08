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
  type SchemaFragment,
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
 * FormBuilder performance: tree mutations, undo history, palette.
 * Matches the playground page `builder` mode.
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
      label: `Field ${i}`,
    } as UISchemaElement)
  }

  return root
}

describe('builder page — component performance', () => {
  it('bulk-inserts controls into the uischema tree', () => {
    const result = measure(() => {
      const root = buildLargeBuilderTree(200)
      expect((root as { elements: unknown[] }).elements).toHaveLength(200)
      expect((getElementAt(root, [199]) as { scope?: string })?.scope).toBe(
        '#/properties/field_199',
      )
    })

    expectWithinBudget('insertElementAt × 200', result, 120)
  })

  it('moves and shifts nodes in a large tree', () => {
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

    expectWithinBudget('shift + move on 120 nodes', result, 150)
  })

  it('deep-clones schema + uischema (history commit)', () => {
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

    expectWithinBudget('cloneJson history × 30', result, 100)
  })

  it('chains palette adds via useFormBuilder (including undo)', () => {
    const textField = findPaletteField('text')
    expect(textField).toBeTruthy()

    const result = measure(
      () => {
        const builder = useFormBuilder(createEmptyDefinition())

        for (let i = 0; i < 80; i++) {
          const length =
            (builder.definition.value.uischema as { elements?: unknown[] }).elements?.length ?? 0
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

    expectWithinBudget('useFormBuilder 80 adds + 20 undo', result, 250)
  })

  it('collects referenced properties on a large form', () => {
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

  it('enriches the schema property by property', () => {
    const result = measure(() => {
      let schema: JsonSchema = { type: 'object', properties: {} }
      for (const field of PALETTE_FIELDS) {
        for (let i = 0; i < 10; i++) {
          schema = addSchemaProperty(schema, `${field.key}_${i}`, field.schema() as SchemaFragment)
        }
      }
      expect(Object.keys(schema.properties ?? {}).length).toBe(PALETTE_FIELDS.length * 10)
    })

    expectWithinBudget('addSchemaProperty palette × 10', result, 40)
  })

  it('removes half the nodes of a dense tree', () => {
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
