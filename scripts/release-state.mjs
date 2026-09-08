#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareSemver, SEMVER_RE } from './build-changelog.mjs'

const PACKAGE_FILES = ['package.json', 'mcp/package.json']
const CHANNELS = new Set(['latest', 'next'])

export function validateReleaseRequest(current, target, channel) {
  if (!SEMVER_RE.test(current)) throw new Error(`current version is not SemVer: ${current}`)
  if (!SEMVER_RE.test(target)) throw new Error(`target version is not SemVer: ${target}`)
  if (!CHANNELS.has(channel)) throw new Error(`channel must be latest or next: ${channel}`)
  if (compareSemver(target, current) < 0) {
    throw new Error(`target ${target} is older than current ${current}`)
  }

  const prerelease = target.includes('-')
  if (channel === 'latest' && prerelease) {
    throw new Error('a prerelease version cannot use the latest channel')
  }
  if (channel === 'next' && !prerelease) {
    throw new Error('the next channel requires a SemVer prerelease suffix')
  }
}

function readPackages(root) {
  return PACKAGE_FILES.map((file) => ({
    file,
    path: resolve(root, file),
    manifest: JSON.parse(readFileSync(resolve(root, file), 'utf8')),
  }))
}

export function prepareRelease(root, target, channel, { write = true } = {}) {
  const packages = readPackages(root)
  const versions = new Set(packages.map(({ manifest }) => manifest.version))
  if (versions.size !== 1) throw new Error('library and MCP package versions are not aligned')

  const [current] = versions
  validateReleaseRequest(current, target, channel)

  const changelogSource = resolve(root, 'changelog', `${target}.md`)
  if (!existsSync(changelogSource)) throw new Error(`missing changelog/${target}.md`)

  const changed = current !== target
  if (changed && write) {
    for (const { path, manifest } of packages) {
      manifest.version = target
      writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    }
  }

  return { current, target, channel, changed }
}

export function verifyRelease(root, target, channel) {
  const state = prepareRelease(root, target, channel, { write: false })
  if (state.current !== target) {
    throw new Error(`package manifests are at ${state.current}, expected ${target}`)
  }
  return state
}

function parseArgs(argv) {
  const options = { command: argv[0] ?? '', version: '', channel: '', root: process.cwd() }
  for (let index = 1; index < argv.length; index++) {
    if (argv[index] === '--version') options.version = argv[++index] ?? ''
    else if (argv[index] === '--channel') options.channel = argv[++index] ?? ''
    else if (argv[index] === '--root') options.root = resolve(argv[++index] ?? process.cwd())
    else throw new Error(`unknown argument: ${argv[index]}`)
  }
  if (!['prepare', 'verify'].includes(options.command)) {
    throw new Error('command must be prepare or verify')
  }
  if (!options.version || !options.channel) {
    throw new Error('--version and --channel are required')
  }
  return options
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const state =
    options.command === 'prepare'
      ? prepareRelease(options.root, options.version, options.channel)
      : verifyRelease(options.root, options.version, options.channel)
  console.log(JSON.stringify(state))
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`ERROR: ${error.message}`)
    process.exit(1)
  }
}
