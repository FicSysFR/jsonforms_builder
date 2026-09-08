import { describe, expect, it } from 'vitest'
import { assertAllowedDocsUrl, DEFAULT_DOCS_BASE_URL } from '../../mcp/src/docs-client'

describe('MCP documentation URL policy', () => {
  it('uses the FicSysFR Pages site by default', () => {
    expect(DEFAULT_DOCS_BASE_URL).toBe('https://ficsysfr.github.io/jsonforms_builder')
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
})
