import { computed } from 'vue'
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  Generate,
  hasType,
  resolveSchema,
  schemaMatches,
  type JsonSchema,
  type TesterContext,
  type UISchemaElement,
} from '@jsonforms/core'
import type { useJsonFormsArrayControl } from '@jsonforms/vue'
import { useUiControl } from '../utils'

type JsonFormsArrayControl = ReturnType<typeof useJsonFormsArrayControl>

type UseArrayControlOptions = {
  jsonFormsControl: JsonFormsArrayControl
}

/**
 * Label for an array item.
 *
 * `options.elementLabelProp` names an object property to use as the title
 * ("Dupont" rather than "Élément 3"). Otherwise we fall back to the rank, 1-based
 * because that is what humans read.
 */
export const resolveArrayItemLabel = (item: unknown, index: number, labelProp?: string): string => {
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
 * Does the item schema describe a primitive value?
 *
 * Determines layout: a compact row for primitives, an expanded card for objects. Rendering
 * a card titled by string makes a five-entry array unreadable.
 */
export const isPrimitiveItemSchema = (schema: JsonSchema | undefined): boolean => {
  if (!schema || schema.properties) {
    return false
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  return typeof type === 'string' && PRIMITIVE_TYPES.includes(type)
}

/** Is the item schema a combinator (`oneOf` / `anyOf` / `allOf`)? */
export const isCombinatorSchema = (schema: JsonSchema | undefined): boolean =>
  Array.isArray(schema?.oneOf) || Array.isArray(schema?.anyOf) || Array.isArray(schema?.allOf)

/**
 * Follows an `items: { $ref: … }` to the target schema.
 *
 * A recursive schema can only be written with `$ref` — the reference breaks the loop. The
 * combinator is therefore not *inside* `items`; it sits at the end of the reference, and
 * failing to follow it means never recognizing a tree.
 *
 * JSONForms' `isObjectArray` performs exactly this dereference for its own test; we
 * reproduce it here rather than working around it.
 */
export const resolveItemsSchema = (
  items: JsonSchema | undefined,
  rootSchema: JsonSchema | undefined,
): JsonSchema | undefined => {
  const ref = items?.$ref

  if (!ref || !rootSchema) {
    return items
  }

  try {
    // A broken `$ref` (missing definition, out-of-document pointer) makes `resolveSchema` throw:
    // the array falls back to unresolved `items`, and the tester simply returns "no".
    return resolveSchema(rootSchema, ref, rootSchema) ?? items
  } catch {
    return items
  }
}

/** Single item schema (non-tuple). */
const singleItemsSchema = (schema: JsonSchema): JsonSchema | undefined => {
  if (Array.isArray(schema.items)) {
    return undefined
  }

  return schema.items
}

/**
 * Tester for arrays whose items are a combinator.
 *
 * JSONForms' `isObjectArrayControl` and `isPrimitiveArrayControl` both require an explicit
 * `items.type`; `items: { oneOf: [...] }` has none, so it matched neither — the array had
 * no renderer.
 */
export const isCombinatorItemsArray = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext,
): boolean =>
  schemaMatches((resolved, rootSchema) => {
    const items = singleItemsSchema(resolved)

    if (!hasType(resolved, 'array') || !items) {
      return false
    }

    return isCombinatorSchema(resolveItemsSchema(items, rootSchema))
  })(uischema, schema, context)

/** An array is full when it reaches the schema's `maxItems` (if any). */
export const isArrayAtCapacity = (length: number, maxItems: number | undefined): boolean => {
  return typeof maxItems === 'number' && length >= maxItems
}

/** Removing an item is forbidden below the schema's `minItems`. */
export const isArrayAtMinimum = (length: number, minItems: number | undefined): boolean => {
  return typeof minItems === 'number' && length <= minItems
}

export const useArrayControl = ({ jsonFormsControl }: UseArrayControlOptions) => {
  const control = useUiControl(jsonFormsControl)

  const items = computed<unknown[]>(() =>
    Array.isArray(control.control.value.data) ? control.control.value.data : [],
  )

  const arraySchema = computed<JsonSchema>(() => control.control.value.arraySchema ?? {})

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

  /** Are items primitive values (string, number, boolean)? */
  const isPrimitiveItems = computed(() => isPrimitiveItemSchema(control.control.value.schema))

  /** Reorder arrows follow the JSONForms `showSortButtons` convention. */
  const showSortButtons = computed(() => !!control.appliedOptions.value?.showSortButtons)

  /**
   * Template for an item: `options.detail` when provided, otherwise a uischema generated
   * from the item schema.
   *
   * For a primitive value, label and description are hidden: they are identical from row
   * to row and would only repeat what the array already conveys.
   */
  const childUiSchema = computed<UISchemaElement>(() => {
    // For a primitive value, we hand-write the `Control` rather than going through
    // `Generate.uiSchema`: it always wraps the control in a layout, so options set on the
    // result never reach the control.
    if (isPrimitiveItems.value) {
      return {
        type: 'Control',
        scope: '#',
        label: false,
        options: { hideDescription: true },
      } as unknown as UISchemaElement
    }

    // A combinator item is handed as-is to the `oneOf`/`anyOf`/`allOf` renderer: generating
    // a layout here would lose the variant selector (or merge UI).
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
          // Without the root schema, the generator cannot follow `$ref`s.
          control.control.value.rootSchema,
        ),
      control.control.value.uischema,
      control.control.value.rootSchema,
    )
  })

  const childPath = (index: number) => composePaths(control.control.value.path, `${index}`)

  const itemLabel = (index: number) =>
    resolveArrayItemLabel(
      items.value[index],
      index,
      control.appliedOptions.value?.elementLabelProp as string | undefined,
    )

  // JSONForms dispatchers return a *thunk*: `addItem(path, value)` does nothing until you
  // call the function it returns.
  const addItem = () => {
    const value = createDefaultValue(control.control.value.schema, control.control.value.rootSchema)

    jsonFormsControl.addItem(control.control.value.path, value)()
  }

  const removeItem = (index: number) => {
    jsonFormsControl.removeItems?.(control.control.value.path, [index])()
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    jsonFormsControl.moveUp?.(control.control.value.path, index)()
  }

  const moveDown = (index: number) => {
    if (index >= items.value.length - 1) return
    jsonFormsControl.moveDown?.(control.control.value.path, index)()
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
