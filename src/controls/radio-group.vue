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
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, and, isEnumControl, optionIs } from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
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
 * Disposition verticale par défaut (comme `URadioGroup` et le multi-enum) ;
 * `options.vertical: false` ou `options.orientation: "horizontal"` bascule en ligne.
 * `options.radioGroup.orientation` prime toujours via `v-bind` + calcul ci-dessous.
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
     * Ordre de résolution : `radioGroup.orientation` → `orientation` → `vertical`
     * → verticale (défaut Nuxt UI). Évite la rangée horizontale saturée dès qu'il y a
     * plus de 3–4 options (variante `table` surtout).
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
  tester: rankWith(20,
    and(
      isEnumControl,
      optionIs('format', 'radio'),
    ),
  ), // Matches enum controls with option format set to 'radio'
}
</script>
