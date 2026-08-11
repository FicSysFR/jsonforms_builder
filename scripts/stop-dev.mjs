#!/usr/bin/env node
/**
 * Stop local Vite / VitePress / mock API servers started via `make dev`,
 * `make docs`, or `make docs-preview`.
 */
import { execSync } from 'node:child_process'

/** Playground Vite, VitePress docs, VitePress preview, Express mock API. */
const PORTS = [5174, 5173, 4173, 4000]

function pidsListeningOn(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync('netstat -ano', { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue
        const parts = line.trim().split(/\s+/)
        if (parts.length < 5) continue
        const local = parts[1]
        const pid = parts.at(-1)
        if (local.endsWith(`:${port}`) && /^\d+$/.test(pid) && pid !== '0') {
          pids.add(pid)
        }
      }
      return [...pids]
    } catch {
      return []
    }
  }

  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8' })
    return out.trim().split(/\s+/).filter(Boolean)
  } catch {
    return []
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
    } else {
      process.kill(Number(pid), 'SIGTERM')
    }
    return true
  } catch {
    return false
  }
}

const killed = new Set()
let stopped = 0

for (const port of PORTS) {
  for (const pid of pidsListeningOn(port)) {
    if (killed.has(pid)) continue
    if (killPid(pid)) {
      killed.add(pid)
      stopped += 1
      console.log(`Stopped PID ${pid} (port ${port})`)
    }
  }
}

if (stopped === 0) {
  console.log('No Vite / VitePress / mock API process found on ports', PORTS.join(', '))
} else {
  console.log(`Stopped ${stopped} process${stopped > 1 ? 'es' : ''}.`)
}
