import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  fetchText,
  getDocsBaseUrl,
  loadLlmsFullTxt,
  loadLlmsTxt,
  searchDocsContent,
} from './docs-client.js'

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}

export function registerDocsTools(server: McpServer): void {
  server.registerTool(
    'list_doc_sources',
    {
      description:
        'List @ficsysfr/jsonforms_builder documentation sources by fetching the published llms.txt index.',
    },
    async () => {
      const base = getDocsBaseUrl()
      const { markdown, links } = await loadLlmsTxt(base)
      const summary = [
        `# JSONForms Builder docs`,
        ``,
        `Base: ${base}`,
        `Index: ${base}/llms.txt`,
        `Full bundle: ${base}/llms-full.txt`,
        ``,
        `Parsed links: ${links.length}`,
        ``,
        markdown,
      ].join('\n')
      return textResult(summary)
    },
  )

  server.registerTool(
    'search_docs',
    {
      description:
        'Search JSONForms Builder documentation. Returns matching page titles, URLs, and optional snippets. Prefer fetch_docs on the best URLs next.',
      inputSchema: {
        query: z.string().describe('Natural-language or keyword query'),
        limit: z.number().int().min(1).max(30).optional().describe('Max results (default 12)'),
      },
    },
    async ({ query, limit }) => {
      const base = getDocsBaseUrl()
      const { links } = await loadLlmsTxt(base)
      let fullText: string | undefined
      try {
        fullText = await loadLlmsFullTxt(base)
      } catch {
        // Index-only search still works if llms-full.txt is unavailable.
      }
      const results = searchDocsContent(query, links, fullText, limit ?? 12)
      if (results.length === 0) {
        return textResult(`No matches for "${query}". Try list_doc_sources or a broader query.`)
      }
      const body = results
        .map((r, i) => {
          const note = r.notes ? ` — ${r.notes}` : ''
          const snip = r.snippet ? `\n  snippet: ${r.snippet}` : ''
          return `${i + 1}. [${r.title}](${r.url})${note} (score ${r.score})${snip}`
        })
        .join('\n')
      return textResult(`Search results for "${query}":\n\n${body}`)
    },
  )

  server.registerTool(
    'fetch_docs',
    {
      description:
        'Fetch a documentation URL from the JSONForms Builder docs site (ficsysfr.github.io/jsonforms_builder or local DOCS_BASE_URL). Prefer .md / llms.txt URLs.',
      inputSchema: {
        url: z.string().url().describe('Absolute docs URL (must be on the allowed host)'),
      },
    },
    async ({ url }) => {
      const text = await fetchText(url)
      return textResult(text)
    },
  )
}
