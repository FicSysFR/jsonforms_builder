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
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, and, or, hasOption, isEnumControl, isPrimitiveArrayControl, isStringControl } from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsEnumControl, RendererProps } from '@jsonforms/vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useEnumSuggestionControl } from '../composables'

/**
 * EnumAndSuggestionControlRenderer
 *
 * Rend les enums, et les chaînes portant une liste `options.suggestion`, avec un
 * `USelectMenu` (recherche intégrée).
 *
 * En v1 le slot `#no-option` était déclaré *à côté* du `q-select` et non dedans :
 * il ne s'affichait donc jamais. Ici `#empty` est bien imbriqué.
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
     * Les enums fournissent `control.options` ({ label, value }) ; les suggestions
     * arrivent en chaînes brutes qu'il faut normaliser à la même forme.
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

    return { ...control, selectItems }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(2, and(
    or(
      isStringControl,
      isPrimitiveArrayControl,
    ),
    or(
      hasOption('suggestion'),
      isEnumControl,
    ),
  )),
}
</script>
