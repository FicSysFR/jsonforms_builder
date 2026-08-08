/**
 * Measurement utilities for the performance suite.
 *
 * Budgets are intentionally loose: the goal is to catch a clear regression
 * (order of magnitude), not to time to the millisecond on heterogeneous CI runners.
 */

import type { UISchemaElement } from '@jsonforms/core'

export type MeasureResult = {
  /** Median duration (ms) over timed iterations. */
  medianMs: number
  /** 95th percentile (ms). */
  p95Ms: number
  /** Mean (ms). */
  meanMs: number
  /** Raw samples (ms), excluding warm-up. */
  samples: number[]
}

export type MeasureOptions = {
  /** Timed iterations (default 7). */
  iterations?: number
  /** Passes to discard before measuring (default 1). */
  warmup?: number
}

const percentile = (sorted: number[], ratio: number): number => {
  if (!sorted.length) return 0
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)
  return sorted[Math.max(0, index)]
}

/** Runs `fn` several times and returns median / p95 / mean. */
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
 * Fails if the median exceeds the budget.
 *
 * Enriched message to ease CI diagnosis.
 */
export const expectWithinBudget = (
  label: string,
  result: MeasureResult,
  budgetMs: number,
): void => {
  if (result.medianMs > budgetMs) {
    throw new Error(
      `[perf] ${label}: median ${result.medianMs.toFixed(2)} ms > budget ${budgetMs} ms` +
        ` (p95=${result.p95Ms.toFixed(2)} ms, mean=${result.meanMs.toFixed(2)} ms,` +
        ` samples=[${result.samples.map((s) => s.toFixed(1)).join(', ')}])`,
    )
  }
}

/** Builds a flat object schema with `count` string properties. */
export const buildFlatObjectSchema = (count: number) => {
  const properties: Record<string, { type: string; title: string }> = {}
  for (let i = 0; i < count; i++) {
    properties[`field_${i}`] = { type: 'string', title: `Field ${i}` }
  }

  return {
    type: 'object' as const,
    properties,
  }
}

/** VerticalLayout uischema aligned with `buildFlatObjectSchema`. */
export const buildFlatVerticalUiSchema = (count: number) => ({
  type: 'VerticalLayout' as const,
  elements: Array.from({ length: count }, (_, i) => ({
    type: 'Control' as const,
    scope: `#/properties/field_${i}`,
  })),
})

/** Data matching a flat schema. */
export const buildFlatObjectData = (count: number): Record<string, string> => {
  const data: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    data[`field_${i}`] = `value-${i}`
  }
  return data
}

/** Deeply nested uischema tree (Group inside Group). */
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
      label: `Group ${level}`,
      elements: [
        node,
        ...Array.from({ length: breadth - 1 }, (_, i) => leaf(1000 * (level + 1) + i)),
      ],
    }
  }

  return node
}

/**
 * Root schema with an `allOf` / `$ref` chain of depth `depth`.
 * Each level adds `fieldsPerLayer` string properties.
 *
 * Mirrors the playground `allOf-perf` stress case: used to time
 * `flattenAllOfSchema` without mounting Vue.
 */
export const buildNestedAllOfSchema = (depth: number, fieldsPerLayer = 10) => {
  const definitions: Record<
    string,
    {
      type?: 'object'
      title?: string
      properties?: Record<string, { type: string; title: string }>
      allOf?: Array<{ $ref: string } | { type: 'object'; properties: Record<string, { type: string; title: string }> }>
    }
  > = {}

  for (let level = 0; level < depth; level++) {
    const properties: Record<string, { type: string; title: string }> = {}
    for (let i = 0; i < fieldsPerLayer; i++) {
      properties[`l${level}_field_${i}`] = { type: 'string', title: `L${level}.${i}` }
    }

    if (level === 0) {
      definitions[`layer_${level}`] = { type: 'object', title: `Layer ${level}`, properties }
      continue
    }

    definitions[`layer_${level}`] = {
      title: `Layer ${level}`,
      allOf: [
        { $ref: `#/definitions/layer_${level - 1}` },
        { type: 'object', properties },
      ],
    }
  }

  return {
    type: 'object' as const,
    definitions,
    properties: {
      entity: { $ref: `#/definitions/layer_${depth - 1}` },
    },
  }
}
