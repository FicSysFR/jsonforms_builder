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

/** `items: { oneOf: [{ const: 'foo' }, …] }` — la forme enum « riche », avec titres. */
const hasOneOfItems = (schema: JsonSchema): boolean =>
  Array.isArray(schema.oneOf) && schema.oneOf.every((entry) => entry.const !== undefined)

/** `items: { type: 'string', enum: [...] }` — la forme enum simple. */
const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && Array.isArray(schema.enum)

/**
 * MultiEnumControlRenderer
 *
 * Rend un tableau de valeurs à choisir dans une liste fermée — `uniqueItems` avec des
 * `items.oneOf` ou `items.enum` — sous forme de cases à cocher.
 *
 * Sans lui, ces schémas tombaient sur le renderer de tableau et proposaient d'ajouter
 * des lignes de texte libre, ce qui contredit la contrainte du schéma.
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
     * `useJsonFormsMultiEnumControl` expose `addItem`/`removeItem` plutôt qu'un
     * `handleChange` global : on traduit donc la nouvelle sélection en ajouts et
     * retraits, ce qui préserve l'ordre existant des valeurs déjà cochées.
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
   * Rang 5, au-dessus du renderer de tableau (2) et de `enum-and-suggestion` (2) :
   * un tableau à valeurs contraintes doit se rendre en cases à cocher, pas en liste
   * de saisies libres.
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
