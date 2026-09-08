#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { validateReleaseRequest } from './release-state.mjs'

const WORKFLOW = 'release.yml'

function resolveGh() {
  const configured = process.env.GH?.trim()
  if (configured) return configured

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
    throw new Error(
      `'gh' is unavailable. Restart the terminal or set GH to the GitHub CLI executable.`,
    )
  }
}

function parseArgs(argv) {
  const options = { version: '', channel: 'latest', watch: false, yes: false }
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--version' || argument === '-v') options.version = argv[++index] ?? ''
    else if (argument === '--channel' || argument === '-c') {
      options.channel = argv[++index] ?? ''
    } else if (argument === '--watch' || argument === '-w') options.watch = true
    else if (argument === '--yes' || argument === '-y') options.yes = true
    else if (argument === '--help' || argument === '-h') {
      console.log(
        'Usage: node scripts/release.mjs --version X.Y.Z [--channel latest|next] [--watch] [--yes]',
      )
      process.exit(0)
    } else throw new Error(`unknown argument: ${argument}`)
  }
  if (!options.version) throw new Error('--version is required')
  return options
}

function ghOutput(gh, args) {
  return execFileSync(gh, args, { encoding: 'utf8', shell: gh === 'gh' }).trim()
}

function run(gh, args) {
  execFileSync(gh, args, { stdio: 'inherit', shell: gh === 'gh' })
}

function gitOutput(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

async function confirm(question) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await prompt.question(`${question} [y/N] `)).trim().toLowerCase()
  prompt.close()
  return ['y', 'yes', 'o', 'oui'].includes(answer)
}

async function findRun(gh, since) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const runs = JSON.parse(
      ghOutput(gh, [
        'run',
        'list',
        '--workflow',
        WORKFLOW,
        '--branch',
        'main',
        '--event',
        'workflow_dispatch',
        '--limit',
        '5',
        '--json',
        'databaseId,createdAt,url',
      ]),
    ).filter((entry) => new Date(entry.createdAt).getTime() >= since)
    if (runs.length > 0) return runs[0]
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2000))
  }
  return null
}

async function main() {
  const { version, channel, watch, yes } = parseArgs(process.argv.slice(2))
  const current = JSON.parse(readFileSync('package.json', 'utf8')).version
  validateReleaseRequest(current, version, channel)
  if (!existsSync(`changelog/${version}.md`)) {
    throw new Error(`changelog/${version}.md is required before dispatch`)
  }

  const local = gitOutput(['rev-parse', 'main'])
  const remote = gitOutput(['rev-parse', 'origin/main'])
  if (local !== remote)
    throw new Error('main and origin/main differ; push or pull before releasing')
  if (gitOutput(['status', '--porcelain'])) throw new Error('the working tree must be clean')

  console.log(`Workflow : ${WORKFLOW}`)
  console.log(`Version  : ${current} → ${version}`)
  console.log(`Channel  : ${channel}`)
  console.log('Packages : @ficsysfr/jsonforms_builder + @ficsysfr/jsonforms_builder-mcp')

  if (!yes && !(await confirm('Dispatch this public npm release?'))) {
    console.log('Cancelled.')
    return
  }

  const gh = resolveGh()
  const since = Date.now() - 5000
  run(gh, [
    'workflow',
    'run',
    WORKFLOW,
    '--ref',
    'main',
    '-f',
    `version=${version}`,
    '-f',
    `channel=${channel}`,
  ])

  const workflowRun = await findRun(gh, since)
  if (!workflowRun) {
    console.log('Release dispatched. Follow it with: gh run list --workflow release.yml')
    return
  }
  console.log(`Run: ${workflowRun.url}`)
  if (watch) run(gh, ['run', 'watch', String(workflowRun.databaseId), '--exit-status'])
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`)
  process.exit(1)
})
