import { computed } from 'vue'
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  Generate,
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

  /**
   * Gabarit d'un élément : `options.detail` s'il est fourni, sinon un uischema
   * généré à partir du schéma de l'élément.
   */
  const childUiSchema = computed<UISchemaElement>(() =>
    findUISchema(
      control.control.value.uischemas ?? [],
      control.control.value.schema,
      control.control.value.uischema.scope,
      control.control.value.path,
      () => Generate.uiSchema(control.control.value.schema, 'VerticalLayout'),
      control.control.value.uischema,
      control.control.value.rootSchema,
    ),
  )

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
    childUiSchema,
    childPath,
    itemLabel,
    addItem,
    removeItem,
    moveUp,
    moveDown,
  }
}
