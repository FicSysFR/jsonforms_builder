/**
 * Starts the playground (HMR) and VitePress docs together.
 * The docs page `/playground` iframes the live playground in DEV.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const playgroundDir = path.join(root, 'playground')
const viteJs = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const vitepressJs = path.join(root, 'node_modules', 'vitepress', 'bin', 'vitepress.js')

/** @type {import('node:child_process').ChildProcess[]} */
const children = []

const shutdown = (code = 0) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
  process.exit(code)
}

/**
 * Spawn Node entrypoints directly so `cwd` is honored (a `yarn vite` from
 * `playground/` would jump to the workspace root and load the library config).
 *
 * @param {string[]} args
 * @param {string} cwd
 */
const runNode = (args, cwd) => {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })
  children.push(child)
  child.on('exit', (code, signal) => {
    if (signal) {
      shutdown(0)
      return
    }
    if (code && code !== 0) {
      shutdown(code)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

// Playground first: docs iframe targets http://localhost:5174 in DEV.
runNode([viteJs, '--host', '--port', '5174'], playgroundDir)
runNode([vitepressJs, 'dev', 'docs', '--port', '5173'], root)
