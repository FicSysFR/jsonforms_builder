import { describe, expect, it, vi } from 'vitest'
import {
  DRAG_MIME,
  readDragPayload,
  writeDragPayload,
  type DragPayload,
} from '../../src/builder/drag'

const mockDataTransfer = () => {
  const store = new Map<string, string>()

  return {
    store,
    dataTransfer: {
      effectAllowed: 'uninitialized' as string,
      setData: vi.fn((type: string, value: string) => {
        store.set(type, value)
      }),
      getData: vi.fn((type: string) => store.get(type) ?? ''),
    },
  }
}

describe('writeDragPayload / readDragPayload', () => {
  it('round-trips a palette field', () => {
    const { dataTransfer } = mockDataTransfer()
    const payload: DragPayload = { kind: 'field', key: 'text' }
    const event = { dataTransfer } as unknown as DragEvent

    writeDragPayload(event, payload)

    expect(dataTransfer.setData).toHaveBeenCalledWith(DRAG_MIME, JSON.stringify(payload))
    expect(dataTransfer.effectAllowed).toBe('copy')
    expect(readDragPayload(event)).toEqual(payload)
  })

  it('marks a relocation as move', () => {
    const { dataTransfer } = mockDataTransfer()
    const payload: DragPayload = { kind: 'move', path: [1, 0] }

    writeDragPayload({ dataTransfer } as unknown as DragEvent, payload)

    expect(dataTransfer.effectAllowed).toBe('move')
  })

  it('round-trips a container', () => {
    const { dataTransfer } = mockDataTransfer()
    const payload: DragPayload = { kind: 'container', key: 'Group' }
    const event = { dataTransfer } as unknown as DragEvent

    writeDragPayload(event, payload)
    expect(readDragPayload(event)).toEqual(payload)
  })

  it('ignores a drop outside the builder', () => {
    const event = {
      dataTransfer: {
        getData: () => '',
      },
    } as unknown as DragEvent

    expect(readDragPayload(event)).toBeNull()
  })

  it('ignores invalid JSON', () => {
    const event = {
      dataTransfer: {
        getData: () => '{not-json',
      },
    } as unknown as DragEvent

    expect(readDragPayload(event)).toBeNull()
  })

  it('tolerates a missing dataTransfer', () => {
    const event = {} as DragEvent

    expect(() => writeDragPayload(event, { kind: 'field', key: 'text' })).not.toThrow()
    expect(readDragPayload(event)).toBeNull()
  })
})

describe('DRAG_MIME', () => {
  it('uses a private MIME type', () => {
    expect(DRAG_MIME).toBe('application/x-jsonforms-builder')
  })
})
