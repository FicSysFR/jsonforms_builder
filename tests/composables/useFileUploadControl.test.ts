import { describe, expect, it } from 'vitest'
import {
  buildDataUrl,
  formatFileSize,
  isMultipleFileSchema,
  parseDataUrl,
  resolveAccept,
} from '../../src/composables/useFileUploadControl'

describe('parseDataUrl', () => {
  it('splits mime, name and payload', () => {
    const parsed = parseDataUrl('data:image/png;name=logo%20final.png;base64,AAAA')

    expect(parsed).toEqual({
      mime: 'image/png',
      name: 'logo final.png',
      payload: 'AAAA',
      isBase64: true,
    })
  })

  it('handles a data url without parameters', () => {
    expect(parseDataUrl('data:text/plain,bonjour')).toEqual({
      mime: 'text/plain',
      name: undefined,
      payload: 'bonjour',
      isBase64: false,
    })
  })

  it('defaults the mime type when omitted', () => {
    expect(parseDataUrl('data:;base64,AAAA')?.mime).toBe('application/octet-stream')
  })

  it('keeps a malformed name as-is rather than throwing', () => {
    expect(parseDataUrl('data:text/plain;name=100%;base64,AAAA')?.name).toBe('100%')
  })

  it('returns undefined for anything that is not a data url', () => {
    expect(parseDataUrl('https://example.org/logo.png')).toBeUndefined()
    expect(parseDataUrl(undefined)).toBeUndefined()
    expect(parseDataUrl(42)).toBeUndefined()
  })
})

describe('buildDataUrl', () => {
  it('round-trips with parseDataUrl', () => {
    const url = buildDataUrl({ mime: 'image/png', name: 'logo final.png', payload: 'AAAA' })

    expect(url).toBe('data:image/png;name=logo%20final.png;base64,AAAA')
    expect(parseDataUrl(url)?.name).toBe('logo final.png')
  })

  it('omits the name parameter when there is none', () => {
    expect(buildDataUrl({ payload: 'AAAA' })).toBe('data:application/octet-stream;base64,AAAA')
  })
})

describe('resolveAccept', () => {
  it('prefers the uischema option', () => {
    expect(resolveAccept('application/pdf', { type: 'string', contentMediaType: 'image/*' })).toBe(
      'application/pdf',
    )
  })

  it('falls back to contentMediaType', () => {
    expect(resolveAccept(undefined, { type: 'string', contentMediaType: 'image/*' })).toBe(
      'image/*',
    )
  })

  it('reads contentMediaType from the items schema', () => {
    expect(
      resolveAccept(undefined, {
        type: 'array',
        items: { type: 'string', contentMediaType: 'application/pdf' },
      }),
    ).toBe('application/pdf')
  })

  it('accepts everything by default', () => {
    expect(resolveAccept(undefined, undefined)).toBe('*')
    expect(resolveAccept('   ', { type: 'string' })).toBe('*')
  })
})

describe('isMultipleFileSchema', () => {
  it('detects an array schema', () => {
    expect(isMultipleFileSchema({ type: 'array' })).toBe(true)
    expect(isMultipleFileSchema({ type: 'string' })).toBe(false)
    expect(isMultipleFileSchema(undefined)).toBe(false)
  })
})

describe('formatFileSize', () => {
  it('scales to the right unit', () => {
    expect(formatFileSize(512)).toBe('512 o')
    expect(formatFileSize(2048)).toBe('2.0 ko')
    expect(formatFileSize(1024 * 1024 * 3.5)).toBe('3.5 Mo')
    expect(formatFileSize(1024 * 1024 * 42)).toBe('42 Mo')
  })

  it('returns an empty string for invalid sizes', () => {
    expect(formatFileSize(-1)).toBe('')
    expect(formatFileSize('abc')).toBe('')
  })
})
