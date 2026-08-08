import { computed } from 'vue'
import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import type { useJsonFormsControl } from '@jsonforms/vue'
import { useUiControl } from '../utils'

type JsonFormsControl = ReturnType<typeof useJsonFormsControl>

type UseObjectControlOptions = {
  jsonFormsControl: JsonFormsControl
}

/**
 * Ce schéma se prête-t-il au rendu « objet » ?
 *
 * `isObjectControl` d'amont répond oui dès que `object` figure dans le `type` — y compris
 * dans une **union** (`type: ['object', 'string', 'number', …]`). Or sur une union sans
 * `properties`, il n'y a aucune propriété à déployer : ce renderer, mieux classé (rang 2)
 * que les renderers scalaires (rang 1), gagnait le dispatch pour n'afficher qu'une carte
 * vide.
 *
 * On lui fait donc décliner ce cas précis, et la valeur retombe sur un renderer qui sait
 * au moins l'éditer. Un `type: "object"` franc garde la main, même sans `properties` :
 * c'est bien un objet, et le renderer y affiche les clés hors schéma.
 */
export const isRenderableObjectSchema = (schema: JsonSchema | undefined): boolean => {
  if (schema?.properties || schema?.patternProperties) {
    return true
  }

  const type = schema?.type

  return !Array.isArray(type) || type.every((entry) => entry === 'object')
}

/** Un scope qui désigne l'élément courant plutôt qu'une propriété en dessous. */
const isSelfScope = (scope: unknown): boolean =>
  typeof scope !== 'string' || scope === '#' || scope === '#/'

/**
 * La disposition générée contient-elle au moins un contrôle à rendre ?
 *
 * Faute de `properties` exploitables, `Generate.uiSchema` ne peut décrire que l'objet
 * lui-même : il produit soit un `Control` de scope `#`, soit — c'est le cas qu'on
 * manquait — un layout ne contenant qu'un tel contrôle. Redispatché, ce contrôle revient
 * au renderer d'objet, qui régénère la même disposition : `Maximum call stack size
 * exceeded`.
 *
 * On raisonne donc sur la *présence d'un contrôle descendant* et non sur la forme de la
 * racine générée : c'est la seule formulation qui couvre les deux cas, et celles à venir
 * (un layout imbriqué dans un autre).
 */
export const hasRenderableControl = (element: unknown): boolean => {
  if (!element || typeof element !== 'object') {
    return false
  }

  const node = element as { type?: string; scope?: unknown; elements?: unknown }

  if (node.type === 'Control') {
    return !isSelfScope(node.scope)
  }

  return Array.isArray(node.elements) && node.elements.some(hasRenderableControl)
}

/** Clés présentes dans la donnée mais absentes des `properties` du schéma. */
export const collectExtraProperties = (
  data: unknown,
  properties: JsonSchema['properties'],
): { key: string; value: string }[] => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return []
  }

  const known = Object.keys(properties ?? {})

  return Object.entries(data as Record<string, unknown>)
    .filter(([key]) => !known.includes(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
}

export const useObjectControl = ({ jsonFormsControl }: UseObjectControlOptions) => {
  const control = useUiControl(jsonFormsControl)

  /** `options.detail` prime, sinon on génère la disposition depuis le schéma. */
  const detailUiSchema = computed<UISchemaElement | undefined>(() => {
    const detail = control.control.value.uischema.options?.detail as UISchemaElement | undefined

    if (detail) {
      return detail
    }

    const generated = Generate.uiSchema(
      control.control.value.schema,
      'VerticalLayout',
      undefined,
      control.control.value.rootSchema,
    )

    return hasRenderableControl(generated) ? generated : undefined
  })

  const extraProperties = computed(() =>
    collectExtraProperties(control.control.value.data, control.control.value.schema?.properties),
  )

  return {
    ...control,
    detailUiSchema,
    extraProperties,
  }
}
