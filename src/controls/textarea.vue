<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-textarea(
      v-bind="uiProps('textarea')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :placeholder="appliedOptions.placeholder"
      :autofocus="appliedOptions.focus"
      :maxlength="maxLength"
      :rows="minRows"
      :maxrows="rows"
      :color="control.errors ? 'error' : undefined"
      autoresize
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
  isStringControl,
  isMultiLineControl,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useTextareaControl } from '../composables'

/**
 * TextareaControlRenderer
 *
 * Renders strings marked `multi: true` in the uischema with a `UTextarea`.
 *
 * `autoresize` replaces Quasar's `autogrow`: `rows` sets the minimum height and
 * `maxrows` the cap beyond which the field scrolls.
 */
const controlRenderer = defineComponent({
  name: 'TextareaControlRenderer',
  components: {
    ControlWrapper,
    UTextarea,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useTextareaControl({
      jsonFormsControl,
      clearValue,
      debounceWait: 100,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(2, and(isStringControl, isMultiLineControl)), // Matches schema properties with type "string" and with "multiLine" option set to true
}
</script>
