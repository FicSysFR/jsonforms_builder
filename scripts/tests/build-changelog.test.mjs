import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  buildArtifacts,
  compareSemver,
  parseEntry,
  renderReleaseNotes,
} from '../build-changelog.mjs'

test('compareSemver follows numeric prerelease ordering', () => {
  assert.equal(compareSemver('2.0.2', '2.0.2-rc.10'), 1)
  assert.equal(compareSemver('2.0.2-rc.10', '2.0.2-rc.2'), 1)
  assert.equal(compareSemver('2.0.2-1', '2.0.2-beta'), -1)
})

test('parseEntry rejects invalid metadata and empty bodies', () => {
  assert.throws(() => parseEntry('body only', 'bad.md'), /frontmatter/)
  assert.throws(
    () => parseEntry('---\nversion: nope\ndate: 2026-09-08\ntitle: Bad\n---\n\nBody', 'bad.md'),
    /SemVer/,
  )
  assert.throws(
    () => parseEntry('---\nversion: 2.0.2\ndate: 08-09-2026\ntitle: Bad\n---\n\nBody', 'bad.md'),
    /YYYY-MM-DD/,
  )
  assert.throws(
    () => parseEntry('---\nversion: 2.0.2\ndate: 2026-02-30\ntitle: Bad\n---\n\nBody', 'bad.md'),
    /calendar date/,
  )
  assert.throws(
    () =>
      parseEntry(
        '---\nversion: 2.0.2-rc.1\ndate: 2026-09-08\ntitle: Bad\nprerelease: false\n---\n\nBody',
        'bad.md',
      ),
    /prerelease flag/,
  )
})

test('buildArtifacts sorts sources and renders exact release notes', () => {
  const root = mkdtempSync(join(tmpdir(), 'jsonforms-changelog-'))
  try {
    mkdirSync(join(root, 'changelog'))
    writeFileSync(
      join(root, 'changelog', '2.0.1.md'),
      '---\nversion: 2.0.1\ndate: 2026-08-11\ntitle: One\n---\n\nFirst body\n',
    )
    writeFileSync(
      join(root, 'changelog', '2.0.2.md'),
      '---\nversion: 2.0.2\ndate: 2026-09-08\ntitle: Two\nprevious: 2.0.1\n---\n\nSecond body\n',
    )

    const { entries, changelog } = buildArtifacts(root)
    assert.deepEqual(
      entries.map(({ version }) => version),
      ['2.0.2', '2.0.1'],
    )
    assert.match(changelog, /compare\/2\.0\.1\.\.\.2\.0\.2/)
    assert.equal(renderReleaseNotes(entries, '2.0.2'), '# Two\n\nSecond body\n')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('source filename must match its version', () => {
  const root = mkdtempSync(join(tmpdir(), 'jsonforms-changelog-'))
  try {
    mkdirSync(join(root, 'changelog'))
    writeFileSync(
      join(root, 'changelog', '2.0.2.md'),
      '---\nversion: 2.0.3\ndate: 2026-09-08\ntitle: Bad\n---\n\nBody\n',
    )
    assert.throws(() => buildArtifacts(root), /filename/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
