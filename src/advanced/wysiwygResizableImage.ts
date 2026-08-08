import Image from '@tiptap/extension-image'
import type { NodeView, NodeViewRenderer, NodeViewRendererProps } from '@tiptap/core'

export type WysiwygImageResizeOptions = {
  enabled: boolean
  directions?: Array<
    'top' | 'right' | 'bottom' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  >
  minWidth?: number
  minHeight?: number
  alwaysPreserveAspectRatio?: boolean
}

const shrinkWrapResizeDom = (dom: HTMLElement) => {
  // TipTap ResizableNodeView sets `display:flex` (block-level → full editor width).
  dom.style.setProperty('display', 'inline-flex', 'important')
  dom.style.setProperty('flex-direction', 'column', 'important')
  dom.style.setProperty('align-items', 'flex-start', 'important')
  dom.style.setProperty('width', 'max-content', 'important')
  dom.style.setProperty('max-width', '100%', 'important')
  dom.style.setProperty('background', 'transparent', 'important')
  dom.style.setProperty('background-color', 'transparent', 'important')
}

/**
 * TipTap Image with resize, forcing the node-view chrome to hug the bitmap
 * instead of stretching across the editor.
 */
export const WysiwygResizableImage = Image.extend({
  name: 'image',

  addNodeView() {
    const parent = this.parent
    if (!parent) return null

    const createParentView = parent.call(this) as NodeViewRenderer | null
    if (!createParentView) return null

    return (props: NodeViewRendererProps) => {
      const view = createParentView(props) as NodeView
      const dom = view.dom
      if (!(dom instanceof HTMLElement)) return view

      shrinkWrapResizeDom(dom)

      const img = dom.querySelector('img')
      if (img && !img.complete) {
        img.addEventListener('load', () => shrinkWrapResizeDom(dom), { once: true })
      }

      const originalUpdate = view.update
      if (originalUpdate) {
        view.update = (node, decorations, innerDecorations) => {
          const result = originalUpdate.call(view, node, decorations, innerDecorations)
          shrinkWrapResizeDom(dom)
          return result
        }
      }

      return view
    }
  },
})
