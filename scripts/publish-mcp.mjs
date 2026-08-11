#!/usr/bin/env node
/**
 * Sync mcp/package.json version with the root package, build, and publish
 * `@tacxou/jsonforms_builder-mcp` with the given dist-tag.
 *
 * Usage: node scripts/publish-mcp.mjs [--tag latest|next]
 * Env: NODE_AUTH_TOKEN (npm), optional NEW_VERSION override
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mcpDir = join(root, 'mcp')

function parseArgs(argv) {
  let tag = 'latest'
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tag') tag = argv[++i] ?? 'latest'
  }
  return { tag }
}

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: 'inherit', cwd: opts.cwd ?? root, shell: opts.shell ?? false })
}

function main() {
  const { tag } = parseArgs(process.argv.slice(2))
  const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const version = process.env.NEW_VERSION?.trim() || rootPkg.version

  const mcpPkgPath = join(mcpDir, 'package.json')
  const mcpPkg = JSON.parse(readFileSync(mcpPkgPath, 'utf8'))
  if (mcpPkg.version !== version) {
    mcpPkg.version = version
    writeFileSync(mcpPkgPath, `${JSON.stringify(mcpPkg, null, 2)}\n`)
    console.log(`synced mcp/package.json → ${version}`)
  }

  console.log('Installing mcp dependencies…')
  run('yarn', ['install', '--frozen-lockfile'], { cwd: mcpDir, shell: true })

  console.log('Building mcp…')
  run('yarn', ['build'], { cwd: mcpDir, shell: true })

  const name = mcpPkg.name
  try {
    execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
      stdio: 'ignore',
      shell: true,
    })
    console.log(`${name}@${version} is already on npm — skipping publish.`)
    return
  } catch {
    // not published yet
  }

  console.log(`Publishing ${name}@${version} with dist-tag ${tag}`)
  run('npm', ['publish', '--access', 'public', '--tag', tag], { cwd: mcpDir, shell: true })
}

main()
