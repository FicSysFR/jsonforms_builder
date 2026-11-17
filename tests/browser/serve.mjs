#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Serves the built recipe page under the strictest CSP a host can ship: no `'unsafe-inline'`,
 * no `'unsafe-eval'`, no `data:` and nothing but this origin.
 */
export const STRICT_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  // `'report-sample'` names the blocked inline style in reports, so the recipe can attribute it.
  "style-src 'self' 'report-sample'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '.dist')
const port = Number(process.env.RECIPE_PORT ?? 4319)

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  let file = normalize(join(root, pathname === '/' ? 'index.html' : pathname))
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(root, 'index.html')
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'content-security-policy': STRICT_CSP,
    'cache-control': 'no-store',
  })
  createReadStream(file).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`CSP recipe on http://127.0.0.1:${port}`)
})
