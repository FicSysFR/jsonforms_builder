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
import {
  type ControlElement,
  Generate,
  type JsonFormsRendererRegistryEntry,
  isAnyOfControl,
  isOneOfControl,
  or,
  rankWith,
  type JsonSchema,
} from '@jsonforms/core'
import { computed, defineComponent, nextTick, ref, watch } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsOneOfControl,
  type RendererProps,
} from '@jsonforms/vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { ControlWrapper } from '../common'
import { useUiControl } from '../utils'
import { createVariantValue, detectOneOfVariant, resolveCombinatorBranches } from '../composables'

/**
 * CombinatorControlRenderer
 *
 * Renders `oneOf` and `anyOf` schemas: a variant selector, then the sub-form for
 * the selected branch.
 *
 * Missing in v1, although the theme already declared a `oneOf` slot.
 */
const controlRenderer = defineComponent({
  name: 'CombinatorControlRenderer',
  components: {
    ControlWrapper,
    DispatchRenderer,
    USelect,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useUiControl(useJsonFormsOneOfControl(props))

    /** Combinator branches, `$ref` resolved. Cf. `resolveCombinatorBranches`. */
    const variants = computed<JsonSchema[]>(() =>
      resolveCombinatorBranches(control.control.value.schema, control.control.value.rootSchema),
    )

    const variantItems = computed(() => {
      const schema = control.control.value.schema
      const raw: JsonSchema[] = schema.oneOf ?? schema.anyOf ?? []

      // The label may live on the reference (`{ $ref, title }`) or the target:
      // check both rather than losing the title when resolving.
      return variants.value.map((variant, index) => ({
        label: raw[index]?.title ?? variant.title ?? `Option ${index + 1}`,
        value: index,
      }))
    })

    const selectedIndex = ref(
      Math.max(detectOneOfVariant(control.control.value.data, variants.value), 0),
    )

    // Data loaded after the fact (editing an existing record) must reposition the
    // selector — but only if it clearly designates a branch. Otherwise keep the user's
    // choice: incomplete input matches nothing and would jump the form to the first variant.
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
        ? Generate.uiSchema(
            selectedSchema.value,
            'VerticalLayout',
            undefined,
            control.control.value.rootSchema,
          )
        : undefined,
    )

    /**
     * Changing variant resets the data: branches are mutually exclusive.
     *
     * Sub-tree replacement is deferred one tick. Without that, the click selecting the
     * option unmounts the sub-form *while* the `USelect` menu closes — and VueUse's
     * still-attached `onClickOutside` dereferences a null instance
     * (`Cannot read properties of null (reading 'subTree')`, `@vueuse/core` 14.4.0,
     * `hasMultipleRoots` tests `vm` but not `vm.$`).
     */
    const onVariantChange = async (index: number) => {
      if (index === selectedIndex.value) {
        return
      }

      selectedIndex.value = index

      const schema = variants.value[index]
      if (!schema) {
        return
      }

      await nextTick()
      control.onChange(createVariantValue(schema, control.control.value.rootSchema))
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
  tester: rankWith(3, or(isOneOfControl, isAnyOfControl)),
}
</script>
