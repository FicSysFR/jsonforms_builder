/** Default published docs origin (no trailing slash). */
export const DEFAULT_DOCS_BASE_URL = 'https://tacxou.github.io/jsonforms_builder'

const ALLOWED_HOSTS = new Set(['tacxou.github.io', '127.0.0.1', 'localhost'])

export type DocLink = {
  title: string
  url: string
  notes?: string
}

export function getDocsBaseUrl(): string {
  const raw = process.env.DOCS_BASE_URL?.trim() || DEFAULT_DOCS_BASE_URL
  return raw.replace(/\/+$/, '')
}

export function assertAllowedDocsUrl(urlString: string, baseUrl = getDocsBaseUrl()): URL {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error(`Invalid URL: ${urlString}`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${url.protocol}`)
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Host not allowed: ${url.hostname}. Allowed: ${[...ALLOWED_HOSTS].join(', ')}`)
  }

  // Production Pages docs live under /jsonforms_builder/; local preview may use /
  if (url.hostname === 'tacxou.github.io') {
    const basePath = new URL(baseUrl).pathname.replace(/\/+$/, '') || '/jsonforms_builder'
    if (!url.pathname.startsWith(`${basePath}/`) && url.pathname !== basePath) {
      throw new Error(`Path outside docs base (${basePath}): ${url.pathname}`)
    }
  }

  return url
}

export async function fetchText(urlString: string, baseUrl = getDocsBaseUrl()): Promise<string> {
  const url = assertAllowedDocsUrl(urlString, baseUrl)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url.href}`)
  }
  return response.text()
}

/** Parse markdown list entries: `- [title](url): notes` */
export function parseLlmsIndex(markdown: string): DocLink[] {
  const links: DocLink[] = []
  const re = /^-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.*))?$/gm
  for (;;) {
    const match = re.exec(markdown)
    if (match === null) break
    links.push({
      title: match[1].trim(),
      url: match[2].trim(),
      notes: match[3]?.trim() || undefined,
    })
  }
  return links
}

export async function loadLlmsTxt(baseUrl = getDocsBaseUrl()): Promise<{
  markdown: string
  links: DocLink[]
}> {
  const markdown = await fetchText(`${baseUrl}/llms.txt`, baseUrl)
  return { markdown, links: parseLlmsIndex(markdown) }
}

export async function loadLlmsFullTxt(baseUrl = getDocsBaseUrl()): Promise<string> {
  return fetchText(`${baseUrl}/llms-full.txt`, baseUrl)
}

export function searchDocsContent(
  query: string,
  links: DocLink[],
  fullText?: string,
  limit = 12,
): Array<DocLink & { score: number; snippet?: string }> {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)

  if (terms.length === 0) {
    return links.slice(0, limit).map((link) => ({ ...link, score: 0 }))
  }

  const scored = links.map((link) => {
    const hay = `${link.title} ${link.notes ?? ''} ${link.url}`.toLowerCase()
    let score = 0
    for (const term of terms) {
      if (hay.includes(term)) score += 3
      if (link.title.toLowerCase().includes(term)) score += 2
    }

    let snippet: string | undefined
    if (fullText) {
      const lower = fullText.toLowerCase()
      for (const term of terms) {
        const idx = lower.indexOf(term)
        if (idx >= 0) {
          const start = Math.max(0, idx - 80)
          const end = Math.min(fullText.length, idx + term.length + 120)
          snippet = fullText.slice(start, end).replace(/\s+/g, ' ').trim()
          score += 1
          break
        }
      }
    }

    return { ...link, score, snippet }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
