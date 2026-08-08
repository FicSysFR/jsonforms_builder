<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-select(
      v-bind="uiProps('select')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :items="control.options"
      :class="styles.control.input"
      :disabled="isDisabled || isReadonly"
      :placeholder="appliedOptions.placeholder ?? 'Sélectionner…'"
      :color="control.errors ? 'error' : undefined"
      value-key="value"
      label-key="label"
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
  isEnumControl,
  isOneOfEnumControl,
  optionIs,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import {
  rendererProps,
  useJsonFormsEnumControl,
  useJsonFormsOneOfEnumControl,
  type RendererProps,
} from '@jsonforms/vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { ControlWrapper } from '../common'
import { determineClearValue, useJsonForms } from '../utils'
import { useRadioGroupControl } from '../composables'

/**
 * SelectControlRenderer
 *
 * Renders enums marked `options.format: "select"` with `USelect`.
 *
 * Deliberately simpler than the default `USelectMenu`: no search field, no filter portal.
 * Below a dozen options, search is one more obstacle between click and choice; above
 * that, `USelectMenu` is the right component and nothing forces this option.
 *
 * Also handles enums expressed as `oneOf: [{ const, title }]`, whose titles serve as
 * labels.
 */
const controlRenderer = defineComponent({
  name: 'SelectControlRenderer',
  components: {
    ControlWrapper,
    USelect,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonforms = useJsonForms()

    /*
     * `useJsonFormsEnumControl` only fills `control.options` from `schema.enum`: on an
     * enum written as `oneOf: [{ const, title }]` it returns an empty list, and the menu
     * opens on nothing. So we replay the library tester to pick the right mapper.
     *
     * Both composables register an id at `onBeforeMount`: calling both « just in case »
     * would reserve two for the same scope, and the `name` passed to `UFormField` would
     * no longer match the field's.
     */
    const isOneOf = isOneOfEnumControl(props.uischema, props.schema, {
      rootSchema: jsonforms.core?.schema ?? props.schema,
      config: undefined,
    })

    const jsonFormsControl = isOneOf
      ? useJsonFormsOneOfEnumControl(props)
      : useJsonFormsEnumControl(props)

    const clearValue = determineClearValue(undefined)

    // Same contract as the radio group: a single value chosen from a closed list.
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
  tester: rankWith(20, and(or(isEnumControl, isOneOfEnumControl), optionIs('format', 'select'))), // Matches enum controls with option format set to 'select'
}
</script>
