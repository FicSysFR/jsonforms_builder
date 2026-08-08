<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input-tags(
      v-bind="uiProps('inputTags')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :class="styles.control.input"
      :disabled="isDisabled || isReadonly"
      :placeholder="appliedOptions.placeholder"
      :autofocus="appliedOptions.focus"
      :max="max"
      :max-length="maxLength"
      :duplicate="duplicate"
      :delimiter="delimiter"
      :color="control.errors ? 'error' : undefined"
      add-on-blur
      add-on-paste
      @update:model-value="onChange"
      @focus="handleFocus"
      @blur="handleBlur"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  hasType,
  optionIs,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UInputTags from '@nuxt/ui/components/InputTags.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useTagsControl } from '../composables'

/**
 * TagsControlRenderer
 *
 * Rend les tableaux de chaînes *libres* marqués `options.format: "tags"` avec un
 * `UInputTags` : mots-clés, destinataires, libellés.
 *
 * C'est le pendant du multi-enum pour une liste ouverte — là où celui-ci coche des valeurs
 * connues d'avance, ici la valeur naît de la saisie. Le renderer de tableau conviendrait
 * aussi, mais ferait une carte dépliable par mot-clé.
 *
 * Le schéma pilote les garde-fous : `maxItems` limite le nombre d'étiquettes,
 * `uniqueItems` interdit les doublons, `items.maxLength` la longueur de chacune.
 */
const controlRenderer = defineComponent({
  name: 'TagsControlRenderer',
  components: {
    ControlWrapper,
    UInputTags,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useTagsControl({
      jsonFormsControl,
      clearValue,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rang 20, au-dessus du multi-enum (5) : un schéma qui porte à la fois `items.enum` et
   * `options.format: "tags"` demande explicitement la saisie libre, pas des cases à cocher.
   */
  tester: rankWith(
    20,
    and(
      uiTypeIs('Control'),
      optionIs('format', 'tags'),
      schemaMatches((schema) => {
        if (!hasType(schema, 'array') || Array.isArray((schema as any).items)) {
          return false
        }

        const items = (schema as any).items

        return !items || hasType(items, 'string')
      }),
    ),
  ),
}
</script>
