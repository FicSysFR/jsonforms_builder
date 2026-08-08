import { describe, expect, it } from 'vitest'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { effectScope } from 'vue'
import {
  collectReferencedProperties,
  createEmptyDefinition,
  listPropertyNames,
  useFormBuilder,
} from '../../src/builder/useFormBuilder'

describe('createEmptyDefinition', () => {
  it('starts with an empty object and an empty column', () => {
    const empty = createEmptyDefinition()

    expect(empty.schema).toEqual({ type: 'object', properties: {} })
    expect(empty.uischema).toEqual({ type: 'VerticalLayout', elements: [] })
  })
})

describe('listPropertyNames', () => {
  it('lists root properties', () => {
    expect(listPropertyNames({ type: 'object', properties: { a: {}, b: {} } })).toEqual(['a', 'b'])
  })

  it('tolerates missing properties', () => {
    expect(listPropertyNames({ type: 'object' })).toEqual([])
  })
})

describe('collectReferencedProperties', () => {
  it('collects Control scopes in the tree', () => {
    const tree: UISchemaElement = {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/a' },
        {
          type: 'Group',
          elements: [
            { type: 'Control', scope: '#/properties/b' },
            { type: 'Label', text: 'x' },
          ],
        },
      ],
    } as UISchemaElement

    expect(collectReferencedProperties(tree).sort()).toEqual(['a', 'b'])
  })

  it('ignores undefined and non-root scopes', () => {
    expect(collectReferencedProperties(undefined)).toEqual([])
    expect(
      collectReferencedProperties({
        type: 'Control',
        scope: '#/properties/a/properties/b',
      } as UISchemaElement),
    ).toEqual([])
  })
})

describe('useFormBuilder', () => {
  const mountBuilder = (initial?: Parameters<typeof useFormBuilder>[0]) => {
    const scope = effectScope(true)
    let api: ReturnType<typeof useFormBuilder> | undefined

    scope.run(() => {
      api = useFormBuilder(initial)
    })

    return { api: api!, stop: () => scope.stop() }
  }

  it('adds a palette field (schema + control) and selects it', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)

    expect(listPropertyNames(api.definition.value.schema)).toEqual(['texte'])
    expect(api.definition.value.schema.properties?.texte).toMatchObject({
      type: 'string',
      title: 'Texte',
    })
    expect(api.selectedPath.value).toEqual([0])
    expect(api.selectedProperty.value).toBe('texte')
    expect(api.canUndo.value).toBe(true)

    stop()
  })

  it('ignores an unknown palette key', () => {
    const { api, stop } = mountBuilder()
    const before = api.definition.value

    api.addField('inconnu', [], 0)

    expect(api.definition.value).toBe(before)
    expect(api.canUndo.value).toBe(false)

    stop()
  })

  it('adds a container without touching the schema', () => {
    const { api, stop } = mountBuilder()

    api.addContainer('Group', [], 0)

    expect(api.definition.value.schema.properties).toEqual({})
    expect(api.definition.value.uischema).toMatchObject({
      type: 'VerticalLayout',
      elements: [{ type: 'Group', label: 'Nouveau groupe' }],
    })

    stop()
  })

  it('removes a control and its orphan property', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    api.addField('number', [], 1)
    api.remove([0])

    expect(listPropertyNames(api.definition.value.schema)).toEqual(['nombre'])
    expect(
      (api.definition.value.uischema as { elements: unknown[] }).elements,
    ).toHaveLength(1)

    stop()
  })

  it('removes a group and the properties of its descendants', () => {
    const { api, stop } = mountBuilder()

    api.addContainer('Group', [], 0)
    api.addField('text', [0], 0)
    api.remove([0])

    expect(listPropertyNames(api.definition.value.schema)).toEqual([])
    expect((api.definition.value.uischema as { elements: unknown[] }).elements).toEqual([])

    stop()
  })

  it('keeps a property still referenced elsewhere', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        shared: { type: 'string' },
      },
    }
    const uischema: UISchemaElement = {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/shared' },
        {
          type: 'Group',
          elements: [{ type: 'Control', scope: '#/properties/shared' }],
        },
      ],
    } as UISchemaElement

    const { api, stop } = mountBuilder({ schema, uischema })

    api.remove([1])

    expect(api.definition.value.schema.properties?.shared).toBeDefined()
    expect((api.definition.value.uischema as { elements: unknown[] }).elements).toHaveLength(1)

    stop()
  })

  it('undoes and redoes via undo / redo', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    const withField = api.definition.value

    api.undo()
    expect(listPropertyNames(api.definition.value.schema)).toEqual([])
    expect(api.canRedo.value).toBe(true)

    api.redo()
    expect(api.definition.value).toEqual(withField)

    stop()
  })

  it('clears the future on each new commit', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    api.undo()
    expect(api.canRedo.value).toBe(true)

    api.addField('boolean', [], 0)
    expect(api.canRedo.value).toBe(false)
    expect(listPropertyNames(api.definition.value.schema)).toEqual(['caseACocher'])

    stop()
  })

  it('updates uischema options and schema property', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    api.updateElement([0], { label: 'Nom' })
    api.updateProperty('texte', { maxLength: 40, minLength: undefined })

    const control = (api.definition.value.uischema as { elements: Array<{ label?: string }> })
      .elements[0]
    expect(control.label).toBe('Nom')
    expect(api.definition.value.schema.properties?.texte).toMatchObject({
      type: 'string',
      maxLength: 40,
    })
    expect(api.definition.value.schema.properties?.texte).not.toHaveProperty('minLength')

    stop()
  })

  it('manages required via setRequired / isRequired', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    expect(api.isRequired('texte')).toBe(false)

    api.setRequired('texte', true)
    expect(api.isRequired('texte')).toBe(true)

    api.setRequired('texte', false)
    expect(api.isRequired('texte')).toBe(false)

    stop()
  })

  it('moves and shifts elements', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    api.addField('number', [], 1)
    api.addContainer('Group', [], 2)

    api.move([0], [2], 0)
    const root = api.definition.value.uischema as {
      elements: Array<{ type: string; elements?: Array<{ scope?: string }> }>
    }
    expect(root.elements[0].type).toBe('Control')
    expect(root.elements[1].type).toBe('Group')
    expect(root.elements[1].elements?.[0].scope).toBe('#/properties/texte')

    api.shift([0], 1)
    expect(
      (api.definition.value.uischema as { elements: Array<{ type: string }> }).elements.map(
        (e) => e.type,
      ),
    ).toEqual(['Group', 'Control'])

    stop()
  })

  it('reset clears history and selection', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    api.select([0])
    api.reset()

    expect(api.definition.value).toEqual(createEmptyDefinition())
    expect(api.selectedPath.value).toBeNull()
    expect(api.canUndo.value).toBe(false)
    expect(api.canRedo.value).toBe(false)

    stop()
  })

  it('deselects after removing the selected element', () => {
    const { api, stop } = mountBuilder()

    api.addField('text', [], 0)
    expect(api.selectedPath.value).toEqual([0])

    api.remove([0])
    expect(api.selectedPath.value).toBeNull()

    stop()
  })
})
