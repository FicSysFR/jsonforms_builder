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
      span.w-12.shrink-0.text-right.text-sm.tabular-nums.text-muted(v-text="modelValue ?? '—'")
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  isRangeControl,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useSliderControl } from '../composables'

/**
 * SliderControlRenderer
 *
 * Rend les nombres marqués `options.slider` avec un `USlider`.
 *
 * `USlider` n'affiche pas la valeur en permanence (contrairement au `label-always` de
 * Quasar) : on ajoute une pastille numérique à droite pour conserver ce repère,
 * en plus de l'infobulle au survol.
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
  // prettier-ignore
  tester: rankWith(4, isRangeControl), // Matches schema properties with type "number" or "integer" and with "range" option set to true
}
</script>
