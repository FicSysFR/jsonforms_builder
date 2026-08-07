import { computed, ref, type Ref } from 'vue'
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import {
  createControl,
  findPaletteContainer,
  findPaletteField,
} from './palette'
import {
  addSchemaProperty,
  getElementAt,
  insertElementAt,
  isSamePath,
  moveElement,
  propertyFromScope,
  removeElementAt,
  removeSchemaProperty,
  setSchemaPropertyRequired,
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

/** Toutes les propriétés déclarées à la racine du schéma. */
export const listPropertyNames = (schema: JsonSchema): string[] =>
  Object.keys(schema.properties ?? {})

/**
 * Collecte les propriétés encore référencées par au moins un `Control` de l'arbre.
 *
 * Sert à repérer les propriétés orphelines après une suppression de conteneur :
 * retirer un groupe emporte ses champs, et laisser leurs propriétés dans le schéma
 * produirait une donnée que le formulaire ne sait plus afficher.
 */
export const collectReferencedProperties = (
  element: UISchemaElement | undefined,
): string[] => {
  if (!element) {
    return []
  }

  const property = propertyFromScope((element as ControlElement).scope)
  const children = (element as { elements?: UISchemaElement[] }).elements ?? []

  return [
    ...(property ? [property] : []),
    ...children.flatMap(collectReferencedProperties),
  ]
}

const HISTORY_LIMIT = 50

/**
 * État du builder : la définition courante, la sélection, et un historique
 * annuler/rétablir.
 *
 * Toutes les mutations passent par `commit`, ce qui garantit qu'aucune opération ne
 * peut échapper à l'historique — la principale source de bugs dans ce genre d'éditeur.
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

  const selectedProperty = computed(() =>
    propertyFromScope((selectedElement.value as ControlElement | undefined)?.scope),
  )

  const select = (path: ElementPath | null) => {
    selectedPath.value = path
  }

  /** Ajoute un champ de la palette : propriété dans le schéma + `Control` dans le uischema. */
  const addField = (paletteKey: string, parentPath: ElementPath, index: number) => {
    const field = findPaletteField(paletteKey)
    if (!field) return

    const name = slugifyPropertyName(
      field.label,
      listPropertyNames(definition.value.schema),
    )

    const property = { title: field.label, ...field.schema() }

    commit({
      schema: addSchemaProperty(definition.value.schema, name, property),
      uischema: insertElementAt(
        definition.value.uischema,
        parentPath,
        index,
        createControl(name, field.options?.()),
      ),
    })

    select([...parentPath, index])
  }

  /** Ajoute un conteneur (layout, groupe, onglets, titre). */
  const addContainer = (paletteKey: string, parentPath: ElementPath, index: number) => {
    const container = findPaletteContainer(paletteKey)
    if (!container) return

    commit({
      schema: definition.value.schema,
      uischema: insertElementAt(
        definition.value.uischema,
        parentPath,
        index,
        container.create(),
      ),
    })

    select([...parentPath, index])
  }

  /**
   * Supprime un élément et, avec lui, les propriétés de schéma qu'il était seul à
   * référencer — y compris celles de ses descendants.
   */
  const remove = (path: ElementPath) => {
    const element = getElementAt(definition.value.uischema, path)
    if (!element) return

    const uischema = removeElementAt(definition.value.uischema, path)
    const stillReferenced = new Set(collectReferencedProperties(uischema))

    let schema = definition.value.schema
    for (const property of new Set(collectReferencedProperties(element))) {
      if (!stillReferenced.has(property)) {
        schema = removeSchemaProperty(schema, property)
      }
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

  /** Met à jour l'élément de uischema sélectionné (label, texte, options…). */
  const updateElement = (path: ElementPath, patch: Record<string, unknown>) => {
    commit({
      schema: definition.value.schema,
      uischema: updateElementAt(definition.value.uischema, path, patch),
    })
  }

  /**
   * Met à jour la propriété de schéma derrière un `Control` (titre, bornes, enum…).
   *
   * Une clé mise à `undefined` est retirée : c'est ainsi que l'inspecteur efface une
   * borne ou une longueur maximale, sans laisser traîner `"maximum": null` dans le schéma.
   */
  const updateProperty = (name: string, patch: SchemaFragment) => {
    const current = definition.value.schema.properties?.[name]
    if (!current) return

    const merged: SchemaFragment = { ...current, ...patch }

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete merged[key]
      }
    }

    commit({
      schema: addSchemaProperty(definition.value.schema, name, merged),
      uischema: definition.value.uischema,
    })
  }

  const setRequired = (name: string, required: boolean) => {
    commit({
      schema: setSchemaPropertyRequired(definition.value.schema, name, required),
      uischema: definition.value.uischema,
    })
  }

  const isRequired = (name: string) =>
    (definition.value.schema.required ?? []).includes(name)

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
    setRequired,
    isRequired,
    undo,
    redo,
    reset,
  }
}
