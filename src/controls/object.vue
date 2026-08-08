<template lang="pug">
  .object-control(v-if="control.visible" :id="controlWrapper.id" :class="styles.group.root")
    h4(v-if="computedLabel" :class="styles.group.label" v-text="computedLabel")

    dispatch-renderer(
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
import { ControlElement, Generate, JsonFormsRendererRegistryEntry, isObjectControl, rankWith, type UISchemaElement } from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsControl, RendererProps } from '@jsonforms/vue'
import { useUiControl } from '../utils'

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
    const control = useUiControl(useJsonFormsControl(props) as any)

    /**
     * `options.detail` prime, sinon on génère la disposition depuis le schéma.
     *
     * On génère à partir des seules `properties` : passer le schéma entier à
     * `Generate.uiSchema` produirait un `Control` sur l'objet lui-même, que ce même
     * renderer reprendrait — récursion infinie.
     */
    const detailUiSchema = computed<UISchemaElement>(() => {
      const detail = (control.control.value.uischema as any)?.options?.detail

      if (detail) {
        return detail as UISchemaElement
      }

      return Generate.uiSchema(control.control.value.schema, 'VerticalLayout')
    })

    /** Clés présentes dans la donnée mais absentes des `properties` du schéma. */
    const extraProperties = computed(() => {
      const data = control.control.value.data
      const known = Object.keys(control.control.value.schema?.properties ?? {})

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return []
      }

      return Object.entries(data as Record<string, unknown>)
        .filter(([key]) => !known.includes(key))
        .map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        }))
    })

    return { ...control, detailUiSchema, extraProperties }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Rang 2, sous le `oneOf` (3) et le WYSIWYG (3) : un objet porteur d'un `oneOf` ou
   * marqué `options.wysiwyg` doit rester à son renderer spécialisé.
   */
  tester: rankWith(2, isObjectControl),
}
</script>
