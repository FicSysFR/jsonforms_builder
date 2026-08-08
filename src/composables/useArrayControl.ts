import { computed } from 'vue'
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  Generate,
  hasType,
  schemaMatches,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import type { useJsonFormsArrayControl } from '@jsonforms/vue'
import { useUiControl } from '../utils'

type JsonFormsArrayControl = ReturnType<typeof useJsonFormsArrayControl>

type UseArrayControlOptions = {
  jsonFormsControl: JsonFormsArrayControl
}

/**
 * Libellé d'un élément de tableau.
 *
 * `options.elementLabelProp` désigne une propriété de l'objet à utiliser comme titre
 * (« Dupont » plutôt que « Élément 3 »). À défaut on retombe sur le rang, en base 1
 * parce que c'est ce que lit un humain.
 */
export const resolveArrayItemLabel = (
  item: unknown,
  index: number,
  labelProp?: string,
): string => {
  if (labelProp && item && typeof item === 'object') {
    const value = (item as Record<string, unknown>)[labelProp]

    if (value !== undefined && value !== null && `${value}` !== '') {
      return `${value}`
    }
  }

  return `Élément ${index + 1}`
}

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean']

/**
 * Le schéma d'élément décrit-il une valeur simple ?
 *
 * Détermine la mise en page : une ligne compacte pour les valeurs simples, une carte
 * dépliée pour les objets. Rendre une carte titrée par chaîne de caractères rend un
 * tableau de cinq entrées illisible.
 */
export const isPrimitiveItemSchema = (schema: JsonSchema | undefined): boolean => {
  if (!schema || schema.properties) {
    return false
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  return typeof type === 'string' && PRIMITIVE_TYPES.includes(type)
}

/** Le schéma d'élément est-il un combinateur (`oneOf` / `anyOf`) ? */
export const isCombinatorSchema = (schema: JsonSchema | undefined): boolean =>
  Array.isArray((schema as any)?.oneOf) || Array.isArray((schema as any)?.anyOf)

/**
 * Tester des tableaux dont les éléments sont un combinateur.
 *
 * `isObjectArrayControl` et `isPrimitiveArrayControl` de JSONForms exigent tous deux un
 * `items.type` explicite ; un `items: { oneOf: [...] }` n'en a pas, et échappait donc
 * aux deux — le tableau n'avait alors aucun renderer.
 */
export const isCombinatorItemsArray = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: any,
): boolean =>
  schemaMatches(
    (resolved) =>
      hasType(resolved, 'array') &&
      !Array.isArray((resolved as any).items) &&
      isCombinatorSchema((resolved as any).items),
  )(uischema, schema, context)

/** Un tableau est plein quand il atteint le `maxItems` du schéma (s'il en a un). */
export const isArrayAtCapacity = (
  length: number,
  maxItems: number | undefined,
): boolean => {
  return typeof maxItems === 'number' && length >= maxItems
}

/** Retirer un élément est interdit sous le `minItems` du schéma. */
export const isArrayAtMinimum = (
  length: number,
  minItems: number | undefined,
): boolean => {
  return typeof minItems === 'number' && length <= minItems
}

export const useArrayControl = ({ jsonFormsControl }: UseArrayControlOptions) => {
  const control = useUiControl(jsonFormsControl as any)

  const items = computed<unknown[]>(() =>
    Array.isArray(control.control.value.data) ? control.control.value.data : [],
  )

  const arraySchema = computed<JsonSchema>(
    () => (control.control.value as any).arraySchema ?? {},
  )

  const canAdd = computed(
    () =>
      control.control.value.enabled &&
      !control.isReadonly.value &&
      !isArrayAtCapacity(items.value.length, arraySchema.value?.maxItems),
  )

  const canRemove = computed(
    () =>
      control.control.value.enabled &&
      !control.isReadonly.value &&
      !isArrayAtMinimum(items.value.length, arraySchema.value?.minItems),
  )

  /** Les éléments sont-ils des valeurs simples (chaîne, nombre, booléen) ? */
  const isPrimitiveItems = computed(() =>
    isPrimitiveItemSchema(control.control.value.schema),
  )

  /** Les flèches de réordonnancement suivent la convention JSONForms `showSortButtons`. */
  const showSortButtons = computed(
    () => !!control.appliedOptions.value?.showSortButtons,
  )

  /**
   * Gabarit d'un élément : `options.detail` s'il est fourni, sinon un uischema
   * généré à partir du schéma de l'élément.
   *
   * Pour une valeur simple, on masque libellé et description : ils sont identiques
   * d'une ligne à l'autre et ne feraient que répéter ce que porte déjà le tableau.
   */
  const childUiSchema = computed<UISchemaElement>(() => {
    // Pour une valeur simple, on écrit le `Control` à la main plutôt que de passer par
    // `Generate.uiSchema` : celui-ci enveloppe toujours le contrôle dans un layout, si
    // bien que les options posées sur le résultat n'atteignent jamais le contrôle.
    if (isPrimitiveItems.value) {
      return {
        type: 'Control',
        scope: '#',
        label: false,
        options: { hideDescription: true },
      } as unknown as UISchemaElement
    }

    // Un élément combinateur se confie tel quel au renderer de `oneOf`/`anyOf` : lui
    // générer une disposition ici perdrait le sélecteur de variante.
    if (isCombinatorSchema(control.control.value.schema)) {
      return { type: 'Control', scope: '#' } as unknown as UISchemaElement
    }

    return findUISchema(
      control.control.value.uischemas ?? [],
      control.control.value.schema,
      control.control.value.uischema.scope,
      control.control.value.path,
      () =>
        Generate.uiSchema(
          control.control.value.schema,
          'VerticalLayout',
          undefined,
          // Sans le schéma racine, le générateur ne sait pas suivre les `$ref`.
          control.control.value.rootSchema,
        ),
      control.control.value.uischema,
      control.control.value.rootSchema,
    )
  })

  const childPath = (index: number) =>
    composePaths(control.control.value.path, `${index}`)

  const itemLabel = (index: number) =>
    resolveArrayItemLabel(
      items.value[index],
      index,
      control.appliedOptions.value?.elementLabelProp,
    )

  // Les dispatchers de JSONForms renvoient un *thunk* : `addItem(path, value)` ne fait
  // rien tant qu'on n'appelle pas la fonction qu'il retourne.
  const addItem = () => {
    const value = createDefaultValue(
      control.control.value.schema,
      control.control.value.rootSchema,
    )

    ;(jsonFormsControl as any).addItem(control.control.value.path, value)()
  }

  const removeItem = (index: number) => {
    ;(jsonFormsControl as any).removeItems?.(control.control.value.path, [index])()
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    ;(jsonFormsControl as any).moveUp?.(control.control.value.path, index)()
  }

  const moveDown = (index: number) => {
    if (index >= items.value.length - 1) return
    ;(jsonFormsControl as any).moveDown?.(control.control.value.path, index)()
  }

  return {
    ...control,
    items,
    arraySchema,
    canAdd,
    canRemove,
    isPrimitiveItems,
    showSortButtons,
    childUiSchema,
    childPath,
    itemLabel,
    addItem,
    removeItem,
    moveUp,
    moveDown,
  }
}
