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
 * Affiche, en lecture seule, une propriété dont le schéma fixe la valeur par `const`
 * sans déclarer de `type`.
 *
 * Ce n'est pas qu'un cas d'école : c'est la forme même des **discriminants de variantes**
 * (`kind: { const: 'track' }`). Sans ce renderer, chaque branche d'un `oneOf` affichait
 * « No applicable renderer found » en regard de son discriminant.
 *
 * Le champ est désactivé plutôt que masqué : la valeur renseigne l'utilisateur sur la
 * branche dans laquelle il se trouve.
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
   * Rang 3 pour passer devant les contrôles typés : un schéma qui porte à la fois
   * `type: 'string'` et `const` reste une valeur figée, pas une saisie libre.
   * `enum` est exclu — il relève du sélecteur, même à une seule entrée.
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
