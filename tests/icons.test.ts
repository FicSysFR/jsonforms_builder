import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { icons as lucide } from '@iconify-json/lucide'
import { describe, expect, it } from 'vitest'
import { BUILDER_ICONS, CONTROL_ICONS, LIBRARY_ICONS, WYSIWYG_ICONS } from '../src/icons'

const root = join(__dirname, '..', 'src')

const filesUnder = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })

/** Icon names written in code, comments excluded (they cite example names). */
const iconsIn = (directories: string[]): string[] => {
  const found = new Set<string>()
  for (const file of directories.flatMap((directory) => filesUnder(join(root, directory)))) {
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    for (const match of code.matchAll(/i-lucide-[a-z0-9-]+/g)) found.add(match[0])
  }
  return [...found].sort()
}

const sorted = (icons: readonly string[]) => [...icons].sort()

describe('published icon lists', () => {
  it('match the icons the core renderers display', () => {
    expect(sorted(CONTROL_ICONS)).toEqual(
      iconsIn(['additional', 'common', 'composables', 'controls', 'layouts', 'utils']),
    )
  })

  it('match the icons of the WYSIWYG renderer and of the builder', () => {
    expect(sorted(WYSIWYG_ICONS)).toEqual(iconsIn(['advanced']))
    expect(sorted(BUILDER_ICONS)).toEqual(iconsIn(['builder']))
  })

  it('cover the whole library without duplicates', () => {
    const union = new Set([...CONTROL_ICONS, ...WYSIWYG_ICONS, ...BUILDER_ICONS])
    expect(sorted(LIBRARY_ICONS)).toEqual([...union].sort())
    expect(new Set(LIBRARY_ICONS).size).toBe(LIBRARY_ICONS.length)
  })

  it('name icons that exist in the Lucide collection', () => {
    const known = new Set([...Object.keys(lucide.icons), ...Object.keys(lucide.aliases ?? {})])
    const missing = LIBRARY_ICONS.filter((icon) => !known.has(icon.replace(/^i-lucide-/, '')))
    expect(missing).toEqual([])
  })
})
