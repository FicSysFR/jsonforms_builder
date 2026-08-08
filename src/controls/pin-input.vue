<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-pin-input(
      v-bind="uiProps('pinInput')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :length="length"
      :type="pinType"
      :mask="mask"
      :otp="otp"
      :disabled="isDisabled || isReadonly"
      :autofocus="appliedOptions.focus"
      :placeholder="appliedOptions.placeholder"
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
  and,
  isStringControl,
  optionIs,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UPinInput from '@nuxt/ui/components/PinInput.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { usePinInputControl } from '../composables'

/**
 * PinInputControlRenderer
 *
 * Rend les chaînes marquées `options.format: "pin"` avec un `UPinInput` : codes de
 * vérification, PIN, jetons courts.
 *
 * Le nombre de cases est déduit du schéma (`maxLength`, `minLength`, ou le quantificateur
 * du `pattern`) : `{ "type": "string", "pattern": "^\\d{6}$" }` affiche six cases sans
 * qu'on ait à le répéter dans le uischema. `options.length` reste prioritaire.
 *
 * Aucune valeur n'est propagée en `string[]` : le composable recolle les cases, le modèle
 * reste la chaîne décrite par le schéma.
 */
const controlRenderer = defineComponent({
  name: 'PinInputControlRenderer',
  components: {
    ControlWrapper,
    UPinInput,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return usePinInputControl({
      jsonFormsControl,
      clearValue,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(20, and(isStringControl, optionIs('format', 'pin'))), // Matches string controls with option format set to 'pin'
}
</script>
