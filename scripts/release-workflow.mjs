#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'

const WORKFLOW = 'release.yml'
const INCREMENTS = new Set(['none', 'major', 'minor', 'patch'])

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
        `→ Ou forcez le binaire : GH="C:/Program Files/GitHub CLI/gh.exe" make release-ci`,
    )
    process.exit(1)
  }
}

function parseBoolean(value, label) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  if (['1', 'true', 'yes', 'oui', 'y', 'o'].includes(normalized)) return true
  if (['0', 'false', 'no', 'non', 'n'].includes(normalized)) return false
  console.error(`ERROR: ${label} must be true or false (got "${value}")`)
  process.exit(1)
}

function parseArgs(argv) {
  let increment = 'none'
  let npm = 'true'
  let latest = 'true'
  let branch = 'main'
  let watch = false
  let yes = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--increment' || arg === '-i') {
      increment = argv[++i] ?? ''
    } else if (arg === '--npm' || arg === '-n') {
      npm = argv[++i] ?? ''
    } else if (arg === '--latest' || arg === '-l') {
      latest = argv[++i] ?? ''
    } else if (arg === '--branch' || arg === '-b') {
      branch = argv[++i] ?? 'main'
    } else if (arg === '--watch' || arg === '-w') {
      watch = true
    } else if (arg === '--yes' || arg === '-y') {
      yes = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/release-workflow.mjs [--increment none|patch|minor|major] [--npm true|false]\n' +
          '                                        [--latest true|false] [--branch main] [--watch] [--yes]',
      )
      process.exit(0)
    }
  }

  increment = increment.trim().toLowerCase()
  if (!INCREMENTS.has(increment)) {
    console.error(`ERROR: INCREMENT must be one of none, major, minor, patch (got "${increment}")`)
    process.exit(1)
  }

  return {
    increment,
    npm: parseBoolean(npm, 'NPM'),
    latest: parseBoolean(latest, 'LATEST'),
    branch: branch.trim() || 'main',
    watch,
    yes,
  }
}

function ghOutput(gh, args) {
  return execFileSync(gh, args, { encoding: 'utf8', shell: gh === 'gh' }).trim()
}

function run(gh, args) {
  try {
    execFileSync(gh, args, { stdio: 'inherit', shell: gh === 'gh' })
  } catch (error) {
    console.error(`\nERROR: command failed: ${[gh, ...args].join(' ')}`)
    process.exit(error.status ?? 1)
  }
}

function currentVersion() {
  return JSON.parse(readFileSync('package.json', 'utf8')).version
}

function nextVersion(current, increment) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (increment === 'none') return current
  if (increment === 'major') return `${major + 1}.0.0`
  if (increment === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

function localHeadMatchesRemote(branch) {
  try {
    const local = execFileSync('git', ['rev-parse', branch], { encoding: 'utf8' }).trim()
    const remote = execFileSync('git', ['rev-parse', `origin/${branch}`], {
      encoding: 'utf8',
    }).trim()
    return local === remote
  } catch {
    return true
  }
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase()
  rl.close()
  return answer === 'y' || answer === 'yes' || answer === 'o' || answer === 'oui'
}

/** L'API de dispatch ne renvoie pas d'id de run — on interroge les runs récents. */
async function findRun(gh, branch, since) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const raw = ghOutput(gh, [
      'run',
      'list',
      '--workflow',
      WORKFLOW,
      '--branch',
      branch,
      '--event',
      'workflow_dispatch',
      '--limit',
      '5',
      '--json',
      'databaseId,createdAt,url',
    ])
    const runs = JSON.parse(raw).filter((entry) => new Date(entry.createdAt).getTime() >= since)
    if (runs.length > 0) return runs[0]
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return null
}

async function main() {
  const { increment, npm, latest, branch, watch, yes } = parseArgs(process.argv.slice(2))
  const gh = resolveGh()
  const current = currentVersion()
  const target = nextVersion(current, increment)
  const channel = latest ? 'latest (stable)' : 'next (prerelease)'

  console.log(`Workflow  : ${WORKFLOW} (.github/actions/release)`)
  console.log(`Branch    : ${branch}`)
  console.log(`Increment : ${increment}`)
  console.log(
    `Version   : ${current} → ${target}${increment === 'none' ? ' (version déjà committée)' : ''}`,
  )
  console.log(`npm       : ${npm ? `oui, dist-tag ${latest ? 'latest' : 'next'}` : 'non'}`)
  console.log(`Canal     : ${channel}`)

  // Le workflow tourne sur le ref distant : un bump resté en local publierait l'ancienne version.
  if (!localHeadMatchesRemote(branch)) {
    console.warn(
      `\nWARNING: ${branch} local et origin/${branch} divergent — poussez vos commits avant de release.`,
    )
  }

  if (!yes && !(await confirm('\nDéclencher cette release sur GitHub ?'))) {
    console.log('Annulé.')
    process.exit(0)
  }

  const since = Date.now() - 5000
  run(gh, [
    'workflow',
    'run',
    WORKFLOW,
    '--ref',
    branch,
    '-f',
    `version_increment=${increment}`,
    '-f',
    `publish_npm=${npm}`,
    '-f',
    `latest=${latest}`,
  ])

  const workflowRun = await findRun(gh, branch, since)
  if (!workflowRun) {
    console.log('Release déclenchée. Suivi : gh run list --workflow release.yml')
    return
  }

  console.log(`\nRun: ${workflowRun.url}`)
  if (watch) {
    run(gh, ['run', 'watch', String(workflowRun.databaseId), '--exit-status'])
  }
}

main()
