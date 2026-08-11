#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const RELEASE_FILES = ['package.json', 'CHANGELOG.md']
const NOTES_FILE = 'RELEASE_NOTES.md'

/** gh peut manquer du PATH de la session si l'IDE a démarré avant l'installation de GitHub CLI. */
function resolveGh() {
  const fromEnv = process.env.GH?.trim()
  if (fromEnv) return fromEnv

  const candidates = []
  if (process.platform === 'win32') {
    candidates.push(
      'C:/Program Files/GitHub CLI/gh.exe',
      'C:/Program Files (x86)/GitHub CLI/gh.exe',
    )
    if (process.env.LOCALAPPDATA) {
      candidates.push(`${process.env.LOCALAPPDATA}/Programs/GitHub CLI/gh.exe`)
    }
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  try {
    execSync('gh --version', { stdio: 'ignore', shell: true })
    return 'gh'
  } catch {
    console.error(
      `'gh' introuvable dans le PATH de cette session.\n` +
        `→ Redémarrez le terminal après l'installation de GitHub CLI.\n` +
        `→ Ou forcez le binaire : GH="C:/Program Files/GitHub CLI/gh.exe" make release VERSION=X.Y.Z`,
    )
    process.exit(1)
  }
}

function parseArgs(argv) {
  let version = ''
  let branch = 'main'
  let prerelease = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--version' || arg === '-v') {
      version = argv[++i] ?? ''
    } else if (arg === '--branch' || arg === '-b') {
      branch = argv[++i] ?? 'main'
    } else if (arg === '--prerelease' || arg === '-p') {
      prerelease = true
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/release.mjs --version X.Y.Z [--prerelease] [--branch main]')
      process.exit(0)
    }
  }

  return { version: version.trim(), branch: branch.trim() || 'main', prerelease }
}

function run(cmd, args, { useShell = false } = {}) {
  try {
    execFileSync(cmd, args, { stdio: 'inherit', shell: useShell })
  } catch (error) {
    console.error(`\nERROR: command failed: ${[cmd, ...args].join(' ')}`)
    process.exit(error.status ?? 1)
  }
}

function gitOutput(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function assertPackageVersion(version) {
  const current = JSON.parse(readFileSync('package.json', 'utf8')).version
  if (current === version) return
  console.error(`ERROR: package.json is at ${current}, not ${version}.`)
  console.error('→ Lancez le skill github-release pour bumper la version et le CHANGELOG.')
  process.exit(1)
}

function hasStagedChanges() {
  return gitOutput(['diff', '--cached', '--name-only']).length > 0
}

function tagExists(tag) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function warnUnrelatedChanges() {
  const releaseSet = new Set(RELEASE_FILES)
  const lines = gitOutput(['status', '--porcelain']).split('\n').filter(Boolean)
  const unrelated = lines.filter((line) => {
    const file = line.slice(3).trim().replace(/\\/g, '/')
    return !releaseSet.has(file) && file !== NOTES_FILE
  })

  if (unrelated.length > 0) {
    console.warn('WARNING: unrelated local changes (not included in the release commit):')
    for (const line of unrelated) console.warn(`  ${line}`)
  }
}

function main() {
  const { version, branch, prerelease } = parseArgs(process.argv.slice(2))

  if (!version) {
    console.error('ERROR: VERSION is required, e.g. make release VERSION=2.0.0 [PRERELEASE=1]')
    process.exit(1)
  }

  if (!existsSync(NOTES_FILE)) {
    console.error(
      `ERROR: ${NOTES_FILE} not found at repo root (the github-release skill writes it)`,
    )
    process.exit(1)
  }

  // Tags nus (X.Y.Z) : convention déjà en place sur les releases 1.0.0 → 1.0.3.
  const tag = version
  if (tagExists(tag)) {
    console.error(`ERROR: tag ${tag} already exists locally.`)
    process.exit(1)
  }

  assertPackageVersion(version)
  warnUnrelatedChanges()

  const releaseKind = prerelease ? 'prerelease (npm dist-tag next)' : 'stable (npm dist-tag latest)'
  const ghArgs = [
    'release',
    'create',
    tag,
    '--target',
    branch,
    '--title',
    tag,
    '--notes-file',
    NOTES_FILE,
  ]
  ghArgs.push(prerelease ? '--prerelease' : '--latest')

  console.log(`Releasing ${tag} — ${releaseKind} — on branch ${branch}...`)

  run('git', ['add', ...RELEASE_FILES.filter((file) => existsSync(file))])

  if (hasStagedChanges()) {
    run('git', ['commit', '-m', `chore(release): ${tag}`])
  } else {
    console.log('Release files already committed — skipping commit step.')
  }

  run('git', ['push', 'origin', branch])

  const gh = resolveGh()
  run(gh, ghArgs, { useShell: gh === 'gh' })

  console.log(
    `Release ${tag} publiée (${releaseKind}). Le workflow Publish construit et pousse le paquet sur npm.`,
  )
}

main()
