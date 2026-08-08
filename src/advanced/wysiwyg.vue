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
      :class="[styles.control.input, 'rounded-md border border-default']"
      :ui="{ content: 'min-h-40 p-3 focus:outline-none' }"
      @update:model-value="onChange"
    )
      template(#default="{ editor }")
        u-editor-toolbar.sticky.top-0.z-10.rounded-t-md.border-b.border-default.bg-default.p-1(
          :editor="editor"
          :items="toolbarItems"
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
import { computed, defineComponent, type Component } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UEditor from '@nuxt/ui/components/Editor.vue'
import UEditorToolbar from '@nuxt/ui/components/EditorToolbar.vue'
import { ControlWrapper } from '../common'
import { determineClearValue, useUiControl } from '../utils'

/**
 * Default toolbar.
 *
 * Each sub-array forms a group; `UEditorToolbar` inserts separators between them.
 * The `kind` values are wired natively by Nuxt UI to Tiptap commands — replacing the
 * ~250 lines of `q-btn-dropdown` and manual commands from v1.
 */
const DEFAULT_TOOLBAR = [
  [
    { kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': 'Annuler' },
    { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': 'Rétablir' },
  ],
  [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', 'aria-label': 'Titre 1' },
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Titre 2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Titre 3' },
    { kind: 'paragraph', icon: 'i-lucide-pilcrow', 'aria-label': 'Paragraphe' },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Gras' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italique' },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', 'aria-label': 'Souligné' },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', 'aria-label': 'Barré' },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', 'aria-label': 'Code' },
  ],
  [
    {
      kind: 'textAlign',
      align: 'left',
      icon: 'i-lucide-align-left',
      'aria-label': 'Aligner à gauche',
    },
    { kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center', 'aria-label': 'Centrer' },
    {
      kind: 'textAlign',
      align: 'right',
      icon: 'i-lucide-align-right',
      'aria-label': 'Aligner à droite',
    },
    {
      kind: 'textAlign',
      align: 'justify',
      icon: 'i-lucide-align-justify',
      'aria-label': 'Justifier',
    },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Liste à puces' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Liste numérotée' },
    { kind: 'taskList', icon: 'i-lucide-list-checks', 'aria-label': 'Liste de tâches' },
  ],
  [
    { kind: 'blockquote', icon: 'i-lucide-quote', 'aria-label': 'Citation' },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', 'aria-label': 'Bloc de code' },
    { kind: 'horizontalRule', icon: 'i-lucide-minus', 'aria-label': 'Filet horizontal' },
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Lien' },
    { kind: 'image', icon: 'i-lucide-image', 'aria-label': 'Image' },
  ],
  [
    {
      kind: 'clearFormatting',
      icon: 'i-lucide-remove-formatting',
      'aria-label': 'Effacer la mise en forme',
    },
  ],
]

/**
 * WysiwygControlRenderer
 *
 * Rich text editor for controls marked `options.wysiwyg: true`, built on `UEditor`
 * (Tiptap 3, provided by Nuxt UI).
 *
 * Storage format follows the schema type: `string` → HTML, `object` → Tiptap JSON document.
 * v1 could only produce JSON.
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

    const contentType = computed(() =>
      control.control.value.schema?.type === 'object' ? 'json' : 'html',
    )

    const toolbarItems = computed(() => control.appliedOptions.value?.toolbar ?? DEFAULT_TOOLBAR)

    return { ...control, contentType, toolbarItems }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, and(or(isStringControl, isObjectControl), optionIs('wysiwyg', true))),
}
</script>
