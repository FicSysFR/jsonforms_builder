<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .flex.items-center.gap-2
      u-popover(:content="{ align: 'start' }")
        u-button(
          :id="control.id + '-input'"
          :disabled="isDisabled || isReadonly"
          :aria-label="`Choisir une couleur${modelValue ? ` (${modelValue})` : ''}`"
          color="neutral"
          variant="outline"
          square
        )
          template(#leading)
            span.size-4.rounded-full.ring.ring-accented(:style="{ backgroundColor: swatch }")
        template(#content)
          u-color-picker.p-2(
            v-bind="uiProps('colorPicker')"
            :model-value="modelValue"
            :format="colorFormat"
            :disabled="isDisabled || isReadonly"
            @update:model-value="onChange"
          )
      u-input.flex-1(
        v-if="showInput"
        v-bind="uiProps('input')"
        :model-value="modelValue"
        :disabled="isDisabled"
        :readonly="isReadonly"
        :placeholder="appliedOptions.placeholder ?? '#000000'"
        :color="control.errors ? 'error' : undefined"
        class="font-mono"
        spellcheck="false"
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
  or,
  formatIs,
  isStringControl,
  optionIs,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UColorPicker from '@nuxt/ui/components/ColorPicker.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useColorControl } from '../composables'

/**
 * ColorControlRenderer
 *
 * Rend les chaînes de `format: "color"` (ou `options.format: "color"`) avec un
 * `UColorPicker` en popover, précédé d'une pastille de prévisualisation.
 *
 * La pipette est délibérément *à côté* d'un champ texte plutôt qu'à sa place : une valeur
 * de marque se copie-colle (`#1B4F72`), elle ne se retrouve pas à la souris. Le champ se
 * retire avec `options.showInput: false`.
 *
 * `options.colorFormat` choisit la notation émise par la pipette (`hex` par défaut,
 * `rgb`, `hsl`, `cmyk`, `lab`).
 */
const controlRenderer = defineComponent({
  name: 'ColorControlRenderer',
  components: {
    ControlWrapper,
    UButton,
    UColorPicker,
    UInput,
    UPopover,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useColorControl({
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
  tester: rankWith(20, and(isStringControl, or(formatIs('color'), optionIs('format', 'color')))), // Matches string controls with format or option format set to 'color'
}
</script>
