import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { prepareRelease, validateReleaseRequest, verifyRelease } from '../release-state.mjs'

test('release request enforces version direction and channel semantics', () => {
  assert.doesNotThrow(() => validateReleaseRequest('2.0.1', '2.0.2', 'latest'))
  assert.doesNotThrow(() => validateReleaseRequest('2.0.2-rc.1', '2.0.2-rc.2', 'next'))
  assert.throws(() => validateReleaseRequest('2.0.2', '2.0.1', 'latest'), /older/)
  assert.throws(() => validateReleaseRequest('2.0.1', '2.0.2-rc.1', 'latest'), /prerelease/)
  assert.throws(() => validateReleaseRequest('2.0.1', '2.0.2', 'next'), /suffix/)
})

test('prepareRelease updates both packages and is idempotent', () => {
  const root = mkdtempSync(join(tmpdir(), 'jsonforms-release-'))
  try {
    mkdirSync(join(root, 'mcp'))
    mkdirSync(join(root, 'changelog'))
    writeFileSync(join(root, 'package.json'), '{"name":"lib","version":"2.0.1"}\n')
    writeFileSync(join(root, 'mcp', 'package.json'), '{"name":"mcp","version":"2.0.1"}\n')
    writeFileSync(join(root, 'changelog', '2.0.2.md'), 'entry\n')

    assert.equal(prepareRelease(root, '2.0.2', 'latest').changed, true)
    assert.equal(JSON.parse(readFileSync(join(root, 'package.json'))).version, '2.0.2')
    assert.equal(JSON.parse(readFileSync(join(root, 'mcp', 'package.json'))).version, '2.0.2')
    assert.equal(prepareRelease(root, '2.0.2', 'latest').changed, false)
    assert.doesNotThrow(() => verifyRelease(root, '2.0.2', 'latest'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('prepareRelease fails on mismatched package versions or missing notes', () => {
  const root = mkdtempSync(join(tmpdir(), 'jsonforms-release-'))
  try {
    mkdirSync(join(root, 'mcp'))
    mkdirSync(join(root, 'changelog'))
    writeFileSync(join(root, 'package.json'), '{"version":"2.0.1"}\n')
    writeFileSync(join(root, 'mcp', 'package.json'), '{"version":"2.0.0"}\n')
    assert.throws(() => prepareRelease(root, '2.0.2', 'latest'), /not aligned/)

    writeFileSync(join(root, 'mcp', 'package.json'), '{"version":"2.0.1"}\n')
    assert.throws(() => prepareRelease(root, '2.0.2', 'latest'), /missing changelog/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
