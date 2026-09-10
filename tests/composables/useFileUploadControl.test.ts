// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  buildDataUrl,
  dataUrlToFile,
  fileToDataUrl,
  formatFileSize,
  isMultipleFileSchema,
  parseDataUrl,
  resolveAccept,
  useFileUploadControl,
} from '../../src/composables/useFileUploadControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

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

describe('file/data URL conversions', () => {
  it('rebuilds a named File only from valid base64 data URLs', async () => {
    const file = dataUrlToFile('data:text/plain;name=note.txt;base64,aGVsbG8=')

    expect(file).toBeInstanceOf(File)
    expect(file).toMatchObject({ name: 'note.txt', type: 'text/plain', size: 5 })
    expect(dataUrlToFile('data:text/plain,hello')).toBeUndefined()
    expect(dataUrlToFile('data:text/plain;base64,%%%')).toBeUndefined()
  })

  it('preserves the file name when FileReader creates a data URL', async () => {
    const result = await fileToDataUrl(
      new File(['hello'], 'note finale.txt', { type: 'text/plain' }),
    )

    expect(result).toBe('data:text/plain;name=note%20finale.txt;base64,aGVsbG8=')
  })

  it('rejects FileReader failures', async () => {
    class FailingFileReader {
      error = new DOMException('Unreadable', 'NotReadableError')
      onerror: (() => void) | null = null
      onload: (() => void) | null = null

      readAsDataURL() {
        this.onerror?.()
      }
    }
    vi.stubGlobal('FileReader', FailingFileReader)

    await expect(fileToDataUrl(new File(['x'], 'broken.txt'))).rejects.toMatchObject({
      name: 'NotReadableError',
    })
  })
})

describe('useFileUploadControl', () => {
  const mountUpload = (overrides = {}, clearValue: unknown = null) =>
    mountControl(
      (jsonFormsControl) => useFileUploadControl({ jsonFormsControl, clearValue }),
      overrides,
    )

  it('hydrates a single file, emits a named data URL and ignores its own echo', async () => {
    const mounted = mountUpload({
      schema: { type: 'string', contentMediaType: 'text/plain' },
      data: 'data:text/plain;name=old.txt;base64,b2xk',
    })

    expect(mounted.result.multiple.value).toBe(false)
    expect(mounted.result.accept.value).toBe('text/plain')
    expect(mounted.result.modelValue.value).toMatchObject({ name: 'old.txt', size: 3 })

    const fresh = new File(['hello'], 'fresh.txt', { type: 'text/plain' })
    await mounted.result.onFilesChange(fresh)
    const emitted = mounted.handleChange.mock.calls[0]?.[1]

    expect(emitted).toBe('data:text/plain;name=fresh.txt;base64,aGVsbG8=')
    expect(mounted.result.summary.value).toBe('1 fichier · 5 o')

    mounted.state.value.data = emitted
    await nextTick()
    expect(mounted.result.modelValue.value).toBe(fresh)
    mounted.stop()
  })

  it('handles multiple files and clears an empty selection', async () => {
    const mounted = mountUpload(
      {
        schema: { type: 'array', items: { type: 'string', contentMediaType: 'text/plain' } },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { accept: 'image/png' },
        },
        data: ['data:text/plain;name=one.txt;base64,b25l', 'not-a-data-url', 42],
      },
      [],
    )

    expect(mounted.result.multiple.value).toBe(true)
    expect(mounted.result.accept.value).toBe('image/png')
    expect(mounted.result.files.value).toHaveLength(1)

    const files = [new File(['one'], 'one.txt'), new File(['two'], 'two.txt')]
    await mounted.result.onFilesChange(files)
    expect(mounted.handleChange.mock.calls[0]?.[1]).toHaveLength(2)
    expect(mounted.result.summary.value).toBe('2 fichiers · 6 o')

    await mounted.result.onFilesChange(null)
    expect(mounted.handleChange).toHaveBeenLastCalledWith('value', [])
    expect(mounted.result.summary.value).toBe('')
    mounted.stop()
  })
})
