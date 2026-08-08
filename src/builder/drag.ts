import type { ElementPath } from './tree'

/**
 * Private MIME type for builder drag-and-drop.
 *
 * A dedicated type (rather than `text/plain`) lets us cleanly ignore anything
 * from elsewhere — selected text, accidentally dropped files, etc.
 */
export const DRAG_MIME = 'application/x-jsonforms-builder'

/** What travels during a drag: either a new element or a move. */
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

/** Reads the payload from a drop, or `null` if it did not come from the builder. */
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
