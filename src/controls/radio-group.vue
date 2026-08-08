<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-radio-group(
      v-bind="uiProps('radioGroup')"
      :model-value="modelValue"
      :items="control.options"
      :class="styles.control.input"
      :disabled="disable"
      :orientation="orientation"
      :color="control.errors ? 'error' : undefined"
      value-key="value"
      label-key="label"
      @update:model-value="onChange"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  isEnumControl,
  optionIs,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsEnumControl, type RendererProps } from '@jsonforms/vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useRadioGroupControl } from '../composables'

/**
 * RadioGroupControlRenderer
 *
 * Renders enums marked `options.format: "radio"` with a `URadioGroup`.
 *
 * Vertical by default (like `URadioGroup` and multi-enum); `options.vertical: false` or
 * `options.orientation: "horizontal"` switches to a row layout.
 * `options.radioGroup.orientation` always wins via `v-bind` + the computation below.
 */
const controlRenderer = defineComponent({
  name: 'RadioGroupControlRenderer',
  components: {
    ControlWrapper,
    URadioGroup,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsEnumControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useRadioGroupControl({
      jsonFormsControl,
      clearValue,
    })

    /**
     * Resolution order: `radioGroup.orientation` → `orientation` → `vertical`
     * → vertical (Nuxt UI default). Avoids a crowded horizontal row with more than
     * 3–4 options (especially the `table` variant).
     */
    const orientation = computed(() => {
      const fromUi = control.uiProps('radioGroup').orientation
      if (fromUi === 'horizontal' || fromUi === 'vertical') {
        return fromUi
      }

      const fromOptions = control.appliedOptions.value.orientation
      if (fromOptions === 'horizontal' || fromOptions === 'vertical') {
        return fromOptions
      }

      if (control.appliedOptions.value.vertical === false) {
        return 'horizontal'
      }

      return 'vertical'
    })

    return {
      ...control,
      orientation,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(20, and(isEnumControl, optionIs('format', 'radio'))), // Matches enum controls with option format set to 'radio'
}
</script>
