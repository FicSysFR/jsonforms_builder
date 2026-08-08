<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-editor(
      v-bind="uiProps('editor')"
      :model-value="control.data"
      :content-type="contentType"
      :editable="!isDisabled && !isReadonly"
      :placeholder="appliedOptions.placeholder"
      :image="false"
      :extensions="editorExtensions"
      :handlers="editorHandlers"
      :class="[styles.control.input, 'rounded-md border border-default']"
      :ui="editorUi"
      @update:model-value="onChange"
    )
      template(#default="{ editor }")
        u-editor-toolbar.sticky.top-0.z-10.rounded-t-md.border-b.border-default.bg-default.p-1(
          :editor="editor"
          :items="toolbarItems"
        )
        u-editor-toolbar(
          v-if="imagesEnabled && !isDisabled && !isReadonly"
          :editor="editor"
          :items="imageBubbleItems(editor)"
          layout="bubble"
          :should-show="shouldShowImageBubble"
        )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  or,
  isObjectControl,
  isStringControl,
  optionIs,
} from '@jsonforms/core'
import { computed, defineComponent, onMounted, provide, type Component } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import type { Editor } from '@tiptap/vue-3'
import Image from '@tiptap/extension-image'
import UEditor from '@nuxt/ui/components/Editor.vue'
import UEditorToolbar from '@nuxt/ui/components/EditorToolbar.vue'
import { ControlWrapper } from '../common'
import { determineClearValue, useUiControl } from '../utils'
import {
  ImageUpload,
  WysiwygImageUploadKey,
  imageUploadHandler,
  readFileAsDataUrl,
} from './wysiwygImageUpload'
import { ensureWysiwygImageResizeStyles } from './wysiwygImageResizeStyles'

/**
 * Default toolbar.
 *
 * Each sub-array forms a group; `UEditorToolbar` inserts separators between them.
 * The `kind` values are wired natively by Nuxt UI to Tiptap commands — replacing the
 * ~250 lines of `q-btn-dropdown` and manual commands from v1.
 */
const DEFAULT_TOOLBAR = [
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo-2',
      'aria-label': 'Annuler',
      tooltip: { text: 'Annuler' },
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo-2',
      'aria-label': 'Rétablir',
      tooltip: { text: 'Rétablir' },
    },
  ],
  [
    {
      kind: 'heading',
      level: 1,
      icon: 'i-lucide-heading-1',
      'aria-label': 'Titre 1',
      tooltip: { text: 'Titre 1' },
    },
    {
      kind: 'heading',
      level: 2,
      icon: 'i-lucide-heading-2',
      'aria-label': 'Titre 2',
      tooltip: { text: 'Titre 2' },
    },
    {
      kind: 'heading',
      level: 3,
      icon: 'i-lucide-heading-3',
      'aria-label': 'Titre 3',
      tooltip: { text: 'Titre 3' },
    },
    {
      kind: 'paragraph',
      icon: 'i-lucide-pilcrow',
      'aria-label': 'Paragraphe',
      tooltip: { text: 'Paragraphe' },
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      'aria-label': 'Gras',
      tooltip: { text: 'Gras' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      'aria-label': 'Italique',
      tooltip: { text: 'Italique' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      'aria-label': 'Souligné',
      tooltip: { text: 'Souligné' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      'aria-label': 'Barré',
      tooltip: { text: 'Barré' },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      'aria-label': 'Code',
      tooltip: { text: 'Code' },
    },
  ],
  [
    {
      kind: 'textAlign',
      align: 'left',
      icon: 'i-lucide-align-left',
      'aria-label': 'Aligner à gauche',
      tooltip: { text: 'Aligner à gauche' },
    },
    {
      kind: 'textAlign',
      align: 'center',
      icon: 'i-lucide-align-center',
      'aria-label': 'Centrer',
      tooltip: { text: 'Centrer' },
    },
    {
      kind: 'textAlign',
      align: 'right',
      icon: 'i-lucide-align-right',
      'aria-label': 'Aligner à droite',
      tooltip: { text: 'Aligner à droite' },
    },
    {
      kind: 'textAlign',
      align: 'justify',
      icon: 'i-lucide-align-justify',
      'aria-label': 'Justifier',
      tooltip: { text: 'Justifier' },
    },
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      'aria-label': 'Liste à puces',
      tooltip: { text: 'Liste à puces' },
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      'aria-label': 'Liste numérotée',
      tooltip: { text: 'Liste numérotée' },
    },
    {
      kind: 'taskList',
      icon: 'i-lucide-list-checks',
      'aria-label': 'Liste de tâches',
      tooltip: { text: 'Liste de tâches' },
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-lucide-quote',
      'aria-label': 'Citation',
      tooltip: { text: 'Citation' },
    },
    {
      kind: 'codeBlock',
      icon: 'i-lucide-square-code',
      'aria-label': 'Bloc de code',
      tooltip: { text: 'Bloc de code' },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-minus',
      'aria-label': 'Filet horizontal',
      tooltip: { text: 'Filet horizontal' },
    },
  ],
  [
    {
      kind: 'link',
      icon: 'i-lucide-link',
      'aria-label': 'Lien',
      tooltip: { text: 'Lien' },
    },
    {
      kind: 'imageUpload',
      icon: 'i-lucide-image',
      'aria-label': 'Image',
      tooltip: { text: 'Insérer une image' },
    },
  ],
  [
    {
      kind: 'clearFormatting',
      icon: 'i-lucide-remove-formatting',
      'aria-label': 'Effacer la mise en forme',
      tooltip: { text: 'Effacer la mise en forme' },
    },
  ],
]

const DEFAULT_IMAGE_RESIZE = {
  enabled: true,
  directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'] as const,
  minWidth: 48,
  minHeight: 48,
  alwaysPreserveAspectRatio: true,
}

/**
 * WysiwygControlRenderer
 *
 * Rich text editor for controls marked `options.wysiwyg: true`, built on `UEditor`
 * (Tiptap 3, provided by Nuxt UI).
 *
 * Storage mode (`contentType`):
 * - `options.contentType: 'json' | 'html'` — explicit override
 * - otherwise inferred from the schema: `object` → ProseMirror JSON, `string` → HTML
 *
 * Images:
 * - toolbar opens an upload dropzone (`imageUpload` node)
 * - selected images are resizable (TipTap `Image.resize`)
 * - bubble toolbar: replace / delete
 * - `options.onImageUpload(file) => Promise<string>` for remote URLs (default: data URL)
 * - `options.image: false` disables images entirely
 *
 * `options.toolbar` replaces the default toolbar with an array of groups in Nuxt UI's
 * `EditorToolbarItem` format.
 */
const controlRenderer: Component = defineComponent({
  name: 'WysiwygControlRenderer',
  components: {
    ControlWrapper,
    UEditor,
    UEditorToolbar,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const clearValue = determineClearValue(undefined)
    const adaptTarget = (value: unknown) => value ?? clearValue

    const control = useUiControl(useJsonFormsControl(props), adaptTarget, 300)

    onMounted(() => {
      if (control.appliedOptions.value?.image !== false) {
        ensureWysiwygImageResizeStyles()
      }
    })

    const contentType = computed(() => {
      const explicit = control.appliedOptions.value?.contentType
      if (explicit === 'html' || explicit === 'json') {
        return explicit
      }
      return control.control.value.schema?.type === 'string' ? 'html' : 'json'
    })

    const imagesEnabled = computed(() => control.appliedOptions.value?.image !== false)

    const editorExtensions = computed(() => {
      if (!imagesEnabled.value) return []
      const fromOptions = control.appliedOptions.value?.image
      const extra = fromOptions && typeof fromOptions === 'object' ? fromOptions : {}
      return [
        Image.configure({
          allowBase64: true,
          resize: { ...DEFAULT_IMAGE_RESIZE },
          ...extra,
        }),
        ImageUpload,
      ]
    })

    const imageUploadCtx = computed(() => {
      const opts = control.appliedOptions.value ?? {}
      const customUpload = opts.onImageUpload as ((file: File) => Promise<string>) | undefined
      const maxSize = typeof opts.imageMaxSize === 'number' ? opts.imageMaxSize : 2 * 1024 * 1024
      return {
        accept: (opts.imageAccept as string) ?? 'image/*',
        label: (opts.imageLabel as string) ?? 'Ajouter une image',
        description:
          (opts.imageDescription as string) ??
          `PNG, JPG, GIF ou WebP (max. ${Math.round(maxSize / (1024 * 1024))} Mo)`,
        maxSize,
        upload: async (file: File) => {
          if (customUpload) return customUpload(file)
          return readFileAsDataUrl(file)
        },
      }
    })

    provide(WysiwygImageUploadKey, imageUploadCtx)

    const editorHandlers = computed(() =>
      imagesEnabled.value ? { imageUpload: imageUploadHandler } : undefined,
    )

    const toolbarItems = computed(() => control.appliedOptions.value?.toolbar ?? DEFAULT_TOOLBAR)

    const imageBubbleItems = (editor: Editor) => [
      [
        {
          icon: 'i-lucide-refresh-cw',
          'aria-label': 'Remplacer',
          tooltip: { text: 'Remplacer' },
          onClick: () => {
            const pos = editor.state.selection.from
            const node = editor.state.doc.nodeAt(pos)
            if (node?.type.name !== 'image') return
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .insertContentAt(pos, { type: 'imageUpload' })
              .run()
          },
        },
        {
          icon: 'i-lucide-trash-2',
          'aria-label': 'Supprimer',
          tooltip: { text: 'Supprimer' },
          onClick: () => {
            const pos = editor.state.selection.from
            const node = editor.state.doc.nodeAt(pos)
            if (node?.type.name !== 'image') return
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run()
          },
        },
      ],
    ]

    const shouldShowImageBubble = ({
      editor,
      view,
    }: {
      editor: Editor
      view: { hasFocus: () => boolean }
    }) => editor.isActive('image') && view.hasFocus()

    /**
     * Nuxt UI editor theme defaults to article prose (`*:my-5`, `sm:px-8`). Rewrite
     * those defaults for form density; keep `p-3` for clickable padding inside the
     * contenteditable (do not add `sm:px-0` — it would zero out `p-3` on sm+).
     */
    const editorUi = {
      base: (defaults: string) =>
        `${String(defaults ?? '')
          .replaceAll('*:my-5', '*:my-1')
          .replaceAll('sm:px-8', '')} min-h-40 p-3 focus:outline-none *:!my-1`
          .replace(/\s+/g, ' ')
          .trim(),
    }

    return {
      ...control,
      contentType,
      toolbarItems,
      editorUi,
      imagesEnabled,
      editorExtensions,
      editorHandlers,
      imageBubbleItems,
      shouldShowImageBubble,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, and(or(isStringControl, isObjectControl), optionIs('wysiwyg', true))),
}
</script>
