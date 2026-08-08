<template lang="pug">
  .all-of(v-if="control.visible" :id="controlWrapper.id" :class="styles.group.root")
    h4(v-if="computedLabel" :class="styles.group.label" v-text="computedLabel")

    dispatch-renderer(
      v-if="mergedUiSchema"
      :schema="mergedSchema"
      :uischema="mergedUiSchema"
      :path="control.path"
      :enabled="control.enabled"
      :renderers="control.renderers"
      :cells="control.cells"
    )

    p.text-xs.text-muted(v-if="control.description" v-text="control.description")
</template>

<script lang="ts">
import { ControlElement, Generate, JsonFormsRendererRegistryEntry, isAllOfControl, rankWith, resolveSchema, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsAllOfControl, RendererProps } from '@jsonforms/vue'
import { useUiControl } from '../utils'

/**
 * AllOfControlRenderer
 *
 * Rend les schémas `allOf`. Contrairement à `oneOf`/`anyOf`, il n'y a rien à choisir :
 * **toutes** les branches s'appliquent simultanément. On les fusionne donc en un seul
 * objet, dont on déduit une disposition unique.
 *
 * La fusion est volontairement plate — on réunit les `properties` et les `required` —
 * plutôt qu'une composition JSON Schema complète : c'est ce dont a besoin le rendu, et
 * la validation reste de toute façon celle d'AJV sur le schéma d'origine.
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
    const control = useUiControl(useJsonFormsAllOfControl(props) as any)

    /** Réunion des branches, `$ref` suivis. */
    const mergedSchema = computed<JsonSchema>(() => {
      const schema = control.control.value.schema as any
      const branches: any[] = Array.isArray(schema?.allOf) ? schema.allOf : []
      const rootSchema = control.control.value.rootSchema

      const merged: any = { type: 'object', properties: {}, required: [] }

      for (const branch of [schema, ...branches]) {
        let resolved = branch

        if (branch?.$ref) {
          try {
            resolved = resolveSchema(rootSchema, branch.$ref, rootSchema) ?? branch
          } catch {
            resolved = branch
          }
        }

        Object.assign(merged.properties, resolved?.properties ?? {})
        merged.required.push(...(resolved?.required ?? []))
      }

      merged.required = [...new Set(merged.required)]

      return merged as JsonSchema
    })

    const mergedUiSchema = computed<UISchemaElement | undefined>(() => {
      const detail = (control.control.value.uischema as any)?.options?.detail
      if (detail) {
        return detail as UISchemaElement
      }

      // Aucune propriété récupérée : mieux vaut ne rien rendre que de dispatcher un
      // `Control` sur `#`, qui reviendrait ici même en boucle.
      if (!Object.keys((mergedSchema.value as any).properties ?? {}).length) {
        return undefined
      }

      return Generate.uiSchema(mergedSchema.value, 'VerticalLayout')
    })

    return { ...control, mergedSchema, mergedUiSchema }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /** Rang 4 : au-dessus du renderer d'objet, qui capte aussi ces schémas mais sans savoir les fusionner. */
  tester: rankWith(4, isAllOfControl),
}
</script>
