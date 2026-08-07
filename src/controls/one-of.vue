<template lang="pug">
  .one-of(v-if="control.visible" :id="controlWrapper.id" :class="styles.oneOf.root")
    control-wrapper(
      v-bind="controlWrapper"
      :styles="styles"
      :ui-props="uiProps"
      :show-description="showDescription()"
      :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
    )
      u-select(
        v-bind="uiProps('select')"
        :id="control.id + '-oneof'"
        :model-value="selectedIndex"
        :items="variantItems"
        :class="styles.oneOf.select"
        :disabled="isDisabled"
        value-key="value"
        label-key="label"
        @update:model-value="onVariantChange"
      )

    dispatch-renderer(
      v-if="selectedUiSchema"
      :schema="selectedSchema"
      :uischema="selectedUiSchema"
      :path="control.path"
      :enabled="control.enabled"
      :renderers="control.renderers"
      :cells="control.cells"
    )
</template>

<script lang="ts">
import { ControlElement, Generate, JsonFormsRendererRegistryEntry, isOneOfControl, rankWith, type JsonSchema } from '@jsonforms/core'
import { computed, defineComponent, ref, watch } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsOneOfControl, RendererProps } from '@jsonforms/vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { ControlWrapper } from '../common'
import { useUiControl } from '../utils'
import { createVariantValue, detectOneOfVariant } from '../composables'

/**
 * OneOfControlRenderer
 *
 * Rend les schémas `oneOf` : un sélecteur de variante, puis le sous-formulaire de la
 * branche retenue.
 *
 * Absent de la v1, alors que le thème déclarait déjà un slot `oneOf`.
 */
const controlRenderer = defineComponent({
  name: 'OneOfControlRenderer',
  components: {
    ControlWrapper,
    DispatchRenderer,
    USelect,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useUiControl(useJsonFormsOneOfControl(props) as any)

    const variants = computed<JsonSchema[]>(
      () => control.control.value.schema?.oneOf ?? [],
    )

    const variantItems = computed(() =>
      variants.value.map((variant, index) => ({
        label: variant.title ?? `Option ${index + 1}`,
        value: index,
      })),
    )

    const selectedIndex = ref(
      Math.max(detectOneOfVariant(control.control.value.data, variants.value), 0),
    )

    // Une donnée chargée après coup (édition d'un enregistrement existant) doit
    // repositionner le sélecteur — mais uniquement si elle désigne franchement une
    // branche. Sinon on garde le choix de l'utilisateur : une saisie encore incomplète
    // ne correspond à rien et ferait sauter le formulaire sur la première variante.
    watch(
      () => control.control.value.data,
      (data) => {
        const detected = detectOneOfVariant(data, variants.value)

        if (detected >= 0) {
          selectedIndex.value = detected
        }
      },
    )

    const selectedSchema = computed<JsonSchema | undefined>(
      () => variants.value[selectedIndex.value],
    )

    const selectedUiSchema = computed(() =>
      selectedSchema.value
        ? Generate.uiSchema(selectedSchema.value, 'VerticalLayout')
        : undefined,
    )

    /** Changer de variante réinitialise la donnée : les branches sont exclusives. */
    const onVariantChange = (index: number) => {
      if (index === selectedIndex.value) {
        return
      }

      selectedIndex.value = index

      const schema = variants.value[index]
      if (schema) {
        control.onChange(createVariantValue(schema, control.control.value.rootSchema))
      }
    }

    return {
      ...control,
      variants,
      variantItems,
      selectedIndex,
      selectedSchema,
      selectedUiSchema,
      onVariantChange,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isOneOfControl),
}
</script>
