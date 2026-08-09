import type { JsonSchema, UISchemaElement } from '@jsonforms/core'

/**
 * Address of an element in the uischema tree: the sequence of indexes to follow in
 * successive `elements`. `[]` denotes the root, `[0, 2]` the 3rd child of the 1st.
 */
export type ElementPath = number[]

/**
 * Schema fragment manipulated by the builder.
 *
 * Deliberately more permissive than JSONForms' `JsonSchema` type, which is a draft-4 /
 * draft-7 union: you cannot recompose or patch a member of that union without TypeScript
 * rejecting divergent fields. Actual validation remains AJV's job.
 */
export type SchemaFragment = Record<string, unknown>

/**
 * Deep clone of a JSON document.
 *
 * No `structuredClone` here: the definition lives in a Vue `ref`, and the structured
 * cloning algorithm rejects reactive proxies (`DataCloneError`). A JSON round-trip is
 * exact anyway for a JSON Schema or uischema, which are JSON documents by definition.
 */
export const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

type WithElements = UISchemaElement & { elements?: UISchemaElement[] }

/** Can an element hold children? */
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
 * Is `a` an ancestor of `b` (or the same element)?
 *
 * Used to prevent dropping a container inside itself, which would detach the subtree
 * from the root.
 */
export const isAncestorPath = (a: ElementPath, b: ElementPath): boolean =>
  a.length <= b.length && a.every((value, index) => value === b[index])

/**
 * Inserts `element` as a child of `parentPath` at position `index`.
 *
 * Returns a new tree: the input uischema is never mutated, which keeps undo/redo
 * history usable and avoids reactivity surprises.
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
 * Rewrites a path so it stays valid after removing `removed`.
 *
 * Removing an element shifts all following siblings down by one. A path that crosses
 * one of them must therefore be decremented at that depth — otherwise it would point
 * to an entirely different tree node afterward.
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
 * Moves the element at `from` to position `index` under `toParent`.
 *
 * Two shifts accumulate, and forgetting either produces an off-by-one move:
 *  - the target **index**, when moving an element among its own siblings;
 *  - the **path** of the target parent, when removal happens higher in the same branch.
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

/** Shifts an element one step among its siblings. */
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

  // `moveElement` reasons in insertion position: moving down one step means
  // inserting after the next sibling, hence the +1 on positive deltas.
  return moveElement(root, path, parentPath, delta > 0 ? target + 1 : target)
}

/** Property name referenced by a `Control`, extracted from its `scope`. */
export const propertyFromScope = (scope: string | undefined): string | undefined => {
  const path = propertyPathFromScope(scope)
  return path?.[path.length - 1]
}

/**
 * Property segments for a JSON Forms scope.
 * `#/properties/a/properties/b` → `['a', 'b']`.
 */
export const propertyPathFromScope = (scope: string | undefined): string[] | undefined => {
  if (!scope?.startsWith('#/')) {
    return undefined
  }

  const parts = scope.slice(2).split('/').filter(Boolean)
  if (parts.length < 2 || parts.length % 2 !== 0) {
    return undefined
  }

  const path: string[] = []
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] !== 'properties' || !parts[i + 1]) {
      return undefined
    }
    path.push(parts[i + 1])
  }

  return path
}

/** Builds a JSON Forms scope from property segments. */
export const scopeFromPropertyPath = (path: string[]): string =>
  `#/${path.map((segment) => `properties/${segment}`).join('/')}`

/**
 * Accepts builder input for a control path:
 * - `#/properties/a/properties/b`
 * - `properties/a/properties/b`
 * - `properties/a/b` (shorthand)
 * - `a/b` (shorthand)
 */
export const parsePropertyPathInput = (raw: string): string[] | undefined => {
  const trimmed = raw.trim().replace(/^#\/?/, '')
  if (!trimmed) {
    return undefined
  }

  const parts = trimmed.split('/').filter(Boolean)
  if (!parts.length) {
    return undefined
  }

  const path: string[] = []
  let i = 0

  while (i < parts.length) {
    if (parts[i] === 'properties') {
      i += 1
      if (!parts[i] || parts[i] === 'properties') {
        return undefined
      }
      path.push(parts[i])
      i += 1
      continue
    }

    path.push(parts[i])
    i += 1
  }

  return path.length ? path : undefined
}

/** Human-editable path shown in the inspector (without the leading `#/`). */
export const formatPropertyPathInput = (path: string[]): string =>
  path.map((segment) => `properties/${segment}`).join('/')

export const isSamePropertyPath = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((segment, index) => segment === b[index])

export const propertyPathKey = (path: string[]): string => path.join('/')

/** Resolves a nested schema property along `path`. */
export const getSchemaPropertyAtPath = (
  schema: JsonSchema,
  path: string[],
): JsonSchema | undefined => {
  if (!path.length) {
    return undefined
  }

  let current: JsonSchema | undefined = schema
  for (const segment of path) {
    current = current?.properties?.[segment] as JsonSchema | undefined
    if (!current) {
      return undefined
    }
  }

  return current
}

const ensureObjectSchema = (node: JsonSchema): JsonSchema => {
  if (node.type !== 'object' && node.type !== undefined) {
    node.type = 'object'
  } else if (node.type === undefined) {
    node.type = 'object'
  }
  node.properties = { ...(node.properties ?? {}) } as JsonSchema['properties']
  return node
}

/** Sets (or replaces) a property at a possibly nested path, creating object parents. */
export const setSchemaPropertyAtPath = (
  schema: JsonSchema,
  path: string[],
  property: SchemaFragment,
): JsonSchema => {
  if (!path.length) {
    return schema
  }

  const next = cloneJson(schema)
  let parent = ensureObjectSchema(next)

  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i]
    const existing = (parent.properties?.[segment] as JsonSchema | undefined) ?? {
      type: 'object',
      properties: {},
    }
    const child = ensureObjectSchema(cloneJson(existing))
    parent.properties = {
      ...(parent.properties ?? {}),
      [segment]: child,
    } as JsonSchema['properties']
    parent = child
  }

  const leaf = path[path.length - 1]
  parent.properties = {
    ...(parent.properties ?? {}),
    [leaf]: property,
  } as JsonSchema['properties']

  return next
}

export const removeSchemaPropertyAtPath = (schema: JsonSchema, path: string[]): JsonSchema => {
  if (!path.length) {
    return schema
  }

  if (path.length === 1) {
    return removeSchemaProperty(schema, path[0])
  }

  const next = cloneJson(schema)
  let parent: JsonSchema | undefined = next

  for (let i = 0; i < path.length - 1; i += 1) {
    parent = parent?.properties?.[path[i]] as JsonSchema | undefined
    if (!parent) {
      return schema
    }
  }

  const leaf = path[path.length - 1]
  if (parent.properties) {
    delete parent.properties[leaf]
  }

  if (parent.required) {
    parent.required = parent.required.filter((key) => key !== leaf)
  }

  return next
}

/**
 * Moves a property definition from one path to another and returns the moved fragment
 * (or `undefined` if the source was missing — target is still created empty-safe).
 */
export const moveSchemaPropertyPath = (
  schema: JsonSchema,
  from: string[],
  to: string[],
): JsonSchema => {
  if (!from.length || !to.length || isSamePropertyPath(from, to)) {
    return schema
  }

  const property = getSchemaPropertyAtPath(schema, from) ?? { type: 'string' }
  const without = removeSchemaPropertyAtPath(schema, from)
  return setSchemaPropertyAtPath(without, to, property as SchemaFragment)
}

export const setSchemaPropertyRequiredAtPath = (
  schema: JsonSchema,
  path: string[],
  required: boolean,
): JsonSchema => {
  if (!path.length) {
    return schema
  }

  if (path.length === 1) {
    return setSchemaPropertyRequired(schema, path[0], required)
  }

  const next = cloneJson(schema)
  let parent: JsonSchema | undefined = next

  for (let i = 0; i < path.length - 1; i += 1) {
    parent = parent?.properties?.[path[i]] as JsonSchema | undefined
    if (!parent) {
      return schema
    }
  }

  parent = ensureObjectSchema(parent)
  const leaf = path[path.length - 1]
  const current = new Set(parent.required ?? [])

  if (required) {
    current.add(leaf)
  } else {
    current.delete(leaf)
  }

  parent.required = [...current]
  return next
}

export const isSchemaPropertyRequiredAtPath = (schema: JsonSchema, path: string[]): boolean => {
  if (!path.length) {
    return false
  }

  if (path.length === 1) {
    return (schema.required ?? []).includes(path[0])
  }

  let parent: JsonSchema | undefined = schema
  for (let i = 0; i < path.length - 1; i += 1) {
    parent = parent?.properties?.[path[i]] as JsonSchema | undefined
    if (!parent) {
      return false
    }
  }

  return (parent.required ?? []).includes(path[path.length - 1])
}

/**
 * Derives a valid, unique property name from a human-readable label.
 *
 * Without accents or spaces, because it ends up in a JSON pointer (`#/properties/…`)
 * and in the keys of the data sent to the API.
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

  // A name cannot start with a digit: prefix rather than truncate,
  // so "1" and "2" do not produce identical property names.
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

/** Adds a property to the schema without mutating the original. */
export const addSchemaProperty = (
  schema: JsonSchema,
  name: string,
  property: SchemaFragment,
  required = false,
): JsonSchema => {
  const next = cloneJson(schema)

  // JSONForms' `JsonSchema` is a draft-4 / draft-7 union whose fields diverge in places
  // (`exclusiveMaximum` is a boolean in draft-4, a number in draft-7). You therefore
  // cannot reassign a union member as-is: the builder manipulates free fragments, with
  // conformance guaranteed by AJV at validation time.
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
