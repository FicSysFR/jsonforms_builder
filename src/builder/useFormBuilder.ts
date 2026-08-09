import { computed, ref, type Ref } from 'vue'
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import { createControl, findPaletteContainer, findPaletteField } from './palette'
import {
  addSchemaProperty,
  getElementAt,
  getSchemaPropertyAtPath,
  insertElementAt,
  isSamePath,
  isSchemaPropertyRequiredAtPath,
  moveElement,
  moveSchemaPropertyPath,
  parsePropertyPathInput,
  propertyPathFromScope,
  propertyPathKey,
  removeElementAt,
  removeSchemaPropertyAtPath,
  scopeFromPropertyPath,
  setSchemaPropertyAtPath,
  setSchemaPropertyRequiredAtPath,
  shiftElement,
  slugifyPropertyName,
  updateElementAt,
  type ElementPath,
  type SchemaFragment,
} from './tree'

export interface FormDefinition {
  schema: JsonSchema
  uischema: UISchemaElement
}

export const createEmptyDefinition = (): FormDefinition => ({
  schema: { type: 'object', properties: {} },
  uischema: { type: 'VerticalLayout', elements: [] } as UISchemaElement,
})

/** All properties declared at the root of the schema. */
export const listPropertyNames = (schema: JsonSchema): string[] =>
  Object.keys(schema.properties ?? {})

/**
 * Collects property paths still referenced by at least one `Control` in the tree.
 *
 * Keys are `propertyPathKey` values (`a`, `a/b`, …). Used to find orphaned properties
 * after removing a container: removing a group takes its fields, and leaving their
 * properties in the schema would produce data the form can no longer display.
 */
export const collectReferencedProperties = (element: UISchemaElement | undefined): string[] => {
  if (!element) {
    return []
  }

  const path = propertyPathFromScope((element as ControlElement).scope)
  const children = (element as { elements?: UISchemaElement[] }).elements ?? []

  return [
    ...(path ? [propertyPathKey(path)] : []),
    ...children.flatMap(collectReferencedProperties),
  ]
}

const HISTORY_LIMIT = 50

/**
 * Builder state: the current definition, selection, and an undo/redo history.
 *
 * All mutations go through `commit`, ensuring no operation can bypass history — the
 * main source of bugs in this kind of editor.
 */
export const useFormBuilder = (initial?: Partial<FormDefinition>) => {
  const empty = createEmptyDefinition()

  const definition = ref<FormDefinition>({
    schema: initial?.schema ?? empty.schema,
    uischema: initial?.uischema ?? empty.uischema,
  }) as Ref<FormDefinition>

  const selectedPath = ref<ElementPath | null>(null)

  const past = ref<FormDefinition[]>([])
  const future = ref<FormDefinition[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  const commit = (next: FormDefinition) => {
    past.value = [...past.value, definition.value].slice(-HISTORY_LIMIT)
    future.value = []
    definition.value = next
  }

  const undo = () => {
    const previous = past.value[past.value.length - 1]
    if (!previous) return

    past.value = past.value.slice(0, -1)
    future.value = [definition.value, ...future.value]
    definition.value = previous
  }

  const redo = () => {
    const next = future.value[0]
    if (!next) return

    future.value = future.value.slice(1)
    past.value = [...past.value, definition.value]
    definition.value = next
  }

  const selectedElement = computed(() =>
    selectedPath.value ? getElementAt(definition.value.uischema, selectedPath.value) : undefined,
  )

  const selectedPropertyPath = computed(
    () => propertyPathFromScope((selectedElement.value as ControlElement | undefined)?.scope),
  )

  /** Leaf property name — kept for callers that only need the last segment. */
  const selectedProperty = computed(() => {
    const path = selectedPropertyPath.value
    return path?.[path.length - 1]
  })

  const select = (path: ElementPath | null) => {
    selectedPath.value = path
  }

  /** Adds a palette field: property in the schema + `Control` in the uischema. */
  const addField = (paletteKey: string, parentPath: ElementPath, index: number) => {
    const field = findPaletteField(paletteKey)
    if (!field) return

    const name = slugifyPropertyName(field.label, listPropertyNames(definition.value.schema))

    const property = { title: field.label, ...field.schema() }
    const element = field.createElement?.(name) ?? createControl(name, field.options?.())

    commit({
      schema: addSchemaProperty(definition.value.schema, name, property),
      uischema: insertElementAt(definition.value.uischema, parentPath, index, element),
    })

    select([...parentPath, index])
  }

  /** Adds a container (layout, group, tabs, title). */
  const addContainer = (paletteKey: string, parentPath: ElementPath, index: number) => {
    const container = findPaletteContainer(paletteKey)
    if (!container) return

    commit({
      schema: definition.value.schema,
      uischema: insertElementAt(definition.value.uischema, parentPath, index, container.create()),
    })

    select([...parentPath, index])
  }

  /**
   * Removes an element and, with it, schema properties it alone referenced —
   * including those of its descendants.
   */
  const remove = (path: ElementPath) => {
    const element = getElementAt(definition.value.uischema, path)
    if (!element) return

    const uischema = removeElementAt(definition.value.uischema, path)
    const stillReferenced = new Set(collectReferencedProperties(uischema))

    let schema = definition.value.schema
    for (const key of new Set(collectReferencedProperties(element))) {
      if (stillReferenced.has(key)) {
        continue
      }

      const propertyPath = key.split('/')
      schema = removeSchemaPropertyAtPath(schema, propertyPath)
    }

    commit({ schema, uischema })

    if (selectedPath.value && isSamePath(selectedPath.value, path)) {
      select(null)
    }
  }

  const shift = (path: ElementPath, delta: number) => {
    commit({
      schema: definition.value.schema,
      uischema: shiftElement(definition.value.uischema, path, delta),
    })
  }

  const move = (from: ElementPath, toParent: ElementPath, index: number) => {
    const uischema = moveElement(definition.value.uischema, from, toParent, index)

    if (uischema === definition.value.uischema) {
      return
    }

    commit({ schema: definition.value.schema, uischema })
    select(null)
  }

  /** Updates the selected uischema element (label, text, options…). */
  const updateElement = (path: ElementPath, patch: Record<string, unknown>) => {
    commit({
      schema: definition.value.schema,
      uischema: updateElementAt(definition.value.uischema, path, patch),
    })
  }

  /**
   * Updates the schema property behind a `Control` (title, bounds, enum…).
   *
   * A key set to `undefined` is removed: that is how the inspector clears a bound or
   * max length without leaving `"maximum": null` in the schema.
   */
  const updateProperty = (propertyPath: string[], patch: SchemaFragment) => {
    const current = getSchemaPropertyAtPath(definition.value.schema, propertyPath)
    if (!current) return

    const merged: SchemaFragment = { ...current, ...patch }

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete merged[key]
      }
    }

    commit({
      schema: setSchemaPropertyAtPath(definition.value.schema, propertyPath, merged),
      uischema: definition.value.uischema,
    })
  }

  /**
   * Atomically patches both the uischema element and its schema property
   * (e.g. WYSIWYG `contentType` + schema `type`).
   */
  const updateControl = (
    path: ElementPath,
    propertyPath: string[],
    elementPatch: Record<string, unknown>,
    propertyPatch: SchemaFragment,
  ) => {
    const current = getSchemaPropertyAtPath(definition.value.schema, propertyPath)
    if (!current) return

    const merged: SchemaFragment = { ...current, ...propertyPatch }

    for (const [key, value] of Object.entries(propertyPatch)) {
      if (value === undefined) {
        delete merged[key]
      }
    }

    commit({
      schema: setSchemaPropertyAtPath(definition.value.schema, propertyPath, merged),
      uischema: updateElementAt(definition.value.uischema, path, elementPatch),
    })
  }

  /**
   * Changes the control scope / schema path.
   * Moves the schema property when the previous path was valid.
   */
  const updateScope = (elementPath: ElementPath, rawPath: string) => {
    const nextPath = parsePropertyPathInput(rawPath)
    if (!nextPath) {
      return
    }

    const element = getElementAt(definition.value.uischema, elementPath) as
      | ControlElement
      | undefined
    if (!element || typeof (element as { scope?: string }).scope !== 'string') {
      return
    }

    const previousPath = propertyPathFromScope(element.scope)
    const nextScope = scopeFromPropertyPath(nextPath)

    if (element.scope === nextScope) {
      return
    }

    let schema = definition.value.schema
    if (previousPath) {
      schema = moveSchemaPropertyPath(schema, previousPath, nextPath)
    } else if (!getSchemaPropertyAtPath(schema, nextPath)) {
      schema = setSchemaPropertyAtPath(schema, nextPath, { type: 'string' })
    }

    commit({
      schema,
      uischema: updateElementAt(definition.value.uischema, elementPath, { scope: nextScope }),
    })
  }

  const setRequired = (propertyPath: string[], required: boolean) => {
    commit({
      schema: setSchemaPropertyRequiredAtPath(definition.value.schema, propertyPath, required),
      uischema: definition.value.uischema,
    })
  }

  const isRequired = (propertyPath: string[]) =>
    isSchemaPropertyRequiredAtPath(definition.value.schema, propertyPath)

  const reset = (next?: Partial<FormDefinition>) => {
    const blank = createEmptyDefinition()

    past.value = []
    future.value = []
    selectedPath.value = null
    definition.value = {
      schema: next?.schema ?? blank.schema,
      uischema: next?.uischema ?? blank.uischema,
    }
  }

  return {
    definition,
    selectedPath,
    selectedElement,
    selectedProperty,
    selectedPropertyPath,
    canUndo,
    canRedo,
    select,
    addField,
    addContainer,
    remove,
    shift,
    move,
    updateElement,
    updateProperty,
    updateControl,
    updateScope,
    setRequired,
    isRequired,
    undo,
    redo,
    reset,
  }
}
