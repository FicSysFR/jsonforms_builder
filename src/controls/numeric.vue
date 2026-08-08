<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input-number(
      v-bind="uiProps('inputNumber')"
      :id="control.id + '-input'"
      :model-value="control.data"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :placeholder="appliedOptions.placeholder"
      :autofocus="appliedOptions.focus"
      :min="control.schema.minimum"
      :max="control.schema.maximum"
      :step="step"
      :color="control.errors ? 'error' : undefined"
      @update:model-value="onChange"
      @blur="handleBlur"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  or,
  isIntegerControl,
  isNumberControl,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useNumericControl } from '../composables'

/**
 * NumericControlRenderer
 *
 * Renders `type: "number"` and `type: "integer"` properties with a `UInputNumber`.
 *
 * `UInputNumber` emits a number directly (or `null`), whereas v1's `q-input type="number"`
 * emitted a string that had to be reparsed — hence using raw `control.data` rather than
 * the composable's `formattedValue`.
 */
const controlRenderer = defineComponent({
  name: 'NumericControlRenderer',
  components: {
    ControlWrapper,
    UInputNumber,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useNumericControl({
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
  tester: rankWith(1, or(isIntegerControl, isNumberControl)), // Matches schema properties with type "number" or "integer"
}
</script>
