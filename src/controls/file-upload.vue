<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .space-y-1
      u-file-upload(
        v-bind="uiProps('fileUpload')"
        :id="control.id + '-input'"
        :model-value="modelValue"
        :class="styles.control.input"
        :accept="accept"
        :multiple="multiple"
        :disabled="isDisabled || isReadonly"
        :label="appliedOptions.dropLabel ?? 'Déposez un fichier ici'"
        :description="appliedOptions.dropDescription ?? acceptLabel"
        :layout="appliedOptions.layout ?? 'list'"
        :color="control.errors ? 'error' : undefined"
        icon="i-lucide-upload"
        @update:model-value="onFilesChange"
      )
      p.text-xs.text-muted.tabular-nums(v-if="summary" v-text="summary")
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  or,
  formatIs,
  hasType,
  isStringControl,
  optionIs,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useFileUploadControl } from '../composables'

/** `array` of strings marked `format: "file"` → multiple upload. */
const isMultipleFileSchema = schemaMatches((schema) => {
  if (!hasType(schema, 'array') || Array.isArray(schema.items)) {
    return false
  }

  const items = schema.items

  return Boolean(items) && hasType(items, 'string')
})

/**
 * FileUploadControlRenderer
 *
 * Renders strings with `format: "data-url"` (or `options.format: "file"`) using
 * `UFileUpload`: drop zone, preview, and removal.
 *
 * The stored value remains a **data URL** — the schema describes a string, and the
 * form stays serializable as-is. The original file name, which a `type: "string"` cannot
 * carry, is kept in the URL's `;name=` parameter and restored on read (cf.
 * `useFileUploadControl`).
 *
 * An `array` schema of `string` elements enables multiple upload.
 */
const controlRenderer = defineComponent({
  name: 'FileUploadControlRenderer',
  components: {
    ControlWrapper,
    UFileUpload,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useFileUploadControl({
      jsonFormsControl,
      clearValue,
    })

    const acceptLabel = computed(() =>
      control.accept.value === '*' ? 'ou cliquez pour parcourir' : control.accept.value,
    )

    return { ...control, acceptLabel }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rank 20: beats the array renderer (2) for the multiple variant, and `input` (1) for
   * the simple variant.
   */
  tester: rankWith(
    20,
    and(
      uiTypeIs('Control'),
      or(isStringControl, isMultipleFileSchema),
      or(formatIs('data-url'), optionIs('format', 'file')),
    ),
  ),
}
</script>
