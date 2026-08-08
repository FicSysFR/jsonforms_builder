/**
 * Utilitaires de mesure pour la suite de performances.
 *
 * Les budgets sont volontairement larges : l'objectif est de détecter une
 * régression nette (ordre de grandeur), pas de chronométrer au millisecond près
 * sur des runners CI hétérogènes.
 */

import type { UISchemaElement } from '@jsonforms/core'

export type MeasureResult = {
  /** Durée médiane (ms) sur les itérations chronométrées. */
  medianMs: number
  /** Percentile 95 (ms). */
  p95Ms: number
  /** Moyenne (ms). */
  meanMs: number
  /** Échantillon brut (ms), hors warm-up. */
  samples: number[]
}

export type MeasureOptions = {
  /** Itérations chronométrées (défaut 7). */
  iterations?: number
  /** Passes à jeter avant la mesure (défaut 1). */
  warmup?: number
}

const percentile = (sorted: number[], ratio: number): number => {
  if (!sorted.length) return 0
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)
  return sorted[Math.max(0, index)]
}

/** Exécute `fn` plusieurs fois et renvoie médiane / p95 / moyenne. */
export const measure = (fn: () => void, options: MeasureOptions = {}): MeasureResult => {
  const iterations = options.iterations ?? 7
  const warmup = options.warmup ?? 1

  for (let i = 0; i < warmup; i++) {
    fn()
  }

  const samples: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    samples.push(performance.now() - start)
  }

  const sorted = [...samples].sort((a, b) => a - b)
  const meanMs = samples.reduce((sum, value) => sum + value, 0) / samples.length

  return {
    medianMs: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    meanMs,
    samples,
  }
}

/**
 * Échoue si la médiane dépasse le budget.
 *
 * Message enrichi pour faciliter le diagnostic en CI.
 */
export const expectWithinBudget = (
  label: string,
  result: MeasureResult,
  budgetMs: number,
): void => {
  if (result.medianMs > budgetMs) {
    throw new Error(
      `[perf] ${label}: médiane ${result.medianMs.toFixed(2)} ms > budget ${budgetMs} ms` +
        ` (p95=${result.p95Ms.toFixed(2)} ms, mean=${result.meanMs.toFixed(2)} ms,` +
        ` samples=[${result.samples.map((s) => s.toFixed(1)).join(', ')}])`,
    )
  }
}

/** Construit un schéma objet plat avec `count` propriétés string. */
export const buildFlatObjectSchema = (count: number) => {
  const properties: Record<string, { type: string; title: string }> = {}
  for (let i = 0; i < count; i++) {
    properties[`field_${i}`] = { type: 'string', title: `Champ ${i}` }
  }

  return {
    type: 'object' as const,
    properties,
  }
}

/** Uischema VerticalLayout aligné sur `buildFlatObjectSchema`. */
export const buildFlatVerticalUiSchema = (count: number) => ({
  type: 'VerticalLayout' as const,
  elements: Array.from({ length: count }, (_, i) => ({
    type: 'Control' as const,
    scope: `#/properties/field_${i}`,
  })),
})

/** Données correspondant à un schéma plat. */
export const buildFlatObjectData = (count: number): Record<string, string> => {
  const data: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    data[`field_${i}`] = `valeur-${i}`
  }
  return data
}

/** Arbre uischema profondément imbriqué (Group dans Group). */
export const buildDeepUiSchema = (depth: number, breadth = 3) => {
  const leaf = (index: number) => ({
    type: 'Control' as const,
    scope: `#/properties/leaf_${index}`,
  })

  let node: UISchemaElement = {
    type: 'VerticalLayout',
    elements: Array.from({ length: breadth }, (_, i) => leaf(i)),
  }

  for (let level = 0; level < depth; level++) {
    node = {
      type: 'Group',
      label: `Groupe ${level}`,
      elements: [
        node,
        ...Array.from({ length: breadth - 1 }, (_, i) => leaf(1000 * (level + 1) + i)),
      ],
    }
  }

  return node
}
