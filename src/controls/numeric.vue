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
 * Rend les propriétés `type: "number"` et `type: "integer"` avec un `UInputNumber`.
 *
 * `UInputNumber` émet directement un nombre (ou `null`), là où le `q-input type="number"`
 * de la v1 émettait une chaîne qu'il fallait reparser — d'où l'usage de `control.data`
 * brut plutôt que du `formattedValue` du composable.
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
