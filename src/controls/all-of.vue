<template lang="pug">
  .all-of(v-if="control.visible" :id="controlWrapper.id" :class="styles.group.root")
    h4(v-if="computedLabel" :class="styles.group.label" v-text="computedLabel")

    //-
      Le schéma passé au dispatcher est l'original (avec `allOf`), pas le plat de
      fusion. `Resolve` retrouve les propriétés via le repli sur les branches ; surtout,
      la référence reste stable d'un tick à l'autre — un schéma synthétique recréé à
      chaque invalidation faisait reboucler le `watch(() => props.schema)` de
      `@jsonforms/vue` (`Maximum recursive updates exceeded`).
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
 * Rend les schémas `allOf`. Contrairement à `oneOf`/`anyOf`, il n'y a rien à choisir :
 * **toutes** les branches s'appliquent simultanément. On en déduit une disposition
 * unique (fusion plate, y compris `allOf` imbriqués), puis on redispatche contre le
 * schéma d'origine pour que la résolution JSON Forms reste correcte.
 *
 * On utilise `useJsonFormsControl` et non `useJsonFormsAllOfControl` : ce dernier
 * recompile chaque branche via AJV à chaque évaluation du computed, et AJV *mute*
 * le schéma. Or le schéma vit dans l'état réactif de JSON Forms — chaque mutation
 * relançait le rendu (`Maximum recursive updates exceeded`).
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
  /** Rang 4 : au-dessus du renderer d'objet, qui capte aussi ces schémas mais sans savoir les fusionner. */
  tester: rankWith(4, isAllOfControl),
}
</script>
