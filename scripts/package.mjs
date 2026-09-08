#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactRoot = join(root, '.artifacts')
const outputDirectory = join(artifactRoot, 'npm')
const resolvedCommands = new Map()

export const PACKAGE_SPECS = [
  {
    directory: root,
    name: '@ficsysfr/jsonforms_builder',
    required: [
      'package.json',
      'README.md',
      'LICENSE',
      'dist/index.d.ts',
      'dist/json-formbuilder.es.js',
      'dist/json-formbuilder.cjs.js',
      'src/index.ts',
    ],
    forbidden: [
      /^dist\/(?:package\.json|README\.md|LICENSE)$/,
      /\.tsbuildinfo$/,
      /^(?:tests|docs|coverage|node_modules|\.git)(?:\/|$)/,
      /(?:^|\/)\.env(?:\.|$)/,
    ],
    maximumPackedSize: 750_000,
    maximumUnpackedSize: 3_000_000,
  },
  {
    directory: join(root, 'mcp'),
    name: '@ficsysfr/jsonforms_builder-mcp',
    required: ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/index.d.ts'],
    forbidden: [
      /\.tsbuildinfo$/,
      /^(?:src|tests|coverage|node_modules|\.git)(?:\/|$)/,
      /(?:^|\/)\.env(?:\.|$)/,
    ],
    maximumPackedSize: 100_000,
    maximumUnpackedSize: 250_000,
  },
]

function resolveCommand(command) {
  if (process.platform !== 'win32' || !['npm', 'yarn'].includes(command)) {
    return { executable: command, prefix: [] }
  }
  if (resolvedCommands.has(command)) return resolvedCommands.get(command)

  const wrappers = execFileSync('where.exe', [`${command}.cmd`], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
  const cli = wrappers
    .map((wrapper) =>
      join(
        dirname(wrapper),
        'node_modules',
        command,
        command === 'npm' ? 'bin/npm-cli.js' : 'bin/yarn.js',
      ),
    )
    .find(existsSync)
  if (!cli) throw new Error(`cannot resolve ${command} CLI from ${wrappers.join(', ')}`)

  const resolved = { executable: process.execPath, prefix: [cli] }
  resolvedCommands.set(command, resolved)
  return resolved
}

function run(command, args, options = {}) {
  const { executable, prefix } = resolveCommand(command)
  const environment = { ...process.env }
  if (command === 'npm') {
    for (const key of [
      'npm_config_argv',
      'npm_config_version_commit_hooks',
      'npm_config_version_git_message',
      'npm_config_version_git_tag',
      'npm_config_version_tag_prefix',
    ]) {
      delete environment[key]
    }
  }
  return execFileSync(executable, [...prefix, ...args], {
    cwd: options.cwd ?? root,
    encoding: options.encoding,
    stdio: options.encoding ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: environment,
  })
}

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

function assertArtifactOutput(path) {
  const resolved = resolve(path)
  const insideArtifactRoot =
    resolved === artifactRoot || resolved.startsWith(`${artifactRoot}${sep}`)
  if (!insideArtifactRoot) {
    throw new Error(`refusing to clear an output outside ${artifactRoot}: ${resolved}`)
  }
}

export function validatePackResult(result, spec, expectedVersion) {
  const errors = []
  const paths = new Set(result.files.map((file) => normalizePath(file.path)))

  if (result.name !== spec.name)
    errors.push(`expected package name ${spec.name}, got ${result.name}`)
  if (result.version !== expectedVersion) {
    errors.push(`expected version ${expectedVersion}, got ${result.version}`)
  }
  for (const required of spec.required) {
    if (!paths.has(required)) errors.push(`missing required file ${required}`)
  }
  for (const path of paths) {
    if (spec.forbidden.some((pattern) => pattern.test(path))) {
      errors.push(`forbidden file ${path}`)
    }
  }
  if (result.size > spec.maximumPackedSize) {
    errors.push(`packed size ${result.size} exceeds ${spec.maximumPackedSize}`)
  }
  if (result.unpackedSize > spec.maximumUnpackedSize) {
    errors.push(`unpacked size ${result.unpackedSize} exceeds ${spec.maximumUnpackedSize}`)
  }
  if (errors.length > 0) throw new Error(`${spec.name}:\n- ${errors.join('\n- ')}`)
}

function validateManifests() {
  const manifests = PACKAGE_SPECS.map((spec) => ({
    spec,
    manifest: JSON.parse(readFileSync(join(spec.directory, 'package.json'), 'utf8')),
  }))
  const version = manifests[0].manifest.version

  for (const { spec, manifest } of manifests) {
    if (manifest.name !== spec.name) throw new Error(`${spec.name}: package.json name mismatch`)
    if (manifest.version !== version) throw new Error(`${spec.name}: version must match ${version}`)
    if (manifest.repository !== 'https://github.com/FicSysFR/jsonforms_builder.git') {
      throw new Error(`${spec.name}: repository must match the GitHub trusted publisher`)
    }
    if (manifest.publishConfig?.access !== 'public') {
      throw new Error(`${spec.name}: publishConfig.access must be public`)
    }
  }

  const library = manifests[0].manifest
  for (const target of [
    library.main,
    library.module,
    library.types,
    library.exports?.['.']?.import,
    library.exports?.['.']?.require,
    library.exports?.['.']?.types,
    library.exports?.['./source'],
  ]) {
    if (!target || !existsSync(join(root, target))) {
      throw new Error(`library export target does not exist: ${target ?? '<missing>'}`)
    }
  }

  const mcp = manifests[1].manifest
  const binary = mcp.bin?.['jsonforms-builder-mcp']
  if (!binary || !existsSync(join(PACKAGE_SPECS[1].directory, binary))) {
    throw new Error('MCP binary target is missing')
  }
  if (
    !readFileSync(join(PACKAGE_SPECS[1].directory, binary), 'utf8').startsWith(
      '#!/usr/bin/env node',
    )
  ) {
    throw new Error('MCP binary must retain its node shebang')
  }

  return version
}

function pack(spec, version) {
  const raw = run('npm', ['pack', '--json', '--pack-destination', outputDirectory], {
    cwd: spec.directory,
    encoding: 'utf8',
  })
  const [result] = JSON.parse(raw)
  validatePackResult(result, spec, version)
  const path = join(outputDirectory, result.filename)
  if (!existsSync(path)) throw new Error(`${spec.name}: npm did not create ${path}`)
  return { ...result, path }
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

async function smokeMcp(entrypoint, workingDirectory) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [entrypoint], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let outcome
    let stopping = false

    const stop = (error) => {
      if (stopping) return
      stopping = true
      outcome = error
      clearTimeout(timer)
      child.stdin.end()
      child.kill()
    }

    const timer = setTimeout(() => {
      stop(new Error(`MCP initialize timed out${stderr ? `: ${stderr}` : ''}`))
    }, 10_000)

    child.once('close', (code) => {
      clearTimeout(timer)
      if (!stopping) {
        outcome = new Error(
          `MCP process exited before initialization (code ${code})${stderr ? `: ${stderr}` : ''}`,
        )
      }
      if (outcome) reject(outcome)
      else resolvePromise()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', stop)
    child.stdout.on('data', (chunk) => {
      if (stopping) return
      stdout += chunk.toString()
      const line = stdout.split(/\r?\n/).find(Boolean)
      if (!line) return
      try {
        const response = JSON.parse(line)
        if (response.id !== 1 || !response.result?.serverInfo) {
          stop(new Error(`unexpected MCP initialize response: ${line}`))
        } else stop()
      } catch (error) {
        stop(error)
      }
    })

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'package-smoke', version: '1.0.0' },
        },
      })}\n`,
    )
  })
}

async function smokeInstalledTarballs(artifacts, version) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'jsonforms-package-smoke-'))
  try {
    writeFileSync(
      join(temporaryRoot, 'package.json'),
      `${JSON.stringify({ name: 'jsonforms-package-smoke', version: '1.0.0', private: true }, null, 2)}\n`,
    )
    run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
        artifacts[0].path,
        artifacts[1].path,
      ],
      { cwd: temporaryRoot },
    )

    const consumer = join(temporaryRoot, 'consumer.mjs')
    writeFileSync(
      consumer,
      `import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const esm = fileURLToPath(import.meta.resolve('@ficsysfr/jsonforms_builder'))
const source = fileURLToPath(import.meta.resolve('@ficsysfr/jsonforms_builder/source'))
const cjs = require.resolve('@ficsysfr/jsonforms_builder')
if (!esm.endsWith('json-formbuilder.es.js')) throw new Error('ESM export mismatch: ' + esm)
if (!cjs.endsWith('json-formbuilder.cjs.js')) throw new Error('CJS export mismatch: ' + cjs)
if (!source.endsWith(join('src', 'index.ts'))) throw new Error('source export mismatch: ' + source)
const packageRoot = dirname(dirname(esm))
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
if (manifest.version !== '${version}') throw new Error('installed version mismatch')
if (!existsSync(join(packageRoot, manifest.types))) throw new Error('types entry is missing')
`,
    )
    run(process.execPath, [consumer], { cwd: temporaryRoot })

    const installedMcp = join(
      temporaryRoot,
      'node_modules',
      '@ficsysfr',
      'jsonforms_builder-mcp',
      'dist',
      'index.js',
    )
    const binaryLink = join(
      temporaryRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'jsonforms-builder-mcp.cmd' : 'jsonforms-builder-mcp',
    )
    if (!existsSync(binaryLink)) throw new Error('installed MCP binary link is missing')
    await smokeMcp(installedMcp, temporaryRoot)
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

function build() {
  run('yarn', ['build'])
  run('yarn', ['--cwd', 'mcp', 'install', '--frozen-lockfile'])
  run('yarn', ['--cwd', 'mcp', 'build'])
}

async function main() {
  const unknown = process.argv.slice(2).filter((argument) => argument !== '--check')
  if (unknown.length > 0) throw new Error(`unknown argument(s): ${unknown.join(', ')}`)

  build()
  const version = validateManifests()
  assertArtifactOutput(outputDirectory)
  rmSync(outputDirectory, { recursive: true, force: true })
  mkdirSync(outputDirectory, { recursive: true })

  const artifacts = PACKAGE_SPECS.map((spec) => pack(spec, version))
  await smokeInstalledTarballs(artifacts, version)

  const checksumLines = artifacts
    .map((artifact) => `${sha256File(artifact.path)}  ${basename(artifact.path)}`)
    .sort()
  const checksumPath = join(outputDirectory, 'SHA256SUMS.txt')
  writeFileSync(checksumPath, `${checksumLines.join('\n')}\n`, 'utf8')

  for (const artifact of artifacts) {
    console.log(
      `${artifact.name}@${artifact.version}: ${normalizePath(relative(root, artifact.path))} ` +
        `(${artifact.entryCount} files, ${artifact.size} bytes)`,
    )
  }
  console.log(`Checksums: ${normalizePath(relative(root, checksumPath))}`)

  for (const artifact of artifacts) {
    if (statSync(artifact.path).size !== artifact.size) {
      throw new Error(`${artifact.name}: packed size changed after npm pack`)
    }
  }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`ERROR: ${error.message}`)
    process.exit(1)
  })
}
