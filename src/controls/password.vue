<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input(
      v-bind="uiProps('input')"
      :id="control.id + '-input'"
      :type="passwordVisible ? 'text' : 'password'"
      :model-value="modelValue"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :placeholder="appliedOptions.placeholder"
      :autofocus="appliedOptions.focus"
      :maxlength="maxLength"
      :color="control.errors ? 'error' : undefined"
      @update:model-value="onChange"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#trailing)
        u-button(
          :icon="passwordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :aria-label="passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          :aria-pressed="passwordVisible"
          color="neutral"
          variant="link"
          size="sm"
          tabindex="-1"
          @click="passwordVisible = !passwordVisible"
        )
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, and, formatIs, isStringControl } from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, RendererProps } from '@jsonforms/vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { usePasswordControl } from '../composables'

/**
 * PasswordControlRenderer
 *
 * Rend les chaînes de `format: "password"` avec un `UInput` masqué et un bouton
 * de bascule en slot `#trailing`.
 *
 * Le bouton est `tabindex="-1"` : on ne veut pas qu'il s'intercale dans la navigation
 * clavier entre le champ mot de passe et le suivant.
 */
const controlRenderer = defineComponent({
  name: 'PasswordControlRenderer',
  components: {
    ControlWrapper,
    UInput,
    UButton,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return usePasswordControl({
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
  tester: rankWith(2,
    and(
      isStringControl,
      formatIs('password'),
    ),
  ), // Matches schema properties with format "password"
}
</script>
