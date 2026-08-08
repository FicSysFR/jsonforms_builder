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
      :model-value="constDisplay"
      :class="styles.control.input"
      readonly
      disabled
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { ControlWrapper } from '../common'
import { useUiControl } from '../utils'

/**
 * ConstControlRenderer
 *
 * Displays, read-only, a property whose schema fixes the value via `const` without
 * declaring a `type`.
 *
 * Not just a textbook case: this is the form of **variant discriminants**
 * (`kind: { const: 'track' }`). Without this renderer, each `oneOf` branch showed
 * « No applicable renderer found » next to its discriminant.
 *
 * The field is disabled rather than hidden: the value tells the user which branch they
 * are in.
 */
const controlRenderer = defineComponent({
  name: 'ConstControlRenderer',
  components: {
    ControlWrapper,
    UInput,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useUiControl(useJsonFormsControl(props))

    const constDisplay = computed(() => {
      const value = control.control.value.schema.const

      return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
    })

    return { ...control, constDisplay }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rank 3 to beat typed controls: a schema with both `type: 'string'` and `const` is
   * a fixed value, not free input. `enum` is excluded — it belongs to the selector,
   * even with a single entry.
   */
  tester: rankWith(
    3,
    and(
      uiTypeIs('Control'),
      schemaMatches((schema) => schema.const !== undefined && schema.enum === undefined),
    ),
  ),
}
</script>
