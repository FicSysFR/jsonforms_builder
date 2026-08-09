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
      :content-type="resolved.contentType"
      :editable="!isDisabled && !isReadonly"
      :placeholder="resolved.placeholder"
      :image="false"
      :extensions="editorExtensions"
      :handlers="editorHandlers"
      :class="[styles.control.input, 'rounded-md border border-default']"
      :ui="editorUi"
      @update:model-value="onChange"
    )
      template(#default="{ editor }")
        u-editor-toolbar.sticky.top-0.z-10.rounded-t-md.border-b.border-default.bg-default.p-1(
          v-if="resolved.toolbar !== false"
          :editor="editor"
          :items="resolved.toolbar"
        )
        u-editor-toolbar(
          v-if="resolved.imageBubble && !isDisabled && !isReadonly"
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
import { resolveWysiwygOptions } from './wysiwygOptions'
import { WysiwygResizableImage } from './wysiwygResizableImage'
import { refreshWysiwygImageResizeStyles } from './wysiwygImageResizeStyles'

/**
 * WysiwygControlRenderer
 *
 * Rich text editor for controls marked `options.wysiwyg: true`, built on `UEditor`
 * (Tiptap 3). Behaviour is driven by uischema options — see `WysiwygOptions`.
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

    const jsonformsControl = useJsonFormsControl(props)

    const initialDebounce = (() => {
      const raw = (
        jsonformsControl.control.value.uischema.options as { debounce?: unknown } | undefined
      )?.debounce
      return typeof raw === 'number' && raw >= 0 ? raw : 300
    })()

    const control = useUiControl(jsonformsControl, adaptTarget, initialDebounce)

    const resolved = computed(() =>
      resolveWysiwygOptions(
        control.appliedOptions.value as Record<string, unknown> | undefined,
        control.control.value.schema?.type,
      ),
    )

    const syncResizeStyles = () => {
      if (typeof document === 'undefined') return
      if (resolved.value.imagesEnabled && resolved.value.imageResize !== false) {
        refreshWysiwygImageResizeStyles()
      }
    }
    syncResizeStyles()
    onMounted(syncResizeStyles)

    const imageUploadCtx = computed(() => {
      const cfg = resolved.value.imageUpload
      return {
        accept: cfg.accept,
        label: cfg.label,
        description: cfg.description,
        maxSize: cfg.maxSize,
        upload: async (file: File) => {
          if (cfg.upload) return cfg.upload(file)
          return readFileAsDataUrl(file)
        },
      }
    })

    provide(WysiwygImageUploadKey, imageUploadCtx)

    const editorExtensions = computed(() => {
      const cfg = resolved.value
      if (!cfg.imagesEnabled) return [...cfg.extensions]

      const resize =
        cfg.imageResize === false
          ? false
          : { ...cfg.imageResize, enabled: cfg.imageResize.enabled !== false }

      return [
        WysiwygResizableImage.configure({
          allowBase64: true,
          ...cfg.imageTipTap,
          resize,
        }),
        ImageUpload,
        ...cfg.extensions,
      ]
    })

    const editorHandlers = computed(() => {
      const cfg = resolved.value
      const base = cfg.imagesEnabled ? { imageUpload: imageUploadHandler } : {}
      return { ...base, ...cfg.handlers }
    })

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

    const editorUi = computed(() => {
      const cfg = resolved.value
      return {
        base: (defaults: string) => {
          const withoutImageWash = String(defaults ?? '').replaceAll(
            '[&_.ProseMirror-selectednode:not(img):not(pre):not([data-node-view-wrapper])]:bg-primary/20',
            '[&_.ProseMirror-selectednode:not(img):not(pre):not([data-node-view-wrapper]):not([data-resize-container])]:bg-primary/20',
          )
          const stripped = withoutImageWash
            .replaceAll('*:my-5', '')
            .replaceAll('*:first:mt-0', '')
            .replaceAll('*:last:mb-0', '')
            .replaceAll('sm:px-8', '')
          return `${stripped} ${cfg.minHeight} ${cfg.padding} focus:outline-none ${cfg.blockSpacing} ${cfg.editorClass}`
            .replace(/\s+/g, ' ')
            .trim()
        },
      }
    })

    return {
      ...control,
      resolved,
      editorUi,
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
