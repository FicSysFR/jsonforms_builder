<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-checkbox-group(
      v-bind="uiProps('checkboxGroup')"
      :model-value="selected"
      :items="control.options"
      :class="styles.control.input"
      :disabled="isDisabled"
      :orientation="appliedOptions.vertical === false ? 'horizontal' : 'vertical'"
      value-key="value"
      label-key="label"
      @update:model-value="onSelectionChange"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  and,
  hasType,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonSchema,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsMultiEnumControl, type RendererProps } from '@jsonforms/vue'
import UCheckboxGroup from '@nuxt/ui/components/CheckboxGroup.vue'
import { ControlWrapper } from '../common'
import { useUiControl } from '../utils'

/** `items: { oneOf: [{ const: 'foo' }, …] }` — the "rich" enum form, with titles. */
const hasOneOfItems = (schema: JsonSchema): boolean =>
  Array.isArray(schema.oneOf) && schema.oneOf.every((entry) => entry.const !== undefined)

/** `items: { type: 'string', enum: [...] }` — the simple enum form. */
const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && Array.isArray(schema.enum)

/**
 * MultiEnumControlRenderer
 *
 * Renders an array of values chosen from a closed list — `uniqueItems` with
 * `items.oneOf` or `items.enum` — as checkboxes.
 *
 * Without it, these schemas fell back to the array renderer and offered free-text rows,
 * contradicting the schema constraint.
 */
const controlRenderer = defineComponent({
  name: 'MultiEnumControlRenderer',
  components: {
    ControlWrapper,
    UCheckboxGroup,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsMultiEnumControl(props)
    const control = useUiControl(jsonFormsControl)

    const selected = computed<unknown[]>(() =>
      Array.isArray(control.control.value.data) ? control.control.value.data : [],
    )

    /**
     * `useJsonFormsMultiEnumControl` exposes `addItem`/`removeItem` rather than a global
     * `handleChange`: we therefore translate the new selection into additions and removals,
     * preserving the existing order of already checked values.
     */
    const onSelectionChange = (next: unknown[]) => {
      const path = control.control.value.path
      const before = selected.value

      for (const value of next) {
        if (!before.includes(value)) {
          jsonFormsControl.addItem?.(path, value)
        }
      }

      for (const value of before) {
        if (!next.includes(value)) {
          jsonFormsControl.removeItem?.(path, value)
        }
      }
    }

    return { ...control, selected, onSelectionChange }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rank 5, above the array renderer (2) and `enum-and-suggestion` (2): an array with
   * constrained values must render as checkboxes, not as free-text entries.
   */
  tester: rankWith(
    5,
    and(
      uiTypeIs('Control'),
      schemaMatches((schema) => {
        if (!hasType(schema, 'array') || Array.isArray(schema.items)) {
          return false
        }

        const items = schema.items ?? {}

        return hasOneOfItems(items) || hasEnumItems(items)
      }),
    ),
  ),
}
</script>
