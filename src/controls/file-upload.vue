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

/** `array` de chaînes marqué `format: "file"` → dépôt multiple. */
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
 * Rend les chaînes de `format: "data-url"` (ou `options.format: "file"`) avec un
 * `UFileUpload` : zone de dépôt, prévisualisation et suppression.
 *
 * La valeur stockée reste une **URL de données** — le schéma décrit bien une chaîne, et le
 * formulaire reste sérialisable tel quel. Le nom d'origine du fichier, qu'un `type:
 * "string"` ne sait pas porter, est conservé dans le paramètre `;name=` de l'URL et
 * restitué à la relecture (cf. `useFileUploadControl`).
 *
 * Un schéma `array` d'éléments `string` active le dépôt multiple.
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
   * Rang 20 : passe devant le renderer de tableau (2) pour la variante multiple, et devant
   * `input` (1) pour la variante simple.
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
