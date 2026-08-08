<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input(
      v-bind="uiProps('input')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :placeholder="appliedOptions.placeholder"
      :autofocus="appliedOptions.focus"
      :maxlength="maxLength"
      :color="control.errors ? 'error' : undefined"
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
  isStringControl,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useStringControl } from '../composables'

/**
 * InputControlRenderer
 *
 * Rend les propriétés `type: "string"` avec un `UInput`.
 *
 * Options du uischema reconnues : `placeholder`, `focus`, `restrict` (applique le
 * `maxLength` du schéma), et `input` pour passer n'importe quelle prop à `UInput`.
 */
const controlRenderer = defineComponent({
  name: 'InputControlRenderer',
  components: {
    ControlWrapper,
    UInput,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useStringControl({
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
  tester: rankWith(1, isStringControl), // Matches schema properties with type "string"
}
</script>
