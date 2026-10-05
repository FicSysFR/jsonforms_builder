<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .relative(ref="rootEl")
      u-editor(
        ref="editorRef"
        v-bind="uiProps('editor')"
        :model-value="control.data"
        :content-type="resolved.contentType"
        :editable="editable"
        :placeholder="resolved.placeholder"
        :image="false"
        :extensions="editorExtensions"
        :handlers="editorHandlers"
        :class="[styles.control.input, 'rounded-md border border-default']"
        :ui="editorUi"
        @update:model-value="onChange"
      )
        template(#default="{ editor }")
          .sticky.top-0.z-10.flex.items-center.gap-2.rounded-t-md.border-b.border-default.bg-default.p-1(
            v-if="ui.mode === 'preview'"
            data-wysiwyg-preview-bar
          )
            span.flex.items-center.gap-1.px-1.text-xs.text-muted
              u-icon.size-4(name="i-lucide-eye")
              | Aperçu
            u-button.ms-auto(size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="ui.mode = 'edit'") Modifier
          template(v-else)
            u-editor-toolbar.sticky.top-0.z-10.flex-wrap.rounded-t-md.border-b.border-default.bg-default.p-1(
              v-if="resolved.toolbar !== false && ui.mode === 'edit'"
              :editor="editor"
              :items="resolved.toolbar"
            )
            wysiwyg-source-editor(
              v-if="ui.mode === 'source'"
              :editor="editor"
              :content-type="resolved.contentType"
              :editable="editable"
              @close="ui.mode = 'edit'"
            )
            wysiwyg-find-replace(
              v-else-if="ui.panel === 'find'"
              :editor="editor"
              :editable="editable"
              @close="closePanel(editor)"
            )
            wysiwyg-link-panel(
              v-else-if="ui.panel === 'link' && editable"
              :editor="editor"
              @close="closePanel(editor)"
            )
          template(v-if="editable && ui.mode === 'edit'")
            u-editor-toolbar(
              v-if="resolved.imageBubble"
              :editor="editor"
              :items="imageBubbleItems(editor)"
              layout="bubble"
              plugin-key="wysiwygImageBubble"
              :should-show="shouldShowImageBubble"
            )
            u-editor-toolbar(
              v-if="textBubbleItems.length"
              :editor="editor"
              :items="textBubbleItems"
              layout="bubble"
              plugin-key="wysiwygTextBubble"
              :should-show="shouldShowTextBubble"
            )
            u-editor-toolbar(
              v-if="resolved.features.table"
              :editor="editor"
              :items="tableBubbleItems"
              layout="bubble"
              plugin-key="wysiwygTableBubble"
              :should-show="shouldShowTableBubble"
            )
            u-editor-suggestion-menu(
              v-if="slashItems.length"
              :editor="editor"
              :items="slashItems"
              :filter-fields="slashFilterFields"
              plugin-key="wysiwygSlashMenu"
            )
      wysiwyg-ai-result.absolute.inset-x-2.z-20(
        v-if="ai && ai.isOpen.value"
        :ai="ai"
        :labels="resolved.ai.labels"
        :format="resolved.ai.format"
        :style="aiPanelStyle"
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
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  shallowRef,
  watch,
  type Component,
} from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import type { Editor } from '@tiptap/vue-3'
import type { EditorState } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import UButton from '@nuxt/ui/components/Button.vue'
import UEditor from '@nuxt/ui/components/Editor.vue'
import UEditorSuggestionMenu from '@nuxt/ui/components/EditorSuggestionMenu.vue'
import UEditorToolbar from '@nuxt/ui/components/EditorToolbar.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
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
import { selectWysiwygAiSlashActions } from './wysiwyg/ai/actions'
import { useWysiwygAi, type WysiwygAiController } from './wysiwyg/ai/useWysiwygAi'
import WysiwygAiResult from './wysiwyg/ai/WysiwygAiResult.vue'
import { buildWysiwygFeatureExtensions } from './wysiwyg/extensions'
import { createWysiwygHandlers, type WysiwygUiState } from './wysiwyg/handlers'
import { WYSIWYG_SLASH_FILTER_FIELDS, buildWysiwygSlashItems } from './wysiwyg/slash/commands'
import { refreshWysiwygEditorStyles } from './wysiwyg/styles'
import { WYSIWYG_TABLE_BUBBLE, buildWysiwygTextBubble } from './wysiwyg/toolbar'
import WysiwygFindReplace from './wysiwyg/WysiwygFindReplace.vue'
import WysiwygLinkPanel from './wysiwyg/WysiwygLinkPanel.vue'
import WysiwygSourceEditor from './wysiwyg/WysiwygSourceEditor.vue'

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
    UButton,
    UEditor,
    UEditorSuggestionMenu,
    UEditorToolbar,
    UIcon,
    WysiwygAiResult,
    WysiwygFindReplace,
    WysiwygLinkPanel,
    WysiwygSourceEditor,
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
      refreshWysiwygEditorStyles()
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

    const editorRef = shallowRef<{ editor?: Editor } | null>(null)
    const rootEl = ref<HTMLElement | null>(null)
    const currentEditor = computed(() => editorRef.value?.editor ?? undefined)

    const editable = computed(() => !control.isDisabled.value && !control.isReadonly.value)
    const ui = reactive<WysiwygUiState>({ panel: null, mode: 'edit' })

    // AI stays fully inert (no controller, no transport call) unless `ai.enabled === true`.
    const ai = shallowRef<WysiwygAiController | null>(null)
    watch(
      () => resolved.value.ai.enabled,
      (enabled) => {
        if (enabled && !ai.value) {
          ai.value = useWysiwygAi({
            getEditor: () => currentEditor.value,
            options: computed(() => resolved.value.ai),
          })
        } else if (!enabled && ai.value) {
          ai.value.dispose()
          ai.value = null
        }
      },
      { immediate: true },
    )

    const editorExtensions = computed(() => {
      const cfg = resolved.value
      const features = buildWysiwygFeatureExtensions(cfg.features, cfg.extensions)
      if (!cfg.imagesEnabled) return [...features, ...cfg.extensions]

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
        ...features,
        ...cfg.extensions,
      ]
    })

    const editorHandlers = computed(() => {
      const cfg = resolved.value
      const base = cfg.imagesEnabled ? { imageUpload: imageUploadHandler } : {}
      const builtIn = createWysiwygHandlers({
        ui,
        linkEditor: cfg.features.linkEditor,
        ai: ai.value,
        aiActions: cfg.ai.actions,
      })
      return { ...base, ...builtIn, ...cfg.handlers }
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

    const textBubbleItems = computed(() => {
      const cfg = resolved.value
      const aiActions =
        cfg.ai.enabled && cfg.ai.bubbleMenu
          ? cfg.ai.actions.filter((action) => action.mode !== 'generate')
          : []
      return buildWysiwygTextBubble({
        formatting: cfg.bubbleMenu,
        features: cfg.features,
        aiActions,
        aiLabel: cfg.ai.labels.menu,
      })
    })

    const tableBubbleItems = WYSIWYG_TABLE_BUBBLE as unknown[][]

    const shouldShowTextBubble = ({ editor, state }: { editor: Editor; state: EditorState }) => {
      const { selection } = state
      if (ai.value?.isOpen.value) return false
      if (selection.empty || selection instanceof CellSelection) return false
      if (!state.doc.textBetween(selection.from, selection.to).trim()) return false
      return !editor.isActive('image') && !editor.isActive('codeBlock')
    }

    const shouldShowTableBubble = ({ editor, state }: { editor: Editor; state: EditorState }) =>
      editor.isActive('table') &&
      (state.selection.empty || state.selection instanceof CellSelection)

    const slashItems = computed(() => {
      const cfg = resolved.value
      const aiActions =
        cfg.ai.enabled && cfg.ai.slashCommands ? selectWysiwygAiSlashActions(cfg.ai.actions) : []
      return buildWysiwygSlashItems({
        formatting: cfg.slashCommands,
        features: cfg.features,
        imagesEnabled: cfg.imagesEnabled,
        aiActions,
        aiLabel: cfg.ai.labels.menu,
      })
    })

    const closePanel = (editor: Editor) => {
      ui.panel = null
      if (!editor.isDestroyed) editor.commands.focus()
    }

    // `UEditor` only reads `editable` at creation: keep disabled / readonly / preview in sync.
    watch(
      [currentEditor, editable, () => ui.mode],
      ([editor, canEdit, mode]) => {
        if (!editor || editor.isDestroyed) return
        const next = canEdit && mode !== 'preview'
        if (editor.isEditable !== next) editor.setEditable(next, false)
        if (!next) {
          ui.panel = null
          ai.value?.discard()
        }
      },
      { immediate: true },
    )
    watch(
      () => ui.mode,
      (mode) => {
        if (mode !== 'edit') ai.value?.discard()
      },
    )

    // The AI panel floats under the targeted text, inside the editor frame.
    const aiPanelStyle = ref<Record<string, string>>({})
    const positionAiPanel = () => {
      const editor = currentEditor.value
      const root = rootEl.value
      if (!editor || editor.isDestroyed || !root) return
      const pos = ai.value?.target.value?.to ?? editor.state.selection.to
      try {
        const coords = editor.view.coordsAtPos(Math.min(pos, editor.state.doc.content.size))
        const top = coords.bottom - root.getBoundingClientRect().top + 8
        aiPanelStyle.value = { top: `${Math.max(0, Math.round(top))}px` }
      } catch {
        aiPanelStyle.value = { top: '100%' }
      }
    }
    watch(
      () => [ai.value?.status.value, ai.value?.target.value?.to],
      () => nextTick(positionAiPanel),
    )
    // Bubble menus only re-evaluate `shouldShow` on transactions: nudge them when the
    // AI panel opens or closes so the text bubble does not overlap it.
    watch(
      () => ai.value?.isOpen.value,
      () => {
        const editor = currentEditor.value
        if (editor && !editor.isDestroyed) {
          editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false))
        }
      },
    )

    onBeforeUnmount(() => ai.value?.dispose())

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
        // Source mode edits the raw value in a textarea: hide the rich view meanwhile.
        ...(ui.mode === 'source' ? { content: 'hidden' } : {}),
      }
    })

    return {
      ...control,
      resolved,
      editorRef,
      rootEl,
      editable,
      ui,
      ai,
      aiPanelStyle,
      editorUi,
      editorExtensions,
      editorHandlers,
      imageBubbleItems,
      shouldShowImageBubble,
      textBubbleItems,
      tableBubbleItems,
      shouldShowTextBubble,
      shouldShowTableBubble,
      slashItems,
      slashFilterFields: WYSIWYG_SLASH_FILTER_FIELDS,
      closePanel,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, and(or(isStringControl, isObjectControl), optionIs('wysiwyg', true))),
}
</script>
