import { describe, expect, it } from 'vitest'
import {
  collectExtraProperties,
  hasRenderableControl,
  isRenderableObjectSchema,
} from '../../src/composables/useObjectControl'

describe('isRenderableObjectSchema', () => {
  it('accepts a plain object schema', () => {
    expect(isRenderableObjectSchema({ type: 'object', properties: { a: {} } })).toBe(true)
  })

  /** Sans `properties`, le renderer affiche encore les clés hors schéma : il garde la main. */
  it('accepts an object schema without properties', () => {
    expect(isRenderableObjectSchema({ type: 'object' })).toBe(true)
    expect(isRenderableObjectSchema({ type: 'object', additionalProperties: true })).toBe(true)
  })

  it('accepts a union that still declares properties', () => {
    expect(
      isRenderableObjectSchema({ type: ['object', 'boolean'], properties: { a: {} } }),
    ).toBe(true)
  })

  it('accepts patternProperties as renderable content', () => {
    expect(isRenderableObjectSchema({ type: ['object', 'string'], patternProperties: {} })).toBe(
      true,
    )
  })

  /**
   * Le cas `json-editor` : rien à déployer, mais le rang 2 du renderer d'objet battait les
   * renderers scalaires (rang 1) et ne produisait qu'une carte vide.
   */
  it('declines a union without properties, leaving it to a scalar renderer', () => {
    expect(
      isRenderableObjectSchema({
        type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
      }),
    ).toBe(false)
  })

  it('keeps a single-entry object union', () => {
    expect(isRenderableObjectSchema({ type: ['object'] })).toBe(true)
  })
})

describe('hasRenderableControl', () => {
  it('accepts a control pointing at a property', () => {
    expect(hasRenderableControl({ type: 'Control', scope: '#/properties/name' })).toBe(true)
  })

  /** Cas dégénéré direct : `Generate.uiSchema` retombe sur l'objet lui-même. */
  it('rejects a control pointing back at the element itself', () => {
    expect(hasRenderableControl({ type: 'Control', scope: '#' })).toBe(false)
    expect(hasRenderableControl({ type: 'Control', scope: '#/' })).toBe(false)
    expect(hasRenderableControl({ type: 'Control' })).toBe(false)
  })

  it('accepts a layout wrapping a real control', () => {
    expect(
      hasRenderableControl({
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/age' }],
      }),
    ).toBe(true)
  })

  /**
   * Le cas manqué : le layout n'est qu'une enveloppe autour d'un contrôle qui revient sur
   * l'élément courant, ce qui reboucle sur le renderer d'objet.
   */
  it('rejects a layout whose only control points at the element itself', () => {
    expect(
      hasRenderableControl({ type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#' }] }),
    ).toBe(false)
  })

  it('looks through nested layouts', () => {
    expect(
      hasRenderableControl({
        type: 'VerticalLayout',
        elements: [{ type: 'Group', elements: [{ type: 'Control', scope: '#/properties/deep' }] }],
      }),
    ).toBe(true)
  })

  it('rejects empty and non-element values', () => {
    expect(hasRenderableControl({ type: 'VerticalLayout', elements: [] })).toBe(false)
    expect(hasRenderableControl(undefined)).toBe(false)
    expect(hasRenderableControl('VerticalLayout')).toBe(false)
  })
})

describe('collectExtraProperties', () => {
  it('lists the keys absent from the schema', () => {
    expect(collectExtraProperties({ a: 1, b: 'x' }, { a: {} })).toEqual([{ key: 'b', value: 'x' }])
  })

  it('serialises nested values', () => {
    expect(collectExtraProperties({ meta: { n: 1 } }, {})).toEqual([
      { key: 'meta', value: '{"n":1}' },
    ])
  })

  it('returns nothing for non-object data', () => {
    expect(collectExtraProperties(['a'], {})).toEqual([])
    expect(collectExtraProperties('a', {})).toEqual([])
    expect(collectExtraProperties(undefined, undefined)).toEqual([])
  })
})
