<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-select-menu(
      v-bind="uiProps('selectMenu')"
      :id="control.id + '-input'"
      :model-value="control.data"
      :items="selectItems"
      :class="styles.control.input"
      :disabled="isDisabled"
      :placeholder="appliedOptions.placeholder"
      :search-input="searchInput"
      :multiple="isArrayControl"
      :color="control.errors ? 'error' : undefined"
      value-key="value"
      label-key="label"
      @update:model-value="onChange"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#empty)
        span.text-sm.text-muted Aucun résultat
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  or,
  hasOption,
  isEnumControl,
  isPrimitiveArrayControl,
  isStringControl,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsEnumControl, type RendererProps } from '@jsonforms/vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useEnumSuggestionControl } from '../composables'

/**
 * EnumAndSuggestionControlRenderer
 *
 * Renders enums and strings with an `options.suggestion` list using a `USelectMenu`
 * (built-in search).
 *
 * In v1 the `#no-option` slot was declared *next to* the `q-select` rather than inside
 * it, so it never appeared. Here `#empty` is properly nested.
 */
const controlRenderer = defineComponent({
  name: 'EnumAndSuggestionControlRenderer',
  components: {
    ControlWrapper,
    USelectMenu,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsEnumControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useEnumSuggestionControl({
      jsonFormsControl,
      clearValue,
    })

    /**
     * Enums provide `control.options` ({ label, value }); suggestions arrive as raw
     * strings that must be normalized to the same shape.
     */
    const selectItems = computed(() => {
      const options = control.control.value.options
      if (options?.length) {
        return options
      }

      return (control.suggestions.value ?? []).map((suggestion) => ({
        label: suggestion,
        value: suggestion,
      }))
    })

    // Nuxt UI defaults to English "Search..."; keep UI copy in French like `#empty`.
    const searchInput = { placeholder: 'Rechercher…', variant: 'none' as const }

    return { ...control, selectItems, searchInput }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(
    2,
    and(or(isStringControl, isPrimitiveArrayControl), or(hasOption('suggestion'), isEnumControl)),
  ),
}
</script>
