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
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Generate, hasType, resolveSchema } from '@jsonforms/core'

import { getExamples } from './register'

const ROOT = join(import.meta.dir, '..', '..')

const loadRenderers = async (): Promise<any[]> => {
  const dist = join(ROOT, 'dist', 'json-formbuilder.es.js')
  const dir = mkdtempSync(join(tmpdir(), 'jf-coverage-'))

  writeFileSync(join(dir, 'stub.js'), 'export default {}\n')
  writeFileSync(
    join(dir, 'bundle.mjs'),
    readFileSync(dist, 'utf8').replace(/"@nuxt\/ui\/[^"]+"/g, '"./stub.js"'),
  )

  const mod = await import(pathToFileURL(join(dir, 'bundle.mjs')).href)

  return mod.allRenderers
}

const allRenderers = await loadRenderers()

const itemsDir = join(import.meta.dir, 'items')
for (const file of readdirSync(itemsDir).filter((f) => f.endsWith('.ts'))) {
  await import(join(itemsDir, file))
}

type Gap = { type: string; scope?: string; reason: 'aucun renderer' | 'rendu vide' }

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
  uischema: any,
  schema: any,
  rootSchema: any,
): { name: string; rank: number } | null =>
  allRenderers.reduce<{ name: string; rank: number } | null>((best, entry: any) => {
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
  uischema: any,
  schema: any,
  rootSchema: any,
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

  let resolved: any
  try {
    resolved = resolveSchema(schema, uischema.scope, rootSchema)
  } catch {
    return
  }

  if (!resolved || !hasType(resolved, 'object')) return

  const generated = Generate.uiSchema(resolved, 'VerticalLayout')

  /*
   * Cas dégénéré : faute de `properties`, la génération renvoie un `Control` sur l'objet
   * lui-même. Redispatché, il bouclerait — c'est ce que le garde-fou du renderer d'objet
   * intercepte désormais, au prix d'un rendu vide.
   *
   * Ce n'est un défaut que pour `ObjectControlRenderer` : les schémas `allOf` atterrissent
   * sur leur propre renderer, qui fusionne les branches au lieu de générer à l'aveugle.
   */
  if ((generated as any)?.type === 'Control') {
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
  walk(example.uischema, example.schema, example.schema, gaps)
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
