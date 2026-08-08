<template lang="pug">
  //- Ne pas faire `:label="undefined"` après `v-bind="controlWrapper"` : mergeProps
  //- ignore `undefined`, le titre du schéma restait sur le `UFormField` et annulait
  //- `reserveLabelSpace`. On omet volontairement `label` du bind.
  control-wrapper(
    :id="controlWrapper.id"
    :description="controlWrapper.description"
    :errors="controlWrapper.errors"
    :visible="controlWrapper.visible"
    :required="controlWrapper.required"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
    reserve-label-space
  )
    u-switch(
      v-if="appliedOptions.toggle"
      v-bind="uiProps('switch')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :label="controlWrapper.label"
      :class="styles.control.input"
      :disabled="disable"
      @update:model-value="onChange"
    )
    u-checkbox(
      v-else
      v-bind="uiProps('checkbox')"
      :id="control.id + '-input'"
      :model-value="modelValue"
      :label="controlWrapper.label"
      :class="styles.control.input"
      :disabled="disable"
      @update:model-value="onChange"
    )
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, isBooleanControl } from '@jsonforms/core'
import { defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, RendererProps } from '@jsonforms/vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import USwitch from '@nuxt/ui/components/Switch.vue'
import { ControlWrapper } from '../common'
import { useBooleanControl } from '../composables'

/**
 * BooleanControlRenderer
 *
 * Rend les propriétés `type: "boolean"`.
 *
 * Le libellé est porté par la case elle-même (et non par le `UFormField`), pour obtenir
 * la disposition « case + texte sur une ligne ». `reserveLabelSpace` aligne la case et
 * sa description sur les champs voisins (ligne de libellé fantôme + hauteur d'input).
 *
 * Option `toggle: true` du uischema pour basculer sur un `USwitch`.
 */
const controlRenderer = defineComponent({
  name: 'BooleanControlRenderer',
  components: {
    ControlWrapper,
    UCheckbox,
    USwitch,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)

    return useBooleanControl({
      jsonFormsControl,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(1,
    isBooleanControl,
  ), // Matches schema properties with type "boolean"
}
</script>
