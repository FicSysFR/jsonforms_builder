/**
 * REGRESSION P2 — golden des exemples playground critiques.
 *
 * Rejoue la résolution de renderer (testers miroir) + le dépliage Generate /
 * flatten allOf, sans monter Vue ni builder la dist.
 *
 * Un trou ici = retour d’un « No applicable renderer » / rendu vide / $ref nu.
 */
import { describe, expect, it } from 'vitest'
import {
  Generate,
  hasType,
  resolveSchema,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import { flattenAllOfSchema } from '../../src/composables/useAllOfControl'
import { hasRenderableControl } from '../../src/composables/useObjectControl'
import { resolveCombinatorBranches } from '../../src/composables/useOneOfControl'
import { resolveWinner } from './testers-mirror'

import { schema as allOfSchema, uischema as allOfUi } from '../../playground/examples/items/allOf'
import {
  schema as allOfPerfSchema,
  uischema as allOfPerfUi,
} from '../../playground/examples/items/allOf-perf'
import {
  schema as objectSchema,
  uischemaNonRoot as objectUi,
  uischemaRoot as objectRootUi,
} from '../../playground/examples/items/object'
import { schema as oneOfSchema, uischema as oneOfUi } from '../../playground/examples/items/oneOf'

type Gap = {
  type: string
  scope?: string
  reason: 'aucun renderer' | 'rendu vide' | '$ref non résolu'
}

type WalkUi = UISchemaElement & {
  elements?: WalkUi[]
  scope?: string
}

const MAX_DEPTH = 12

const walk = (
  uischema: WalkUi,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  gaps: Gap[],
  depth = 0,
): void => {
  if (!uischema || typeof uischema !== 'object') return
  if (depth > MAX_DEPTH) return

  const chosen = resolveWinner(uischema, schema, rootSchema)

  if (!chosen) {
    gaps.push({ type: uischema.type, scope: uischema.scope, reason: 'aucun renderer' })
    return
  }

  if (Array.isArray(uischema.elements)) {
    for (const child of uischema.elements) {
      walk(child, schema, rootSchema, gaps, depth + 1)
    }
    return
  }

  if (uischema.type !== 'Control' || !uischema.scope) return

  let resolved: JsonSchema | undefined
  try {
    resolved = resolveSchema(schema, uischema.scope, rootSchema)
  } catch {
    return
  }

  if (!resolved) return

  // oneOf / anyOf : chaque branche $ref doit être résolue (sinon stack overflow navigateur).
  if (resolved.oneOf || resolved.anyOf) {
    const branches = resolveCombinatorBranches(resolved, rootSchema)
    if (branches.some((b) => b.$ref)) {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: '$ref non résolu' })
      return
    }

    for (const branch of branches) {
      if (!hasType(branch, 'object') && !branch.properties && !branch.allOf) continue
      const forGenerate = branch.allOf ? flattenAllOfSchema(branch, rootSchema) : branch
      if (!Object.keys(forGenerate.properties ?? {}).length) continue
      const generated = Generate.uiSchema(
        forGenerate,
        'VerticalLayout',
        undefined,
        rootSchema,
      ) as WalkUi
      walk(generated, branch, rootSchema, gaps, depth + 1)
    }
    return
  }

  // allOf : fusion puis disposition (comme AllOfControlRenderer).
  if (chosen.name === 'AllOfControl' || resolved.allOf) {
    const flattened = flattenAllOfSchema(resolved, rootSchema)
    if (!Object.keys(flattened.properties ?? {}).length) {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: 'rendu vide' })
      return
    }

    const generated = Generate.uiSchema(
      flattened,
      'VerticalLayout',
      undefined,
      rootSchema,
    ) as WalkUi

    if (!hasRenderableControl(generated)) {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: 'rendu vide' })
      return
    }

    walk(generated, resolved, rootSchema, gaps, depth + 1)
    return
  }

  if (!hasType(resolved, 'object')) return

  const generated = Generate.uiSchema(resolved, 'VerticalLayout', undefined, rootSchema) as WalkUi

  if (!hasRenderableControl(generated)) {
    if (chosen.name === 'ObjectControl') {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: 'rendu vide' })
    }
    return
  }

  walk(generated, resolved, rootSchema, gaps, depth + 1)
}

const collectGaps = (schema: JsonSchema, uischema: UISchemaElement): Gap[] => {
  const gaps: Gap[] = []
  walk(uischema as WalkUi, schema, schema, gaps)
  return gaps
}

const formatGaps = (gaps: Gap[]) =>
  [...new Set(gaps.map((g) => `[${g.reason}] ${g.type}${g.scope ? ` ${g.scope}` : ''}`))].join(
    ', ',
  )

describe('REGRESSION — golden exemples playground', () => {
  it('REGRESSION: exemple allOf n’a aucun trou de couverture', () => {
    const gaps = collectGaps(allOfSchema as JsonSchema, allOfUi as UISchemaElement)
    expect(gaps, formatGaps(gaps)).toEqual([])
  })

  it('REGRESSION: exemple allOf-perf (profondeur + liste) n’a aucun trou', () => {
    const gaps = collectGaps(allOfPerfSchema as JsonSchema, allOfPerfUi as UISchemaElement)
    expect(gaps, formatGaps(gaps)).toEqual([])
  })

  it('REGRESSION: exemple object (root + non-root) n’a aucun trou', () => {
    const rootGaps = collectGaps(objectSchema as JsonSchema, objectRootUi as UISchemaElement)
    const nestedGaps = collectGaps(objectSchema as JsonSchema, objectUi as UISchemaElement)

    expect(rootGaps, formatGaps(rootGaps)).toEqual([])
    expect(nestedGaps, formatGaps(nestedGaps)).toEqual([])
  })

  it('REGRESSION: exemple oneOf n’a aucun trou / $ref nu', () => {
    const gaps = collectGaps(oneOfSchema as JsonSchema, oneOfUi as UISchemaElement)
    expect(gaps, formatGaps(gaps)).toEqual([])
  })

  it('REGRESSION: shipping_address allOf est bien AllOfControl', () => {
    const winner = resolveWinner(
      { type: 'Control', scope: '#/properties/shipping_address' },
      allOfSchema as JsonSchema,
      allOfSchema as JsonSchema,
    )

    expect(winner).toEqual({ name: 'AllOfControl', rank: 4 })
  })

  it('REGRESSION: entity allOf-perf via Categorization est AllOfControl', () => {
    const winner = resolveWinner(
      { type: 'Control', scope: '#/properties/entity_0' },
      allOfPerfSchema as JsonSchema,
      allOfPerfSchema as JsonSchema,
    )

    expect(winner).toEqual({ name: 'AllOfControl', rank: 4 })
  })

  it('REGRESSION: entries allOf-perf est ArrayControl (items combinator)', () => {
    const winner = resolveWinner(
      { type: 'ListWithDetail', scope: '#/properties/entries' } as UISchemaElement,
      allOfPerfSchema as JsonSchema,
      allOfPerfSchema as JsonSchema,
    )

    // ListWithDetail (rang 4) prime ; le Control sous-jacent array reste couvert
    // via isCombinatorItemsArray dans le miroir ArrayControl.
    expect(winner?.name).toBe('ListWithDetail')
    expect(winner?.rank).toBe(4)

    const arrayWinner = resolveWinner(
      { type: 'Control', scope: '#/properties/entries' },
      allOfPerfSchema as JsonSchema,
      allOfPerfSchema as JsonSchema,
    )
    expect(arrayWinner).toEqual({ name: 'ArrayControl', rank: 2 })
  })
})
