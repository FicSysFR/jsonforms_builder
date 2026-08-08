<template lang="pug">
  .all-of(v-if="control.visible" :id="controlWrapper.id" :class="styles.group.root")
    h4(v-if="computedLabel" :class="styles.group.label" v-text="computedLabel")

    //-
      The schema passed to the dispatcher is the original (with `allOf`), not the
      flattened merge. `Resolve` finds properties via branch fallback; more importantly,
      the reference stays stable from tick to tick — a synthetic schema recreated on
      every invalidation retriggered `@jsonforms/vue`'s `watch(() => props.schema)`
      (`Maximum recursive updates exceeded`).
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
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  isAllOfControl,
  rankWith,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControl,
  type RendererProps,
} from '@jsonforms/vue'
import { useAllOfControl } from '../composables'

/**
 * AllOfControlRenderer
 *
 * Renders `allOf` schemas. Unlike `oneOf`/`anyOf`, there is nothing to choose:
 * **all** branches apply simultaneously. A single layout is derived (flat merge,
 * including nested `allOf`), then redispatched against the original schema so JSON
 * Forms resolution stays correct.
 *
 * Uses `useJsonFormsControl` rather than `useJsonFormsAllOfControl`: the latter
 * recompiles each branch via AJV on every computed evaluation, and AJV *mutates*
 * the schema. The schema lives in JSON Forms' reactive state — each mutation
 * retriggered rendering (`Maximum recursive updates exceeded`).
 */
const controlRenderer = defineComponent({
  name: 'AllOfControlRenderer',
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useAllOfControl({ jsonFormsControl: useJsonFormsControl(props) })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /** Rank 4: above the object renderer, which also matches these schemas but cannot merge them. */
  tester: rankWith(4, isAllOfControl),
}
</script>
