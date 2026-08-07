import type { ElementPath } from './tree'

/**
 * Type MIME privé du glisser-déposer du builder.
 *
 * Un type dédié (plutôt que `text/plain`) permet d'ignorer proprement tout ce qui
 * vient d'ailleurs — texte sélectionné, fichier déposé par mégarde…
 */
export const DRAG_MIME = 'application/x-jsonforms-builder'

/** Ce qui transite dans un glisser : soit un nouvel élément, soit un déplacement. */
export type DragPayload =
  | { kind: 'field'; key: string }
  | { kind: 'container'; key: string }
  | { kind: 'move'; path: ElementPath }

export interface DropEvent {
  payload: DragPayload
  parentPath: ElementPath
  index: number
}

export const writeDragPayload = (event: DragEvent, payload: DragPayload): void => {
  event.dataTransfer?.setData(DRAG_MIME, JSON.stringify(payload))

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = payload.kind === 'move' ? 'move' : 'copy'
  }
}

/** Lit la charge utile d'un dépôt, ou `null` si elle ne vient pas du builder. */
export const readDragPayload = (event: DragEvent): DragPayload | null => {
  const raw = event.dataTransfer?.getData(DRAG_MIME)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as DragPayload
  } catch {
    return null
  }
}
