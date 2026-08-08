import type { JsonSchema, UISchemaElement } from '@jsonforms/core'

/**
 * Adresse d'un élément dans l'arbre du uischema : la suite des index à suivre dans
 * les `elements` successifs. `[]` désigne la racine, `[0, 2]` le 3ᵉ enfant du 1ᵉʳ.
 */
export type ElementPath = number[]

/**
 * Fragment de schéma manipulé par le builder.
 *
 * Volontairement plus permissif que le type `JsonSchema` de JSONForms, qui est une union
 * draft-4 / draft-7 : on ne peut ni recomposer ni patcher un membre de cette union sans
 * que TypeScript rejette les champs divergents. La validation réelle reste celle d'AJV.
 */
export type SchemaFragment = Record<string, unknown>

/**
 * Clone profond d'un document JSON.
 *
 * Pas de `structuredClone` ici : la définition vit dans un `ref` Vue, et l'algorithme
 * de clonage structuré refuse les proxys réactifs (`DataCloneError`). Un aller-retour
 * JSON est de toute façon exact pour un JSON Schema ou un uischema, qui sont des
 * documents JSON par définition.
 */
export const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

type WithElements = UISchemaElement & { elements?: UISchemaElement[] }

/** Un élément peut-il accueillir des enfants ? */
export const isContainer = (element: UISchemaElement | undefined): boolean => {
  return Array.isArray((element as WithElements)?.elements)
}

export const getElementAt = (
  root: UISchemaElement,
  path: ElementPath,
): UISchemaElement | undefined => {
  return path.reduce<UISchemaElement | undefined>((current, index) => {
    return (current as WithElements)?.elements?.[index]
  }, root)
}

export const isSamePath = (a: ElementPath, b: ElementPath): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

/**
 * `a` est-il un ancêtre de `b` (ou le même élément) ?
 *
 * Sert à interdire de déposer un conteneur à l'intérieur de lui-même, ce qui
 * détacherait le sous-arbre de la racine.
 */
export const isAncestorPath = (a: ElementPath, b: ElementPath): boolean =>
  a.length <= b.length && a.every((value, index) => value === b[index])

/**
 * Insère `element` comme enfant de `parentPath`, à la position `index`.
 *
 * Renvoie un nouvel arbre : le uischema d'entrée n'est jamais muté, ce qui garde
 * l'historique undo/redo exploitable et évite les surprises de réactivité.
 */
export const insertElementAt = (
  root: UISchemaElement,
  parentPath: ElementPath,
  index: number,
  element: UISchemaElement,
): UISchemaElement => {
  const next = cloneJson(root)
  const parent = getElementAt(next, parentPath) as WithElements | undefined

  if (!parent || !Array.isArray(parent.elements)) {
    return next
  }

  const bounded = Math.max(0, Math.min(index, parent.elements.length))
  parent.elements.splice(bounded, 0, element)

  return next
}

export const removeElementAt = (root: UISchemaElement, path: ElementPath): UISchemaElement => {
  if (!path.length) {
    return root
  }

  const next = cloneJson(root)
  const parentPath = path.slice(0, -1)
  const index = path[path.length - 1]
  const parent = getElementAt(next, parentPath) as WithElements | undefined

  parent?.elements?.splice(index, 1)

  return next
}

export const updateElementAt = (
  root: UISchemaElement,
  path: ElementPath,
  patch: Record<string, unknown>,
): UISchemaElement => {
  const next = cloneJson(root)
  const element = getElementAt(next, path)

  if (element) {
    Object.assign(element, patch)
  }

  return next
}

/**
 * Réécrit un chemin pour qu'il reste valide après la suppression de `removed`.
 *
 * Retirer un élément décale tous ses frères suivants d'un cran. Un chemin qui traverse
 * l'un d'eux doit donc être décrémenté à cette profondeur — sans quoi il désigne, après
 * coup, un tout autre nœud de l'arbre.
 */
export const adjustPathAfterRemoval = (path: ElementPath, removed: ElementPath): ElementPath => {
  if (!removed.length || path.length < removed.length) {
    return path
  }

  const depth = removed.length - 1
  const sameBranch = removed.slice(0, depth).every((value, i) => value === path[i])

  if (!sameBranch || path[depth] <= removed[depth]) {
    return path
  }

  const next = [...path]
  next[depth] -= 1

  return next
}

/**
 * Déplace l'élément de `from` vers la position `index` sous `toParent`.
 *
 * Deux décalages se cumulent, et les oublier produit un déplacement d'un cran à côté :
 *  - l'**index** cible, quand on redescend un élément parmi ses propres frères ;
 *  - le **chemin** du parent cible, quand le retrait a lieu plus haut dans la même branche.
 */
export const moveElement = (
  root: UISchemaElement,
  from: ElementPath,
  toParent: ElementPath,
  index: number,
): UISchemaElement => {
  if (!from.length || isAncestorPath(from, toParent)) {
    return root
  }

  const element = getElementAt(root, from)
  if (!element) {
    return root
  }

  const fromParent = from.slice(0, -1)
  const fromIndex = from[from.length - 1]

  let target = index
  if (isSamePath(fromParent, toParent) && fromIndex < index) {
    target -= 1
  }

  const without = removeElementAt(root, from)
  const adjustedParent = adjustPathAfterRemoval(toParent, from)

  return insertElementAt(without, adjustedParent, target, cloneJson(element))
}

/** Décale un élément d'un cran parmi ses frères. */
export const shiftElement = (
  root: UISchemaElement,
  path: ElementPath,
  delta: number,
): UISchemaElement => {
  if (!path.length) {
    return root
  }

  const parentPath = path.slice(0, -1)
  const index = path[path.length - 1]
  const parent = getElementAt(root, parentPath) as WithElements | undefined
  const siblings = parent?.elements ?? []
  const target = index + delta

  if (target < 0 || target >= siblings.length) {
    return root
  }

  // `moveElement` raisonne en position d'insertion : descendre d'un cran veut dire
  // s'insérer après le frère suivant, d'où le +1 sur les deltas positifs.
  return moveElement(root, path, parentPath, delta > 0 ? target + 1 : target)
}

/** Nom de propriété référencé par un `Control`, extrait de son `scope`. */
export const propertyFromScope = (scope: string | undefined): string | undefined => {
  const match = /^#\/properties\/([^/]+)$/.exec(scope ?? '')

  return match?.[1]
}

/**
 * Dérive un nom de propriété valide et unique depuis un libellé humain.
 *
 * Sans accent ni espace, parce qu'il finit dans un pointeur JSON (`#/properties/…`)
 * et dans les clés de la donnée envoyée à l'API.
 */
export const slugifyPropertyName = (label: string, existing: string[] = []): string => {
  const base =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word, index) =>
        index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join('') || 'champ'

  // Un nom ne peut pas commencer par un chiffre : on préfixe plutôt que de tronquer,
  // pour ne pas produire deux propriétés identiques à partir de « 1 » et « 2 ».
  const safe = /^[0-9]/.test(base) ? `champ${base}` : base

  if (!existing.includes(safe)) {
    return safe
  }

  let suffix = 2
  while (existing.includes(`${safe}${suffix}`)) {
    suffix += 1
  }

  return `${safe}${suffix}`
}

/** Ajoute une propriété au schéma sans muter l'original. */
export const addSchemaProperty = (
  schema: JsonSchema,
  name: string,
  property: SchemaFragment,
  required = false,
): JsonSchema => {
  const next = cloneJson(schema)

  // `JsonSchema` de JSONForms est une union draft-4 / draft-7 dont certains champs
  // divergent (`exclusiveMaximum` vaut un booléen en draft-4, un nombre en draft-7).
  // On ne peut donc pas réassigner un membre de l'union tel quel : le builder manipule
  // des fragments libres, la conformité étant garantie par AJV à la validation.
  next.properties = {
    ...(next.properties ?? {}),
    [name]: property,
  } as JsonSchema['properties']

  if (required) {
    next.required = [...new Set([...(next.required ?? []), name])]
  }

  return next
}

export const removeSchemaProperty = (schema: JsonSchema, name: string): JsonSchema => {
  const next = cloneJson(schema)

  if (next.properties) {
    delete next.properties[name]
  }

  if (next.required) {
    next.required = next.required.filter((key) => key !== name)
  }

  return next
}

export const setSchemaPropertyRequired = (
  schema: JsonSchema,
  name: string,
  required: boolean,
): JsonSchema => {
  const next = cloneJson(schema)
  const current = new Set(next.required ?? [])

  if (required) {
    current.add(name)
  } else {
    current.delete(name)
  }

  next.required = [...current]

  return next
}
