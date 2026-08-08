<template lang="pug">
  .space-y-4
    p.text-sm.text-muted(v-if="!element") Sélectionnez un élément pour l'éditer.

    template(v-else)
      .flex.items-center.gap-2
        u-badge(:label="element.type" color="neutral" variant="subtle" size="sm")
        span.text-xs.text-dimmed(v-if="property" v-text="`#/properties/${property}`")

      //- Title of a Label element.
      u-form-field(v-if="element.type === 'Label'" label="Texte")
        u-input(
          :model-value="element.text ?? ''"
          class="w-full"
          @update:model-value="patchElement({ text: $event })"
        )

      //- Label of a container (Group, Category).
      u-form-field(v-else-if="hasOwnLabel" label="Libellé")
        u-input(
          :model-value="element.label ?? ''"
          class="w-full"
          @update:model-value="patchElement({ label: $event })"
        )

      //- Schema-driven fields.
      template(v-if="property && schemaProperty")
        u-form-field(label="Libellé")
          u-input(
            :model-value="schemaProperty.title ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ title: $event })"
          )

        u-form-field(label="Description" help="Texte d'aide affiché sous le champ")
          u-input(
            :model-value="schemaProperty.description ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ description: $event })"
          )

        u-form-field(label="Texte indicatif")
          u-input(
            :model-value="options.placeholder ?? ''"
            class="w-full"
            @update:model-value="patchOption('placeholder', $event)"
          )

        u-checkbox(
          :model-value="required"
          label="Champ obligatoire"
          @update:model-value="$emit('update:required', property, $event)"
        )

        u-checkbox(
          :model-value="!!options.readonly"
          label="Lecture seule"
          @update:model-value="patchOption('readonly', $event || undefined)"
        )

        //- Numeric bounds.
        template(v-if="isNumeric")
          .grid.grid-cols-2.gap-2
            u-form-field(label="Minimum")
              u-input-number(
                :model-value="schemaProperty.minimum"
                class="w-full"
                @update:model-value="patchProperty({ minimum: $event ?? undefined })"
              )
            u-form-field(label="Maximum")
              u-input-number(
                :model-value="schemaProperty.maximum"
                class="w-full"
                @update:model-value="patchProperty({ maximum: $event ?? undefined })"
              )

        //- Maximum string length.
        u-form-field(v-if="isText" label="Longueur maximale")
          u-input-number(
            :model-value="schemaProperty.maxLength"
            class="w-full"
            @update:model-value="patchProperty({ maxLength: $event ?? undefined })"
          )

        //- Possible enum values, one per line.
        u-form-field(
          v-if="schemaProperty.enum"
          label="Options"
          help="Une valeur par ligne"
        )
          u-textarea(
            :model-value="enumText"
            :rows="4"
            class="w-full"
            @update:model-value="patchEnum($event)"
          )
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue'
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'

/** UISchema types that carry their own label, independent of the schema. */
const SELF_LABELLED = ['Group', 'Category']

/**
 * Panel for editing the selected element.
 *
 * Does not mutate anything itself: it emits intents (`update:element`, `update:property`,
 * `update:required`); the root component alone owns the history stack.
 */
export default defineComponent({
  name: 'BuilderInspector',
  components: {
    UBadge,
    UCheckbox,
    UFormField,
    UInput,
    UInputNumber,
    UTextarea,
  },
  props: {
    element: {
      type: Object as PropType<UISchemaElement | undefined>,
      default: undefined,
    },
    property: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    schema: {
      type: Object as PropType<JsonSchema>,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:element', 'update:property', 'update:required'],
  setup(props, { emit }) {
    const schemaProperty = computed<JsonSchema | undefined>(() =>
      props.property ? props.schema.properties?.[props.property] : undefined,
    )

    const options = computed<Record<string, unknown>>(
      () => (props.element as ControlElement | undefined)?.options ?? {},
    )

    const hasOwnLabel = computed(() => SELF_LABELLED.includes(props.element?.type ?? ''))

    const isNumeric = computed(() =>
      ['number', 'integer'].includes(String(schemaProperty.value?.type)),
    )

    const isText = computed(
      () => schemaProperty.value?.type === 'string' && !schemaProperty.value?.enum,
    )

    /** One enum value per line. Computed here: a literal `\n` in a Pug template
     *  is re-injected as-is into the compiled attribute and breaks the expression parser. */
    const enumText = computed(() => (schemaProperty.value?.enum ?? []).join('\n'))

    const patchElement = (patch: Record<string, unknown>) => {
      emit('update:element', patch)
    }

    const patchProperty = (patch: Partial<JsonSchema>) => {
      emit('update:property', patch)
    }

    /** UISchema options are replaced wholesale: a partial patch would overwrite them. */
    const patchOption = (key: string, value: unknown) => {
      const next = { ...options.value }

      if (value === undefined || value === '' || value === false) {
        delete next[key]
      } else {
        next[key] = value
      }

      emit('update:element', { options: next })
    }

    const patchEnum = (value: string) => {
      const values = value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      emit('update:property', { enum: values.length ? values : undefined })
    }

    return {
      schemaProperty,
      options,
      hasOwnLabel,
      isNumeric,
      isText,
      enumText,
      patchElement,
      patchProperty,
      patchOption,
      patchEnum,
    }
  },
})
</script>
