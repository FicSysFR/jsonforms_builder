<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .flex.items-center.gap-4
      u-slider.flex-1(
        v-bind="uiProps('slider')"
        :model-value="modelValue"
        :class="styles.control.input"
        :disabled="isDisabled || isReadonly"
        :min="min"
        :max="max"
        :step="step"
        tooltip
        @update:model-value="onChange"
      )
      span.w-12.shrink-0.text-right.text-sm.tabular-nums.text-muted(
        v-if="showValue"
        v-text="modelValue"
      )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { isSliderControl, useSliderControl } from '../composables'

/**
 * SliderControlRenderer
 *
 * Renders numbers marked `options.slider` with a `USlider`.
 *
 * Activation: `options.slider: true` or a Nuxt UI props object
 * (`{ size, color, … }`). Schema must declare `minimum` and `maximum`.
 *
 * `USlider` does not show the value permanently (unlike Quasar's `label-always`): we add
 * a numeric badge on the right (`options.hideValue: true` removes it), in addition to
 * the hover tooltip.
 */
const controlRenderer = defineComponent({
  name: 'SliderControlRenderer',
  components: {
    ControlWrapper,
    USlider,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(0) as number

    return useSliderControl({
      jsonFormsControl,
      clearValue,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // Rank above NumericControl (1): any control with options.slider + min/max.
  tester: rankWith(4, isSliderControl),
}
</script>
