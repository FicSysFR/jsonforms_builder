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
 * Renders free-form string arrays marked `options.format: "tags"` with `UInputTags`:
 * keywords, recipients, labels.
 *
 * Counterpart to multi-enum for an open list — where multi-enum checks known values,
 * here the value comes from typing. The array renderer would work too, but would show
 * one expandable card per keyword.
 *
 * The schema drives guardrails: `maxItems` limits tag count, `uniqueItems` forbids
 * duplicates, `items.maxLength` limits each tag's length.
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
   * Rank 20, above multi-enum (5): a schema with both `items.enum` and
   * `options.format: "tags"` explicitly requests free entry, not checkboxes.
   */
  tester: rankWith(
    20,
    and(
      uiTypeIs('Control'),
      optionIs('format', 'tags'),
      schemaMatches((schema) => {
        if (!hasType(schema, 'array') || Array.isArray(schema.items)) {
          return false
        }

        const items = schema.items

        return !items || hasType(items, 'string')
      }),
    ),
  ),
}
</script>
