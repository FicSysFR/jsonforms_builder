import assert from 'node:assert/strict'
import test from 'node:test'
import { PACKAGE_SPECS, validatePackResult } from '../package.mjs'

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
