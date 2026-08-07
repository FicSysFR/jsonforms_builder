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
      :orientation="appliedOptions.vertical ? 'vertical' : 'horizontal'"
      :color="control.errors ? 'error' : undefined"
      value-key="value"
      label-key="label"
      @update:model-value="onChange"
    )
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, and, isEnumControl, optionIs } from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsEnumControl, RendererProps } from '@jsonforms/vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useRadioGroupControl } from '../composables'

/**
 * RadioGroupControlRenderer
 *
 * Rend les enums marqués `options.format: "radio"` avec un `URadioGroup`.
 *
 * Disposition horizontale par défaut (équivalent de l'`inline` de `q-option-group`) ;
 * `options.vertical: true` bascule en colonne quand les libellés sont longs.
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

    return useRadioGroupControl({
      jsonFormsControl,
      clearValue,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(20,
    and(
      isEnumControl,
      optionIs('format', 'radio'),
    ),
  ), // Matches enum controls with option format set to 'radio'
}
</script>
