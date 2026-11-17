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
      :disabled="isLocked"
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
        span.text-sm.text-muted {{ t('jsonformsBuilder.select.noResults') }}
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  isOneOfEnumControl,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import {
  rendererProps,
  useJsonFormsEnumControl,
  useJsonFormsOneOfEnumControl,
  type RendererProps,
} from '@jsonforms/vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import { ControlWrapper } from '../common'
import { determineClearValue, useJsonForms } from '../utils'
import { enumSuggestionTester, useEnumSuggestionControl } from '../composables'
import { useUiText } from '../i18n/ui'

/**
 * EnumAndSuggestionControlRenderer
 *
 * Renders enums, `oneOf` lists of constants (`[{ const, title }]`) and strings with an
 * `options.suggestion` list using a `USelectMenu` (built-in search).
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
    const jsonforms = useJsonForms()

    // Only one of the two composables may run: each reserves an id at `onBeforeMount`.
    const isOneOf = isOneOfEnumControl(props.uischema, props.schema, {
      rootSchema: jsonforms.core?.schema ?? props.schema,
      config: undefined,
    })
    const jsonFormsControl = isOneOf
      ? useJsonFormsOneOfEnumControl(props)
      : useJsonFormsEnumControl(props)
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

    // Nuxt UI's own placeholder is English-only: use the translated library text.
    const t = useUiText()
    const searchInput = computed(() => ({
      placeholder: t('jsonformsBuilder.select.search'),
      variant: 'none' as const,
    }))

    return { ...control, selectItems, searchInput, t }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: enumSuggestionTester,
}
</script>
