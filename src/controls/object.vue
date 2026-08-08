<template lang="pug">
  .object-control(v-if="control.visible" :id="controlWrapper.id" :class="styles.group.root")
    h4(v-if="computedLabel" :class="styles.group.label" v-text="computedLabel")

    dispatch-renderer(
      v-if="detailUiSchema"
      :schema="control.schema"
      :uischema="detailUiSchema"
      :path="control.path"
      :enabled="control.enabled"
      :renderers="control.renderers"
      :cells="control.cells"
    )

    p.text-xs.text-muted(v-if="control.description" v-text="control.description")

    //- Keys present in the data but absent from the schema remain visible, read-only:
    //- hiding them would suggest the form shows everything, when a record may carry
    //- fields outside the schema.
    .space-y-1(v-if="extraProperties.length")
      p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Propriétés hors schéma
      dl.grid.grid-cols-1.gap-1(class="sm:grid-cols-2")
        .flex.items-baseline.gap-2(v-for="entry in extraProperties" :key="entry.key")
          dt.text-xs.font-medium.text-muted(v-text="entry.key")
          dd.min-w-0.truncate.text-xs(v-text="entry.value")
</template>

<script lang="ts">
import {
  and,
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  isObjectControl,
  rankWith,
  schemaMatches,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControl,
  type RendererProps,
} from '@jsonforms/vue'
import { isRenderableObjectSchema, useObjectControl } from '../composables'

/**
 * ObjectControlRenderer
 *
 * Renders a `Control` that resolves to a `type: "object"` schema: it expands declared
 * properties, each redispatched to its own renderer.
 *
 * Without it, every object — including the root targeted by `{ "scope": "#/" }` — showed
 * « No applicable renderer found ».
 *
 * Assumed limitation: free-form keys (`additionalProperties` / `patternProperties`) are
 * not *editable*. Those already present in the data are shown read-only; adding new ones
 * would require a key-entry interface of its own.
 */
const controlRenderer = defineComponent({
  name: 'ObjectControlRenderer',
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    /*
     * The guard against infinite recursion lives in `useObjectControl`: without
     * usable `properties`, the generated layout describes only the object itself,
     * and redispatching would loop back here forever. Cf. `hasRenderableControl`.
     */
    return useObjectControl({ jsonFormsControl: useJsonFormsControl(props) })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rank 2, below `oneOf` (3) and WYSIWYG (3): an object carrying a `oneOf` or marked
   * `options.wysiwyg` must stay with its specialized renderer.
   *
   * `isRenderableObjectSchema` excludes union types without `properties`, which this
   * rank 2 would otherwise win over scalar renderers (rank 1) — showing only an empty
   * card.
   */
  tester: rankWith(2, and(isObjectControl, schemaMatches(isRenderableObjectSchema))),
}
</script>
