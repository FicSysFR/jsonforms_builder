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

type Gap = { type: string; scope?: string }

/** Rang maximal atteint par un renderer pour cet élément ; -1 si aucun ne convient. */
const bestRank = (uischema: any, schema: any, rootSchema: any): number =>
  allRenderers.reduce((best: number, entry: any) => {
    let rank = -1
    try {
      rank = entry.tester(uischema, schema, { rootSchema, config: undefined })
    } catch {
      // Un tester qui lève sur un schéma exotique ne « prend » pas l'élément.
    }
    return rank > best ? rank : best
  }, -1)

/** Parcourt l'arbre du uischema et collecte les éléments qu'aucun renderer ne prend. */
const walk = (uischema: any, schema: any, rootSchema: any, gaps: Gap[]): void => {
  if (!uischema || typeof uischema !== 'object') return

  if (bestRank(uischema, schema, rootSchema) < 0) {
    gaps.push({ type: uischema.type, scope: uischema.scope })
    return
  }

  if (!Array.isArray(uischema.elements)) return

  // Les enfants d'un layout reçoivent **le même schéma** que lui : ce sont les testers
  // qui résolvent le `scope` eux-mêmes (`schemaMatches` appelle `resolveSchema`). Leur
  // passer un schéma déjà résolu leur ferait résoudre deux fois, et tout paraîtrait
  // non couvert.
  for (const child of uischema.elements) {
    walk(child, schema, rootSchema, gaps)
  }
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
  const summary = [...new Set(gaps.map((g) => `${g.type}${g.scope ? ` ${g.scope}` : ''}`))]
  console.log(`  ${name} → ${summary.join(', ')}`)
}
