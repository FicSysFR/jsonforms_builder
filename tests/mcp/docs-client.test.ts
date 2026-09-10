import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertAllowedDocsUrl,
  DEFAULT_DOCS_BASE_URL,
  fetchText,
  getDocsBaseUrl,
  loadLlmsFullTxt,
  loadLlmsTxt,
  parseLlmsIndex,
  searchDocsContent,
} from '../../mcp/src/docs-client'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('MCP documentation URL policy', () => {
  it('uses the FicSysFR Pages site by default', () => {
    expect(DEFAULT_DOCS_BASE_URL).toBe('https://ficsysfr.github.io/jsonforms_builder')
    expect(getDocsBaseUrl()).toBe(DEFAULT_DOCS_BASE_URL)
  })

  it('normalizes a configured documentation base URL', () => {
    vi.stubEnv('DOCS_BASE_URL', '  http://localhost:4173/docs///  ')

    expect(getDocsBaseUrl()).toBe('http://localhost:4173/docs')
  })

  it('accepts documentation URLs inside the FicSysFR project path', () => {
    expect(
      assertAllowedDocsUrl(
        'https://ficsysfr.github.io/jsonforms_builder/llms.txt',
        DEFAULT_DOCS_BASE_URL,
      ).href,
    ).toBe('https://ficsysfr.github.io/jsonforms_builder/llms.txt')
  })

  it('rejects the retired Pages host and paths outside the project', () => {
    expect(() =>
      assertAllowedDocsUrl(
        'https://tacxou.github.io/jsonforms_builder/llms.txt',
        DEFAULT_DOCS_BASE_URL,
      ),
    ).toThrow(/Host not allowed/)
    expect(() =>
      assertAllowedDocsUrl('https://ficsysfr.github.io/another-project/llms.txt'),
    ).toThrow(/Path outside docs base/)
  })

  it('rejects malformed URLs and unsupported protocols', () => {
    expect(() => assertAllowedDocsUrl('not a url')).toThrow('Invalid URL: not a url')
    expect(() => assertAllowedDocsUrl('file:///tmp/llms.txt')).toThrow(
      'Unsupported protocol: file:',
    )
  })

  it('accepts local preview hosts and enforces a custom Pages base path', () => {
    expect(assertAllowedDocsUrl('http://localhost:4173/llms.txt').hostname).toBe('localhost')
    expect(assertAllowedDocsUrl('http://127.0.0.1:4173/docs/llms.txt').hostname).toBe('127.0.0.1')
    expect(
      assertAllowedDocsUrl(
        'https://ficsysfr.github.io/custom/llms.txt',
        'https://ficsysfr.github.io/custom',
      ).pathname,
    ).toBe('/custom/llms.txt')
    expect(() =>
      assertAllowedDocsUrl(
        'https://ficsysfr.github.io/jsonforms_builder/llms.txt',
        'https://ficsysfr.github.io/custom',
      ),
    ).toThrow(/Path outside docs base/)
  })
})

describe('MCP documentation fetching', () => {
  it('returns a successful text response from an allowed URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('# Documentation'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchText(`${DEFAULT_DOCS_BASE_URL}/llms.txt`)).resolves.toBe('# Documentation')
    expect(fetchMock).toHaveBeenCalledWith(new URL(`${DEFAULT_DOCS_BASE_URL}/llms.txt`))
  })

  it('rejects non-successful HTTP responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })))

    await expect(fetchText(`${DEFAULT_DOCS_BASE_URL}/llms.txt`)).rejects.toThrow(
      `HTTP 503 fetching ${DEFAULT_DOCS_BASE_URL}/llms.txt`,
    )
  })

  it('loads the index and full documentation endpoints', async () => {
    const markdown = '- [Guide](https://ficsysfr.github.io/jsonforms_builder/guide.md): Start here'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(markdown))
      .mockResolvedValueOnce(new Response('# Full docs'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadLlmsTxt()).resolves.toEqual({
      markdown,
      links: [
        {
          title: 'Guide',
          url: 'https://ficsysfr.github.io/jsonforms_builder/guide.md',
          notes: 'Start here',
        },
      ],
    })
    await expect(loadLlmsFullTxt()).resolves.toBe('# Full docs')
    expect(fetchMock).toHaveBeenNthCalledWith(1, new URL(`${DEFAULT_DOCS_BASE_URL}/llms.txt`))
    expect(fetchMock).toHaveBeenNthCalledWith(2, new URL(`${DEFAULT_DOCS_BASE_URL}/llms-full.txt`))
  })
})

describe('MCP documentation index and search', () => {
  const links = [
    {
      title: 'Form builder guide',
      url: 'https://ficsysfr.github.io/jsonforms_builder/guide/builder.md',
      notes: 'Create nested forms',
    },
    {
      title: 'Renderer catalogue',
      url: 'https://ficsysfr.github.io/jsonforms_builder/guide/renderers.md',
    },
    {
      title: 'API reference',
      url: 'https://ficsysfr.github.io/jsonforms_builder/api.md',
      notes: 'Public exports',
    },
  ]

  it('parses valid Markdown entries and ignores unrelated lines', () => {
    expect(
      parseLlmsIndex(`
# Sources
- [ Builder ]( https://example.test/builder ): Nested forms
not a link
- [API](https://example.test/api)
`),
    ).toEqual([
      { title: 'Builder', url: 'https://example.test/builder', notes: 'Nested forms' },
      { title: 'API', url: 'https://example.test/api', notes: undefined },
    ])
  })

  it('returns the first limited entries for an empty effective query', () => {
    expect(searchDocsContent(' a I ', links, undefined, 2)).toEqual([
      { ...links[0], score: 0 },
      { ...links[1], score: 0 },
    ])
  })

  it('ranks title matches and adds a compact full-text snippet', () => {
    const fullText = `${'x'.repeat(100)} Builder workflows create forms safely. ${'y'.repeat(150)}`
    const results = searchDocsContent('builder forms', links, fullText)

    expect(results[0]).toMatchObject({
      title: 'Form builder guide',
      score: 9,
    })
    expect(results[0].snippet).toContain('Builder workflows create forms safely.')
    expect(results[0].snippet?.length).toBeLessThan(fullText.length)
  })

  it('returns no result when no term matches metadata or full text', () => {
    expect(searchDocsContent('unrelated', links, 'nothing useful here')).toEqual([])
  })
})
