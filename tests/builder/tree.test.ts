import { describe, expect, it } from 'vitest'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import {
  addSchemaProperty,
  adjustPathAfterRemoval,
  getElementAt,
  getSchemaPropertyAtPath,
  insertElementAt,
  isAncestorPath,
  isContainer,
  isSamePath,
  isSchemaPropertyRequiredAtPath,
  moveElement,
  moveSchemaPropertyPath,
  parsePropertyPathInput,
  propertyFromScope,
  propertyPathFromScope,
  removeElementAt,
  removeSchemaProperty,
  scopeFromPropertyPath,
  setSchemaPropertyRequired,
  setSchemaPropertyRequiredAtPath,
  shiftElement,
  slugifyPropertyName,
  updateElementAt,
} from '../../src/builder/tree'

type TreeNode = UISchemaElement & {
  elements?: TreeNode[]
  scope?: string
  label?: string
}

const tree = (): TreeNode =>
  ({
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/a' },
      {
        type: 'Group',
        label: 'G',
        elements: [
          { type: 'Control', scope: '#/properties/b' },
          { type: 'Control', scope: '#/properties/c' },
        ],
      },
      { type: 'Control', scope: '#/properties/d' },
    ],
  }) as TreeNode

const scopesOf = (root: UISchemaElement): string =>
  JSON.stringify(root, (key, value) => (key === 'label' ? undefined : value))

describe('getElementAt', () => {
  it('walks nested element indices', () => {
    expect((getElementAt(tree(), [0]) as TreeNode).scope).toBe('#/properties/a')
    expect((getElementAt(tree(), [1, 1]) as TreeNode).scope).toBe('#/properties/c')
  })

  it('returns the root for an empty path', () => {
    expect(getElementAt(tree(), [])?.type).toBe('VerticalLayout')
  })

  it('returns undefined for an out-of-range path', () => {
    expect(getElementAt(tree(), [9])).toBeUndefined()
    expect(getElementAt(tree(), [0, 0])).toBeUndefined()
  })
})

describe('isContainer', () => {
  it('distinguishes elements that accept children', () => {
    expect(isContainer(getElementAt(tree(), [1]))).toBe(true)
    expect(isContainer(getElementAt(tree(), [0]))).toBe(false)
    expect(isContainer(undefined)).toBe(false)
  })
})

describe('isSamePath / isAncestorPath', () => {
  it('compares paths element-wise', () => {
    expect(isSamePath([1, 0], [1, 0])).toBe(true)
    expect(isSamePath([1, 0], [1])).toBe(false)
  })

  it('detects ancestry, including self', () => {
    expect(isAncestorPath([1], [1, 0])).toBe(true)
    expect(isAncestorPath([1], [1])).toBe(true)
    expect(isAncestorPath([1, 0], [1])).toBe(false)
    expect(isAncestorPath([0], [1, 0])).toBe(false)
  })
})

describe('insertElementAt', () => {
  it('inserts at the requested index without mutating the source', () => {
    const root = tree()
    const next = insertElementAt(root, [], 1, { type: 'Label' } as UISchemaElement) as TreeNode

    expect(next.elements![1].type).toBe('Label')
    expect(next.elements).toHaveLength(4)
    expect(root.elements).toHaveLength(3)
  })

  it('clamps an out-of-range index to the end', () => {
    const next = insertElementAt(tree(), [], 99, { type: 'Label' } as UISchemaElement) as TreeNode

    expect(next.elements![3].type).toBe('Label')
  })

  it('inserts into a nested container', () => {
    const next = insertElementAt(tree(), [1], 0, { type: 'Label' } as UISchemaElement) as TreeNode

    expect(next.elements![1].elements![0].type).toBe('Label')
  })

  it('is a no-op when the target cannot hold children', () => {
    const next = insertElementAt(tree(), [0], 0, { type: 'Label' } as UISchemaElement)

    expect(scopesOf(next)).toBe(scopesOf(tree()))
  })
})

describe('removeElementAt', () => {
  it('removes without mutating the source', () => {
    const root = tree()
    const next = removeElementAt(root, [1]) as TreeNode

    expect(next.elements).toHaveLength(2)
    expect(root.elements).toHaveLength(3)
  })

  it('refuses to remove the root', () => {
    expect(removeElementAt(tree(), [])).toEqual(tree())
  })
})

describe('updateElementAt', () => {
  it('patches the addressed element only', () => {
    const next = updateElementAt(tree(), [1], { label: 'Renamed' }) as TreeNode

    expect(next.elements![1].label).toBe('Renamed')
    expect(next.elements![1].elements).toHaveLength(2)
  })
})

describe('adjustPathAfterRemoval', () => {
  it('decrements a path that traverses a later sibling of the removed element', () => {
    expect(adjustPathAfterRemoval([1, 0], [0])).toEqual([0, 0])
    expect(adjustPathAfterRemoval([2], [0])).toEqual([1])
  })

  it('leaves earlier siblings and other branches untouched', () => {
    expect(adjustPathAfterRemoval([0, 3], [1])).toEqual([0, 3])
    expect(adjustPathAfterRemoval([1, 0], [1, 5, 2])).toEqual([1, 0])
    expect(adjustPathAfterRemoval([1], [])).toEqual([1])
  })

  it('leaves the removed element depth itself untouched', () => {
    expect(adjustPathAfterRemoval([1], [1])).toEqual([1])
  })
})

describe('moveElement', () => {
  it('moves an element into another container', () => {
    const next = moveElement(tree(), [0], [1], 0) as TreeNode

    expect(next.elements![0].type).toBe('Group')
    expect(next.elements![0].elements![0].scope).toBe('#/properties/a')
    expect(next.elements).toHaveLength(2)
  })

  it('compensates the index shift when moving down among siblings', () => {
    // a, G, d → moving `a` to position 2 must place it between G and d, not after d.
    const next = moveElement(tree(), [0], [], 2) as TreeNode
    const scopes = next.elements!.map((e) => e.scope ?? e.type)

    expect(scopes).toEqual(['Group', '#/properties/a', '#/properties/d'])
  })

  it('refuses to drop a container inside itself', () => {
    const root = tree()

    expect(moveElement(root, [1], [1, 0], 0)).toBe(root)
    expect(moveElement(root, [1], [1], 0)).toBe(root)
  })

  it('refuses to move the root', () => {
    const root = tree()

    expect(moveElement(root, [], [1], 0)).toBe(root)
  })
})

describe('shiftElement', () => {
  it('swaps an element with its next sibling', () => {
    const next = shiftElement(tree(), [0], 1) as TreeNode
    const scopes = next.elements!.map((e) => e.scope ?? e.type)

    expect(scopes).toEqual(['Group', '#/properties/a', '#/properties/d'])
  })

  it('swaps an element with its previous sibling', () => {
    const next = shiftElement(tree(), [2], -1) as TreeNode
    const scopes = next.elements!.map((e) => e.scope ?? e.type)

    expect(scopes).toEqual(['#/properties/a', '#/properties/d', 'Group'])
  })

  it('is a no-op at the boundaries', () => {
    const root = tree()

    expect(shiftElement(root, [0], -1)).toBe(root)
    expect(shiftElement(root, [2], 1)).toBe(root)
    expect(shiftElement(root, [], 1)).toBe(root)
  })
})

describe('propertyFromScope / propertyPathFromScope', () => {
  it('extracts a root property name', () => {
    expect(propertyFromScope('#/properties/name')).toBe('name')
    expect(propertyPathFromScope('#/properties/name')).toEqual(['name'])
  })

  it('supports nested scopes', () => {
    expect(propertyFromScope('#/properties/a/properties/b')).toBe('b')
    expect(propertyPathFromScope('#/properties/a/properties/b')).toEqual(['a', 'b'])
    expect(scopeFromPropertyPath(['a', 'b'])).toBe('#/properties/a/properties/b')
  })

  it('ignores malformed scopes', () => {
    expect(propertyFromScope('#')).toBeUndefined()
    expect(propertyFromScope(undefined)).toBeUndefined()
    expect(propertyPathFromScope('#/properties')).toBeUndefined()
  })
})

describe('parsePropertyPathInput', () => {
  it('accepts JSON Forms scopes and shorthand paths', () => {
    expect(parsePropertyPathInput('#/properties/a/properties/b')).toEqual(['a', 'b'])
    expect(parsePropertyPathInput('properties/a/properties/b')).toEqual(['a', 'b'])
    expect(parsePropertyPathInput('properties/a/b')).toEqual(['a', 'b'])
    expect(parsePropertyPathInput('a/b')).toEqual(['a', 'b'])
    expect(parsePropertyPathInput('monChamp')).toEqual(['monChamp'])
  })

  it('rejects empty input', () => {
    expect(parsePropertyPathInput('')).toBeUndefined()
    expect(parsePropertyPathInput('properties/')).toBeUndefined()
  })
})

describe('nested schema property helpers', () => {
  it('gets, sets and moves nested properties', () => {
    let schema: JsonSchema = {
      type: 'object',
      properties: {
        street: { type: 'string', title: 'Rue' },
      },
    }

    schema = moveSchemaPropertyPath(schema, ['street'], ['address', 'street'])
    expect(schema.properties?.street).toBeUndefined()
    expect(getSchemaPropertyAtPath(schema, ['address', 'street'])).toMatchObject({
      type: 'string',
      title: 'Rue',
    })
    expect(schema.properties?.address).toMatchObject({ type: 'object' })
  })

  it('toggles required on a nested parent', () => {
    const schema = setSchemaPropertyRequiredAtPath(
      {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: { city: { type: 'string' } },
          },
        },
      },
      ['address', 'city'],
      true,
    )

    expect(isSchemaPropertyRequiredAtPath(schema, ['address', 'city'])).toBe(true)
    expect((schema.properties?.address as JsonSchema).required).toEqual(['city'])
  })
})

describe('slugifyPropertyName', () => {
  it('strips accents without splitting the word', () => {
    expect(slugifyPropertyName('Prénom')).toBe('prenom')
    expect(slugifyPropertyName('Zone géographique')).toBe('zoneGeographique')
  })

  it('camel-cases multi-word labels', () => {
    expect(slugifyPropertyName('Nom de famille')).toBe('nomDeFamille')
  })

  it('never starts with a digit', () => {
    expect(slugifyPropertyName('1er champ')).toBe('champ1erChamp')
  })

  it('falls back for an empty label', () => {
    expect(slugifyPropertyName('')).toBe('champ')
    expect(slugifyPropertyName('---')).toBe('champ')
  })

  it('suffixes until the name is free', () => {
    expect(slugifyPropertyName('Texte', ['texte'])).toBe('texte2')
    expect(slugifyPropertyName('Texte', ['texte', 'texte2'])).toBe('texte3')
  })
})

describe('schema property helpers', () => {
  const base: JsonSchema = { type: 'object', properties: { a: { type: 'string' } } }

  it('adds a property without mutating the source', () => {
    const next = addSchemaProperty(base, 'b', { type: 'number' })

    expect(next.properties!.b.type).toBe('number')
    expect(base.properties!.b).toBeUndefined()
  })

  it('adds to required when asked', () => {
    const next = addSchemaProperty(base, 'b', { type: 'number' }, true)

    expect(next.required).toEqual(['b'])
  })

  it('removes a property and its required entry', () => {
    const withRequired = addSchemaProperty(base, 'b', { type: 'number' }, true)
    const next = removeSchemaProperty(withRequired, 'b')

    expect(next.properties?.b).toBeUndefined()
    expect(next.required).toEqual([])
  })

  it('toggles required both ways without duplicating', () => {
    let next = setSchemaPropertyRequired(base, 'a', true)
    next = setSchemaPropertyRequired(next, 'a', true)
    expect(next.required).toEqual(['a'])

    next = setSchemaPropertyRequired(next, 'a', false)
    expect(next.required).toEqual([])
  })
})
