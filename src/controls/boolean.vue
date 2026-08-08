<template lang="pug">
  //- Do not use `:label="undefined"` after `v-bind="controlWrapper"`: mergeProps
  //- ignores `undefined`, so the schema title stayed on `UFormField` and cancelled
  //- `reserveLabelSpace`. We intentionally omit `label` from the bind.
  control-wrapper(
    :id="controlWrapper.id"
    :description="controlWrapper.description"
    :errors="controlWrapper.errors"
    :visible="controlWrapper.visible"
    :required="controlWrapper.required"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
    reserve-label-space
  )
    u-switch(
      v-if="appliedOptions.toggle"
      v-bind="uiProps('switch')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :label="controlWrapper.label"
      :class="styles.control.input"
      :disabled="disable"
      @update:model-value="onChange"
    )
    u-checkbox(
      v-else
      v-bind="uiProps('checkbox')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :label="controlWrapper.label"
      :class="styles.control.input"
      :disabled="disable"
      @update:model-value="onChange"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  isBooleanControl,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import USwitch from '@nuxt/ui/components/Switch.vue'
import { ControlWrapper } from '../common'
import { useBooleanControl } from '../composables'

/**
 * BooleanControlRenderer
 *
 * Renders `type: "boolean"` properties.
 *
 * The label is on the checkbox itself (not on `UFormField`) for a « checkbox + text
 * on one line » layout. `reserveLabelSpace` aligns the checkbox and its description
 * with neighboring fields (phantom label row + input height).
 *
 * Uischema option `toggle: true` switches to a `USwitch`.
 */
const controlRenderer = defineComponent({
  name: 'BooleanControlRenderer',
  components: {
    ControlWrapper,
    UCheckbox,
    USwitch,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)

    return useBooleanControl({
      jsonFormsControl,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(1, isBooleanControl), // Matches schema properties with type "boolean"
}
</script>
