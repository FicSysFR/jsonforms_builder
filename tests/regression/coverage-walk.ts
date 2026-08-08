/**
 * Parcours de couverture (même logique que `playground/examples/coverage.ts`),
 * sur le miroir de testers — sans build dist.
 */
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

export type CoverageGap = {
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
  gaps: CoverageGap[],
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

  // Tableau (y compris items combinator) : le renderer array gère le détail.
  if (chosen.name === 'ArrayControl' || hasType(resolved, 'array')) {
    return
  }

  if (!hasType(resolved, 'object') && !resolved.properties && !resolved.patternProperties) {
    return
  }

  const generated = Generate.uiSchema(resolved, 'VerticalLayout', undefined, rootSchema) as WalkUi

  if (!hasRenderableControl(generated)) {
    if (chosen.name === 'ObjectControl') {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: 'rendu vide' })
    }
    return
  }

  walk(generated, resolved, rootSchema, gaps, depth + 1)
}

export const collectCoverageGaps = (
  schema: JsonSchema,
  uischema: UISchemaElement,
): CoverageGap[] => {
  const gaps: CoverageGap[] = []
  walk(uischema as WalkUi, schema, schema, gaps)
  return gaps
}

export const formatCoverageGaps = (gaps: CoverageGap[]): string =>
  [...new Set(gaps.map((g) => `[${g.reason}] ${g.type}${g.scope ? ` ${g.scope}` : ''}`))].join(
    ', ',
  )
