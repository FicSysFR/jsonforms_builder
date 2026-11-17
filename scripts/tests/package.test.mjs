import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  BUNDLED_THIRD_PARTY_PACKAGES,
  PACKAGE_SPECS,
  validateLibraryManifest,
  validatePackResult,
  validateThirdPartyNotices,
} from '../package.mjs'

const libraryManifest = () =>
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

test('library manifest satisfies the published peer contract', () => {
  assert.doesNotThrow(() => validateLibraryManifest(libraryManifest()))
})

test('library manifest rejects a required or TypeScript 6 incompatible typescript peer', () => {
  const required = libraryManifest()
  required.peerDependencies.typescript = '^5 || ^6 || ^7'
  delete required.peerDependenciesMeta
  assert.throws(() => validateLibraryManifest(required), /typescript.*optional/)

  const outdated = libraryManifest()
  outdated.peerDependencies.typescript = '^5'
  assert.throws(() => validateLibraryManifest(outdated), /typescript.*\^5 \|\| \^6 \|\| \^7/)

  const absent = libraryManifest()
  delete absent.peerDependencies.typescript
  delete absent.peerDependenciesMeta?.typescript
  assert.doesNotThrow(() => validateLibraryManifest(absent))
})

function validResult(spec) {
  return {
    name: spec.name,
    version: '2.0.2',
    size: 100,
    unpackedSize: 200,
    files: spec.required.map((path) => ({ path, size: 1, mode: 0o644 })),
  }
}

test('package audit accepts the required public contract', () => {
  for (const spec of PACKAGE_SPECS) {
    assert.doesNotThrow(() => validatePackResult(validResult(spec), spec, '2.0.2'))
  }
})

test('package audit rejects missing, generated and secret files', () => {
  const spec = PACKAGE_SPECS[0]
  const missing = validResult(spec)
  missing.files = missing.files.filter(({ path }) => path !== 'dist/index.d.ts')
  assert.throws(() => validatePackResult(missing, spec, '2.0.2'), /missing required file/)

  const polluted = validResult(spec)
  polluted.files.push({ path: 'dist/.tsbuildinfo', size: 10, mode: 0o644 })
  polluted.files.push({ path: '.env.production', size: 10, mode: 0o600 })
  assert.throws(() => validatePackResult(polluted, spec, '2.0.2'), /forbidden file/)
})

test('package audit enforces name, version and size budgets', () => {
  const spec = PACKAGE_SPECS[1]
  const result = validResult(spec)
  result.name = '@wrong/package'
  result.version = '2.0.1'
  result.size = spec.maximumPackedSize + 1
  assert.throws(() => validatePackResult(result, spec, '2.0.2'), /expected package name/)
})

test('library package ships the third-party notices', () => {
  assert.ok(PACKAGE_SPECS[0].required.includes('THIRD_PARTY_NOTICES.md'))

  const unlisted = libraryManifest()
  unlisted.files = unlisted.files.filter((entry) => entry !== 'THIRD_PARTY_NOTICES.md')
  assert.throws(() => validateLibraryManifest(unlisted), /THIRD_PARTY_NOTICES\.md/)
})

test('third-party notices cover every package bundled into dist', () => {
  const notices = readFileSync(new URL('../../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8')
  assert.doesNotThrow(() => validateThirdPartyNotices(notices))
  assert.ok(BUNDLED_THIRD_PARTY_PACKAGES.includes('dayjs'))
  assert.throws(() => validateThirdPartyNotices(notices.replaceAll('dayjs', 'removed')), /dayjs/)
})
