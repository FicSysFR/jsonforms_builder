import type { AnyExtension } from '@tiptap/core'
import { DEFAULT_TOOLBAR } from './wysiwygToolbar'

export type WysiwygContentType = 'html' | 'json'

export type WysiwygDensity = 'compact' | 'comfortable' | 'prose'

/** Nuxt UI editor handler map (kept loose — `@nuxt/ui` does not re-export the type). */
export type WysiwygHandlers = Record<string, unknown>

export type WysiwygImageResizeOptions = {
  enabled?: boolean
  directions?: Array<
    'top' | 'right' | 'bottom' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  >
  minWidth?: number
  minHeight?: number
  alwaysPreserveAspectRatio?: boolean
}

export type WysiwygImageOptions = {
  /** TipTap Image options passthrough (except `resize`, handled below). */
  allowBase64?: boolean
  inline?: boolean
  HTMLAttributes?: Record<string, unknown>
  /** `false` disables resize handles. */
  resize?: false | WysiwygImageResizeOptions
  /** Custom uploader — return a public URL (default: data URL). */
  upload?: (file: File) => Promise<string>
  accept?: string
  maxSize?: number
  label?: string
  description?: string
  /** Bubble toolbar on selected image (replace / delete). Default: `true`. */
  bubble?: boolean
}

/**
 * Uischema `options` accepted by the WYSIWYG renderer (`options.wysiwyg: true`).
 *
 * Flat legacy keys (`onImageUpload`, `imageMaxSize`, …) remain supported.
 */
export type WysiwygOptions = {
  wysiwyg?: boolean
  contentType?: WysiwygContentType
  placeholder?: string
  /** Debounce for `onChange` (ms). Default: `300`. */
  debounce?: number
  /**
   * Toolbar items (Nuxt UI `EditorToolbarItem[][]`), or `false` to hide.
   * Default: built-in French toolbar.
   */
  toolbar?: false | unknown[][]
  /** Spacing preset for the contenteditable. Default: `compact`. */
  density?: WysiwygDensity
  /** Extra classes on the contenteditable (`ui.base`), merged after density. */
  editorClass?: string
  /** Min-height utility/class. Default depends on density (`min-h-40` for compact). */
  minHeight?: string
  /** Padding utility/class on the contenteditable. Default: `p-3`. */
  padding?: string
  /** Block margin utility, e.g. `*:!my-1`. Overrides density spacing. */
  blockSpacing?: string
  /**
   * Images: `false` disables; `true` / omit uses defaults; object customizes upload + resize.
   */
  image?: boolean | WysiwygImageOptions
  /** @deprecated Prefer `image.upload`. */
  onImageUpload?: (file: File) => Promise<string>
  /** @deprecated Prefer `image.maxSize`. */
  imageMaxSize?: number
  /** @deprecated Prefer `image.accept`. */
  imageAccept?: string
  /** @deprecated Prefer `image.label`. */
  imageLabel?: string
  /** @deprecated Prefer `image.description`. */
  imageDescription?: string
  /** Extra TipTap extensions merged after the built-in image upload node. */
  extensions?: AnyExtension[]
  /** Extra / overriding Nuxt UI editor handlers. */
  handlers?: WysiwygHandlers
  hideRequiredAsterisk?: boolean
}

export type ResolvedWysiwygOptions = {
  contentType: WysiwygContentType
  placeholder?: string
  debounce: number
  toolbar: false | unknown[][]
  density: WysiwygDensity
  editorClass: string
  minHeight: string
  padding: string
  blockSpacing: string
  imagesEnabled: boolean
  imageBubble: boolean
  imageTipTap: Record<string, unknown>
  imageResize: WysiwygImageResizeOptions | false
  imageUpload: {
    upload?: (file: File) => Promise<string>
    accept: string
    maxSize: number
    label: string
    description: string
  }
  extensions: AnyExtension[]
  handlers?: WysiwygHandlers
}

const DENSITY_PRESETS: Record<
  WysiwygDensity,
  { minHeight: string; padding: string; blockSpacing: string }
> = {
  compact: { minHeight: 'min-h-40', padding: 'p-3', blockSpacing: '*:!my-1' },
  comfortable: { minHeight: 'min-h-52', padding: 'p-4', blockSpacing: '*:!my-2' },
  prose: { minHeight: 'min-h-64', padding: 'p-6', blockSpacing: '*:my-5 *:first:mt-0 *:last:mb-0' },
}

export const DEFAULT_IMAGE_RESIZE: WysiwygImageResizeOptions = {
  enabled: true,
  directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  minWidth: 48,
  minHeight: 48,
  alwaysPreserveAspectRatio: true,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Resolves uischema options + schema type into a flat runtime config.
 */
export const resolveWysiwygOptions = (
  raw: Record<string, unknown> | undefined,
  schemaType: unknown,
): ResolvedWysiwygOptions => {
  const opts = (raw ?? {}) as WysiwygOptions
  const density = opts.density ?? 'compact'
  const preset = DENSITY_PRESETS[density] ?? DENSITY_PRESETS.compact

  const explicitContent = opts.contentType
  const contentType: WysiwygContentType =
    explicitContent === 'html' || explicitContent === 'json'
      ? explicitContent
      : schemaType === 'string'
        ? 'html'
        : 'json'

  const imageOpt = opts.image
  const imagesEnabled = imageOpt !== false
  const imageCfg: WysiwygImageOptions = isRecord(imageOpt) ? imageOpt : {}

  const resizeOpt = imageCfg.resize
  const imageResize: WysiwygImageResizeOptions | false =
    resizeOpt === false
      ? false
      : {
          ...DEFAULT_IMAGE_RESIZE,
          ...(isRecord(resizeOpt) ? resizeOpt : {}),
          enabled: isRecord(resizeOpt) ? (resizeOpt.enabled ?? true) : true,
        }

  const {
    resize: _r,
    upload,
    accept,
    maxSize,
    label,
    description,
    bubble,
    ...imageTipTap
  } = imageCfg

  const resolvedMaxSize =
    typeof maxSize === 'number'
      ? maxSize
      : typeof opts.imageMaxSize === 'number'
        ? opts.imageMaxSize
        : 2 * 1024 * 1024

  const toolbar =
    opts.toolbar === false ? false : Array.isArray(opts.toolbar) ? opts.toolbar : DEFAULT_TOOLBAR

  return {
    contentType,
    placeholder: opts.placeholder,
    debounce: typeof opts.debounce === 'number' && opts.debounce >= 0 ? opts.debounce : 300,
    toolbar,
    density,
    editorClass: typeof opts.editorClass === 'string' ? opts.editorClass : '',
    minHeight: typeof opts.minHeight === 'string' ? opts.minHeight : preset.minHeight,
    padding: typeof opts.padding === 'string' ? opts.padding : preset.padding,
    blockSpacing: typeof opts.blockSpacing === 'string' ? opts.blockSpacing : preset.blockSpacing,
    imagesEnabled,
    imageBubble: imagesEnabled && bubble !== false,
    imageTipTap,
    imageResize,
    imageUpload: {
      upload: upload ?? opts.onImageUpload,
      accept: accept ?? opts.imageAccept ?? 'image/*',
      maxSize: resolvedMaxSize,
      label: label ?? opts.imageLabel ?? 'Ajouter une image',
      description:
        description ??
        opts.imageDescription ??
        `PNG, JPG, GIF ou WebP (max. ${Math.round(resolvedMaxSize / (1024 * 1024))} Mo)`,
    },
    extensions: Array.isArray(opts.extensions) ? opts.extensions : [],
    handlers: opts.handlers,
  }
}
