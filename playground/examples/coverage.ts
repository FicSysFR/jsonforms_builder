/**
 * Rejoue la résolution de renderer de JSONForms sur tous les exemples, hors navigateur.
 *
 * `DispatchRenderer` retient le renderer de rang maximal parmi ceux dont le tester
 * accepte l'élément ; si tous renvoient -1, il affiche « No applicable renderer found ».
 * On reproduit ce calcul ici pour lister les trous de couverture de façon vérifiable.
 *
 * On charge la `dist` réelle — donc les vrais testers — après avoir réécrit ses imports
 * de composants Nuxt UI vers un module vide : seuls les testers nous intéressent, et ce
 * sont des fonctions pures.
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
   * Le bundle réécrit doit vivre *sous le projet*, pas dans le répertoire temporaire du
   * système : il conserve des imports nus (`@jsonforms/core`, `vue`…) que Node ne résout
   * qu'en remontant l'arborescence à la recherche d'un `node_modules`.
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
    // Le module est déjà en mémoire à ce stade : on peut retirer les fichiers sans
    // laisser un `jf-coverage-*` de plus à chaque exécution.
    rmSync(dir, { recursive: true, force: true })
  }
}

const allRenderers = await loadRenderers()

const itemsDir = join(HERE, 'items')
for (const file of readdirSync(itemsDir).filter((f) => f.endsWith('.ts'))) {
  // `pathToFileURL` : un chemin Windows absolu (`C:\…`) n'est pas un spécificateur
  // d'import valide, il doit être converti en URL `file://`.
  await import(pathToFileURL(join(itemsDir, file)).href)
}

type Gap = {
  type: string
  scope?: string
  reason: 'aucun renderer' | 'rendu vide' | '$ref non résolu'
}

/**
 * Garde-fou du parcours, **sans valeur de diagnostic**.
 *
 * On déplie ici les dispositions générées de façon avide, alors que le navigateur ne
 * déplie que ce qu'il affiche : un schéma légitimement récursif (le méta-schéma JSON
 * Schema, par exemple) descendrait sans fin. Atteindre ce plafond n'est donc pas un
 * défaut, juste une limite d'exploration.
 */
const MAX_DEPTH = 12

/** Renderer retenu pour cet élément — nom et rang —, ou `null` si aucun ne convient. */
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
      // Un tester qui lève sur un schéma exotique ne « prend » pas l'élément.
    }

    if (rank < 0 || (best && rank <= best.rank)) {
      return best
    }

    return { name: entry.renderer?.name ?? '?', rank }
  }, null)

/**
 * Parcourt l'arbre du uischema et collecte les éléments problématiques.
 *
 * Descend aussi dans les dispositions **générées** par les renderers d'objet, seul moyen
 * de repérer une boucle : celle-ci n'existe pas dans le uischema écrit à la main.
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

  // Les enfants d'un layout reçoivent **le même schéma** que lui : ce sont les testers
  // qui résolvent le `scope` eux-mêmes (`schemaMatches` appelle `resolveSchema`). Leur
  // passer un schéma déjà résolu leur ferait résoudre deux fois, et tout paraîtrait
  // non couvert.
  if (Array.isArray(uischema.elements)) {
    for (const child of uischema.elements) {
      walk(child, schema, rootSchema, gaps, depth + 1)
    }
    return
  }

  // Un `Control` sur un objet : on rejoue ce que le renderer produirait.
  if (uischema.type !== 'Control' || !uischema.scope) return

  let resolved: JsonSchema | undefined
  try {
    resolved = resolveSchema(schema, uischema.scope, rootSchema)
  } catch {
    return
  }

  /*
   * Combinateur : chaque branche doit être **résolue** avant d'atteindre le dispatcher.
   * Lui transmettre un `{ $ref: … }` nu le ferait résoudre un scope contre un schéma qui
   * n'est qu'un renvoi, et `resolveSchema` part alors en boucle côté navigateur.
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
   * Cas dégénéré : faute de `properties`, la génération renvoie un `Control` sur l'objet
   * lui-même. Redispatché, il bouclerait — c'est ce que le garde-fou du renderer d'objet
   * intercepte désormais, au prix d'un rendu vide.
   *
   * Ce n'est un défaut que pour `ObjectControlRenderer` : les schémas `allOf` atterrissent
   * sur leur propre renderer, qui fusionne les branches au lieu de générer à l'aveugle.
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
