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
 * Rend les enums marqués `options.format: "select"` avec un `USelect`.
 *
 * Variante volontairement plus sobre que le `USelectMenu` par défaut : pas de champ de
 * recherche, pas de portail de filtrage. Au-dessous d'une dizaine d'options, la barre de
 * recherche est un obstacle de plus entre le clic et le choix ; au-dessus, `USelectMenu`
 * reste le bon composant et rien n'oblige à poser cette option.
 *
 * Prend aussi les enums exprimés en `oneOf: [{ const, title }]`, dont les titres servent
 * alors de libellés.
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
     * `useJsonFormsEnumControl` ne peuple `control.options` que depuis `schema.enum` : sur un
     * enum écrit en `oneOf: [{ const, title }]` il renvoie une liste vide, et le menu s'ouvre
     * sur rien. On rejoue donc le tester de la librairie pour choisir le bon mappeur.
     *
     * Les deux composables enregistrent un identifiant à `onBeforeMount` : les appeler tous
     * les deux « au cas où » en réserverait deux pour le même scope, et le `name` transmis à
     * `UFormField` cesserait de correspondre à celui du champ.
     */
    const isOneOf = isOneOfEnumControl(props.uischema, props.schema, {
      rootSchema: jsonforms.core?.schema ?? props.schema,
      config: undefined,
    })

    const jsonFormsControl = isOneOf
      ? useJsonFormsOneOfEnumControl(props)
      : useJsonFormsEnumControl(props)

    const clearValue = determineClearValue(undefined)

    // Même contrat que le groupe radio : une valeur simple choisie dans une liste fermée.
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
