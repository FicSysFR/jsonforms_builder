/**
 * Replays JSONForms renderer resolution across all examples, outside the browser.
 *
 * `DispatchRenderer` keeps the highest-ranked renderer whose tester accepts the
 * element; if all return -1, it shows « No applicable renderer found ».
 * We reproduce that calculation here to list coverage gaps in a verifiable way.
 *
 * We load the real `dist` — hence the real testers — after rewriting its Nuxt UI
 * component imports to an empty module: only the testers matter, and they are
 * pure functions.
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Generate, hasType, resolveSchema, type JsonSchema, type UISchemaElement } from '@jsonforms/core'

import { getExamples } from './register'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

type RendererEntry = {
  tester: Function
  renderer?: { name?: string }
}

type WalkUiSchema = UISchemaElement & {
  elements?: WalkUiSchema[]
  scope?: string
}

const loadRenderers = async (): Promise<RendererEntry[]> => {
  const dist = join(ROOT, 'dist', 'json-formbuilder.es.js')

  /*
   * The rewritten bundle must live *under the project*, not in the system temp
   * directory: it keeps bare imports (`@jsonforms/core`, `vue`…) that Node only
   * resolves by walking up the tree looking for a `node_modules`.
   */
  const cache = join(ROOT, 'node_modules', '.cache')
  mkdirSync(cache, { recursive: true })
  const dir = mkdtempSync(join(cache, 'jf-coverage-'))

  writeFileSync(join(dir, 'stub.js'), 'export default {}\n')
  writeFileSync(
    join(dir, 'bundle.mjs'),
    readFileSync(dist, 'utf8').replace(/"@nuxt\/ui\/[^"]+"/g, '"./stub.js"'),
  )

  try {
    const mod = await import(pathToFileURL(join(dir, 'bundle.mjs')).href)

    return mod.allRenderers as RendererEntry[]
  } finally {
    // The module is already in memory at this point: we can remove the files
    // without leaving another `jf-coverage-*` behind on every run.
    rmSync(dir, { recursive: true, force: true })
  }
}

const allRenderers = await loadRenderers()

const itemsDir = join(HERE, 'items')
for (const file of readdirSync(itemsDir).filter((f) => f.endsWith('.ts'))) {
  // `pathToFileURL`: an absolute Windows path (`C:\…`) is not a valid import
  // specifier; it must be converted to a `file://` URL.
  await import(pathToFileURL(join(itemsDir, file)).href)
}

type Gap = {
  type: string
  scope?: string
  reason: 'aucun renderer' | 'rendu vide' | '$ref non résolu'
}

/**
 * Walk guardrail, **not a diagnostic value**.
 *
 * Here we eagerly expand generated layouts, whereas the browser only expands what
 * it displays: a legitimately recursive schema (the JSON Schema meta-schema, for
 * example) would descend forever. Hitting this ceiling is therefore not a defect,
 * just an exploration limit.
 */
const MAX_DEPTH = 12

/** Renderer chosen for this element — name and rank — or `null` if none apply. */
const winner = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  rootSchema: JsonSchema,
): { name: string; rank: number } | null =>
  allRenderers.reduce<{ name: string; rank: number } | null>((best, entry) => {
    let rank = -1
    try {
      rank = entry.tester(uischema, schema, { rootSchema, config: undefined })
    } catch {
      // A tester that throws on an exotic schema does not "claim" the element.
    }

    if (rank < 0 || (best && rank <= best.rank)) {
      return best
    }

    return { name: entry.renderer?.name ?? '?', rank }
  }, null)

/**
 * Walks the uischema tree and collects problematic elements.
 *
 * Also descends into layouts **generated** by object renderers — the only way to
 * spot a loop: it does not exist in the hand-written uischema.
 */
const walk = (
  uischema: WalkUiSchema,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  gaps: Gap[],
  depth = 0,
): void => {
  if (!uischema || typeof uischema !== 'object') return

  if (depth > MAX_DEPTH) return

  const chosen = winner(uischema, schema, rootSchema)

  if (!chosen) {
    gaps.push({ type: uischema.type, scope: uischema.scope, reason: 'aucun renderer' })
    return
  }

  // Layout children receive **the same schema** as the layout: the testers resolve
  // `scope` themselves (`schemaMatches` calls `resolveSchema`). Passing them an
  // already-resolved schema would resolve twice, and everything would look uncovered.
  if (Array.isArray(uischema.elements)) {
    for (const child of uischema.elements) {
      walk(child, schema, rootSchema, gaps, depth + 1)
    }
    return
  }

  // A `Control` over an object: replay what the renderer would produce.
  if (uischema.type !== 'Control' || !uischema.scope) return

  let resolved: JsonSchema | undefined
  try {
    resolved = resolveSchema(schema, uischema.scope, rootSchema)
  } catch {
    return
  }

  /*
   * Combinator: each branch must be **resolved** before reaching the dispatcher.
   * Passing it a bare `{ $ref: … }` would resolve a scope against a schema that is
   * only a pointer, and `resolveSchema` then loops in the browser.
   */
  const branches: JsonSchema[] = resolved?.oneOf ?? resolved?.anyOf ?? []
  for (const branch of branches) {
    if (!branch?.$ref) continue

    let target: JsonSchema | undefined
    try {
      target = resolveSchema(rootSchema, branch.$ref, rootSchema)
    } catch {
      target = undefined
    }

    if (!target) {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: '$ref non résolu' })
      return
    }

    walk(
      Generate.uiSchema(target, 'VerticalLayout', undefined, rootSchema) as WalkUiSchema,
      target,
      rootSchema,
      gaps,
      depth + 1,
    )
  }

  if (branches.length) return

  if (!resolved || !hasType(resolved, 'object')) return

  const generated = Generate.uiSchema(resolved, 'VerticalLayout') as WalkUiSchema

  /*
   * Degenerate case: without `properties`, generation returns a `Control` on the
   * object itself. Redispatched, it would loop — that is what the object renderer's
   * guardrail now intercepts, at the cost of an empty render.
   *
   * This is only a defect for `ObjectControlRenderer`: `allOf` schemas land on their
   * own renderer, which merges branches instead of generating blindly.
   */
  if (generated?.type === 'Control') {
    if (chosen.name === 'ObjectControlRenderer') {
      gaps.push({ type: 'Control', scope: uischema.scope, reason: 'rendu vide' })
    }
    return
  }

  walk(generated, resolved, rootSchema, gaps, depth + 1)
}

const examples = getExamples()
const report: { name: string; gaps: Gap[] }[] = []

for (const example of examples) {
  if (!example.schema || !example.uischema) continue

  const gaps: Gap[] = []
  walk(example.uischema as WalkUiSchema, example.schema as JsonSchema, example.schema as JsonSchema, gaps)
  if (gaps.length) report.push({ name: example.name, gaps })
}

console.log(`renderers enregistrés : ${allRenderers.length}`)
console.log(`exemples analysés     : ${examples.length}`)
console.log(`exemples avec trou    : ${report.length}`)

for (const { name, gaps } of report) {
  const summary = [
    ...new Set(gaps.map((g) => `[${g.reason}] ${g.type}${g.scope ? ` ${g.scope}` : ''}`)),
  ]
  console.log(`  ${name} → ${summary.join(', ')}`)
}
