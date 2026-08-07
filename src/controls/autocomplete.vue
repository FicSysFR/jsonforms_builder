<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input-menu(
      v-bind="uiProps('inputMenu')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :items="selectOptions"
      :class="styles.control.input"
      :disabled="isDisabled"
      :placeholder="appliedOptions.placeholder"
      :color="control.errors ? 'error' : undefined"
      value-key="value"
      label-key="label"
      ignore-filter
      @update:model-value="onChange"
      @update:search-term="onSearch"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#empty)
        span.text-sm.text-muted {{ searchHint }}
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, and, hasOption, isStringControl } from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsEnumControl, RendererProps } from '@jsonforms/vue'
import UInputMenu from '@nuxt/ui/components/InputMenu.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useAutocompleteControl } from '../composables'

/**
 * AutocompleteControlRenderer
 *
 * Rend les chaînes portant une configuration `options.api` avec un `UInputMenu`
 * alimenté à distance.
 *
 * `ignore-filter` est indispensable : le filtrage est fait par la source (ou côté
 * client dans `onSearch`), et laisser `UInputMenu` refiltrer par-dessus masquerait
 * des résultats pourtant renvoyés par l'API.
 */
const controlRenderer = defineComponent({
  name: 'AutocompleteControlRenderer',
  components: {
    ControlWrapper,
    UInputMenu,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsEnumControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useAutocompleteControl({
      jsonFormsControl,
      clearValue,
    })

    const searchHint = computed(() =>
      `Saisissez au moins ${control.minLength.value} caractère${control.minLength.value > 1 ? 's' : ''}`,
    )

    return { ...control, searchHint }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(2,
    and(
      isStringControl,
      hasOption('api'),
    ),
  ), // Matches string controls with 'api' option defined
}
</script>
