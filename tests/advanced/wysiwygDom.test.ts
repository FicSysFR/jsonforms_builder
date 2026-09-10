// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const vueNodeViewRenderer = vi.hoisted(() => vi.fn(() => 'vue-node-view-renderer'))

vi.mock('@tiptap/vue-3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tiptap/vue-3')>()),
  VueNodeViewRenderer: vueNodeViewRenderer,
}))
vi.mock('../../src/advanced/WysiwygImageUploadNode.vue', () => ({
  default: { name: 'WysiwygImageUploadNode' },
}))

import {
  ImageUpload,
  imageUploadHandler,
  readFileAsDataUrl,
} from '../../src/advanced/wysiwygImageUpload'
import { WysiwygResizableImage } from '../../src/advanced/wysiwygResizableImage'
import {
  ensureWysiwygImageResizeStyles,
  refreshWysiwygImageResizeStyles,
} from '../../src/advanced/wysiwygImageResizeStyles'

const STYLE_ID = 'jf-wysiwyg-image-resize'

beforeEach(() => {
  document.getElementById(STYLE_ID)?.remove()
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.getElementById(STYLE_ID)?.remove()
  vi.restoreAllMocks()
})

describe('WYSIWYG image upload extension', () => {
  it('parses and renders the placeholder node contract', () => {
    const parseHTML = ImageUpload.config.parseHTML
    const renderHTML = ImageUpload.config.renderHTML

    expect(parseHTML?.call({} as never)).toEqual([{ tag: 'div[data-type="image-upload"]' }])
    expect(
      renderHTML?.call({} as never, { HTMLAttributes: { class: 'dropzone' } } as never),
    ).toEqual(['div', { class: 'dropzone', 'data-type': 'image-upload' }])
  })

  it('inserts the placeholder through its command', () => {
    const insertContent = vi.fn(() => true)
    const addCommands = ImageUpload.config.addCommands
    const commands = addCommands?.call({ name: 'imageUpload' } as never)

    expect(commands?.insertImageUpload()?.({ commands: { insertContent } } as never)).toBe(true)
    expect(insertContent).toHaveBeenCalledWith({ type: 'imageUpload' })
  })

  it('binds the Vue node view and delegates toolbar handler behavior', () => {
    const addNodeView = ImageUpload.config.addNodeView
    expect(addNodeView?.call({} as never)).toBe('vue-node-view-renderer')
    expect(vueNodeViewRenderer).toHaveBeenCalledOnce()

    const insertContent = vi.fn(() => true)
    const focus = vi.fn(() => ({ insertContent }))
    const editor = {
      can: () => ({ insertContent }),
      chain: () => ({ focus }),
      isActive: vi.fn(() => true),
    }

    expect(imageUploadHandler.canExecute(editor as never)).toBe(true)
    expect(imageUploadHandler.execute(editor as never)).toBe(true)
    expect(imageUploadHandler.isActive(editor as never)).toBe(true)
    expect(imageUploadHandler.isDisabled).toBeUndefined()
    expect(insertContent).toHaveBeenCalledWith({ type: 'imageUpload' })
    expect(editor.isActive).toHaveBeenCalledWith('imageUpload')
  })

  it('reads a file as a data URL', async () => {
    await expect(
      readFileAsDataUrl(new File(['image'], 'image.png', { type: 'image/png' })),
    ).resolves.toMatch(/^data:image\/png;base64,/)
  })

  it('rejects reader errors and non-string results', async () => {
    class ControlledFileReader {
      static result: string | ArrayBuffer | null = null
      static error: DOMException | null = null
      result = ControlledFileReader.result
      error = ControlledFileReader.error
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      readAsDataURL() {
        if (this.error) this.onerror?.()
        else this.onload?.()
      }
    }
    vi.stubGlobal('FileReader', ControlledFileReader)

    await expect(readFileAsDataUrl(new File(['x'], 'invalid.bin'))).rejects.toThrow(
      'Impossible de lire le fichier image',
    )

    ControlledFileReader.error = new DOMException('Unreadable', 'NotReadableError')
    await expect(readFileAsDataUrl(new File(['x'], 'broken.bin'))).rejects.toMatchObject({
      name: 'NotReadableError',
    })
  })
})

describe('WYSIWYG resize styles', () => {
  it('injects the stylesheet once and refreshes it idempotently', () => {
    ensureWysiwygImageResizeStyles()
    ensureWysiwygImageResizeStyles()

    const first = document.getElementById(STYLE_ID)
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1)
    expect(first?.textContent).toContain('[data-resize-handle]')

    refreshWysiwygImageResizeStyles()
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1)
    expect(document.getElementById(STYLE_ID)).not.toBe(first)
  })

  it('is a no-op when no document is available', () => {
    vi.stubGlobal('document', undefined)

    expect(() => ensureWysiwygImageResizeStyles()).not.toThrow()
    expect(() => refreshWysiwygImageResizeStyles()).not.toThrow()
  })
})

describe('WYSIWYG resizable image node view', () => {
  const createRenderer = (parentView: unknown) => {
    const addNodeView = WysiwygResizableImage.config.addNodeView
    return addNodeView?.call({ parent: () => parentView } as never)
  }

  it('preserves the parent view contract and reapplies shrink-wrap styles', () => {
    const dom = document.createElement('div')
    const img = document.createElement('img')
    Object.defineProperty(img, 'complete', { configurable: true, value: false })
    dom.appendChild(img)
    const originalUpdate = vi.fn(() => true)
    const view = { dom, update: originalUpdate }
    const renderer = createRenderer(vi.fn(() => view))

    const result = renderer?.({} as never)
    expect(result).toBe(view)
    expect(dom.style.getPropertyValue('display')).toBe('inline-flex')
    expect(dom.style.getPropertyPriority('display')).toBe('important')
    expect(dom.style.getPropertyValue('max-width')).toBe('100%')

    dom.style.removeProperty('display')
    img.dispatchEvent(new Event('load'))
    expect(dom.style.getPropertyValue('display')).toBe('inline-flex')

    dom.style.removeProperty('width')
    expect(view.update({} as never, [] as never, {} as never)).toBe(true)
    expect(originalUpdate).toHaveBeenCalledOnce()
    expect(dom.style.getPropertyValue('width')).toBe('max-content')
  })

  it('returns null when the parent cannot create a node view', () => {
    const addNodeView = WysiwygResizableImage.config.addNodeView

    expect(addNodeView?.call({ parent: undefined } as never)).toBeNull()
    expect(addNodeView?.call({ parent: () => null } as never)).toBeNull()
  })

  it('leaves non-HTMLElement parent views unchanged', () => {
    const view = { dom: document.createTextNode('image') }
    const renderer = createRenderer(vi.fn(() => view))

    expect(renderer?.({} as never)).toBe(view)
  })
})
