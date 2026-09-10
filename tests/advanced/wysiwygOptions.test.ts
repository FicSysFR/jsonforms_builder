import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_IMAGE_RESIZE, resolveWysiwygOptions } from '../../src/advanced/wysiwygOptions'
import { DEFAULT_TOOLBAR } from '../../src/advanced/wysiwygToolbar'

describe('resolveWysiwygOptions', () => {
  it('derives safe defaults from the schema type', () => {
    const html = resolveWysiwygOptions(undefined, 'string')
    const json = resolveWysiwygOptions({}, 'object')

    expect(html).toMatchObject({
      contentType: 'html',
      debounce: 300,
      toolbar: DEFAULT_TOOLBAR,
      density: 'compact',
      editorClass: '',
      minHeight: 'min-h-40',
      padding: 'p-3',
      blockSpacing: '*:!my-1',
      imagesEnabled: true,
      imageBubble: true,
      imageResize: DEFAULT_IMAGE_RESIZE,
      imageUpload: {
        accept: 'image/*',
        maxSize: 2 * 1024 * 1024,
        label: 'Ajouter une image',
        description: 'PNG, JPG, GIF ou WebP (max. 2 Mo)',
      },
      extensions: [],
    })
    expect(json.contentType).toBe('json')
  })

  it('resolves density presets and explicit editor classes', () => {
    expect(resolveWysiwygOptions({ density: 'comfortable' }, 'object')).toMatchObject({
      minHeight: 'min-h-52',
      padding: 'p-4',
      blockSpacing: '*:!my-2',
    })
    expect(
      resolveWysiwygOptions(
        {
          density: 'prose',
          editorClass: 'font-serif',
          minHeight: 'min-h-96',
          padding: 'p-8',
          blockSpacing: '*:my-8',
        },
        'object',
      ),
    ).toMatchObject({
      editorClass: 'font-serif',
      minHeight: 'min-h-96',
      padding: 'p-8',
      blockSpacing: '*:my-8',
    })
  })

  it('validates content, debounce and toolbar options', () => {
    const customToolbar = [[{ kind: 'bold' }]]

    expect(
      resolveWysiwygOptions({ contentType: 'html', debounce: 0, toolbar: customToolbar }, 'object'),
    ).toMatchObject({ contentType: 'html', debounce: 0, toolbar: customToolbar })
    expect(resolveWysiwygOptions({ contentType: 'xml', debounce: -1 }, 'string')).toMatchObject({
      contentType: 'html',
      debounce: 300,
    })
    expect(resolveWysiwygOptions({ toolbar: false }, 'object').toolbar).toBe(false)
  })

  it('disables image behavior as one coherent option', () => {
    expect(resolveWysiwygOptions({ image: false }, 'object')).toMatchObject({
      imagesEnabled: false,
      imageBubble: false,
      imageTipTap: {},
      imageResize: DEFAULT_IMAGE_RESIZE,
    })
  })

  it('prefers modern nested image options over legacy aliases', () => {
    const modernUpload = vi.fn()
    const legacyUpload = vi.fn()
    const extension = { name: 'custom' } as never
    const handlers = { custom: vi.fn() }
    const resolved = resolveWysiwygOptions(
      {
        image: {
          upload: modernUpload,
          accept: 'image/webp',
          maxSize: 3 * 1024 * 1024,
          label: 'Téléverser',
          description: 'WebP uniquement',
          bubble: false,
          inline: true,
          allowBase64: true,
          HTMLAttributes: { loading: 'lazy' },
          resize: { minWidth: 96, enabled: false },
        },
        onImageUpload: legacyUpload,
        imageAccept: 'image/png',
        imageMaxSize: 10,
        imageLabel: 'Legacy',
        imageDescription: 'Legacy description',
        extensions: [extension],
        handlers,
      },
      'object',
    )

    expect(resolved.imageUpload).toEqual({
      upload: modernUpload,
      accept: 'image/webp',
      maxSize: 3 * 1024 * 1024,
      label: 'Téléverser',
      description: 'WebP uniquement',
    })
    expect(resolved.imageBubble).toBe(false)
    expect(resolved.imageTipTap).toEqual({
      inline: true,
      allowBase64: true,
      HTMLAttributes: { loading: 'lazy' },
    })
    expect(resolved.imageResize).toMatchObject({ minWidth: 96, enabled: false })
    expect(resolved.extensions).toEqual([extension])
    expect(resolved.handlers).toBe(handlers)
  })

  it('supports legacy image options and an explicitly disabled resize', () => {
    const upload = vi.fn()
    const resolved = resolveWysiwygOptions(
      {
        image: { resize: false },
        onImageUpload: upload,
        imageAccept: 'image/gif',
        imageMaxSize: 512,
        imageLabel: 'Legacy',
        imageDescription: 'Small image',
      },
      'object',
    )

    expect(resolved.imageResize).toBe(false)
    expect(resolved.imageUpload).toEqual({
      upload,
      accept: 'image/gif',
      maxSize: 512,
      label: 'Legacy',
      description: 'Small image',
    })
  })
})
