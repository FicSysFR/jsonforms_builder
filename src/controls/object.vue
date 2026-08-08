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

    //- Les clés présentes dans la donnée mais absentes du schéma restent visibles, en
    //- lecture seule : les masquer donnerait l'illusion que le formulaire montre tout,
    //- alors qu'un enregistrement peut très bien porter des champs hors schéma.
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
 * Rend un `Control` qui résout vers un schéma `type: "object"` : il déploie les
 * propriétés déclarées, chacune redispatchée vers son propre renderer.
 *
 * Sans lui, tout objet — y compris la racine visée par `{ "scope": "#/" }` — affichait
 * « No applicable renderer found ».
 *
 * Limite assumée : les clés libres (`additionalProperties` / `patternProperties`) ne
 * sont pas *éditables*. Celles déjà présentes dans la donnée sont affichées en lecture
 * seule ; en ajouter demanderait une interface de saisie de clés, à part entière.
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
     * Le garde-fou contre la récursion infinie vit dans `useObjectControl` : faute de
     * `properties` exploitables, la disposition générée ne décrit que l'objet lui-même,
     * et la redispatcher ramènerait ici sans fin. Cf. `hasRenderableControl`.
     */
    return useObjectControl({ jsonFormsControl: useJsonFormsControl(props) })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rang 2, sous le `oneOf` (3) et le WYSIWYG (3) : un objet porteur d'un `oneOf` ou
   * marqué `options.wysiwyg` doit rester à son renderer spécialisé.
   *
   * `isRenderableObjectSchema` écarte les types *union* sans `properties`, que ce rang 2
   * ferait sinon gagner contre les renderers scalaires (rang 1) — pour n'afficher qu'une
   * carte vide.
   */
  tester: rankWith(2, and(isObjectControl, schemaMatches(isRenderableObjectSchema))),
}
</script>
