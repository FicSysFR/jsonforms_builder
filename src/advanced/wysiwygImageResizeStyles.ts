/** TipTap ResizableNodeView ships no visuals — handles are otherwise 0×0. */
const STYLE_ID = 'jf-wysiwyg-image-resize'

/**
 * TipTap sets `display:flex` on the container (block-level → full editor width).
 * Nuxt UI then paints `bg-primary/20` on `.ProseMirror-selectednode`, which looks like
 * a huge green slab beside a small image. Force inline shrink-wrap + kill the wash.
 */
const RESIZE_CSS = `
.ProseMirror [data-resize-container] {
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  width: max-content !important;
  max-width: 100% !important;
  vertical-align: bottom;
  line-height: 0;
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

.ProseMirror [data-resize-container] > [data-resize-wrapper] {
  position: relative !important;
  display: block !important;
  width: max-content !important;
  max-width: 100% !important;
  line-height: 0;
}

.ProseMirror [data-resize-container] img {
  display: block !important;
  max-width: 100%;
  margin: 0;
  vertical-align: bottom;
}

.ProseMirror [data-resize-container].ProseMirror-selectednode,
.ProseMirror-selectednode[data-resize-container],
.ProseMirror [data-resize-container][data-resize-state="true"] {
  background: transparent !important;
  background-color: transparent !important;
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

.ProseMirror [data-resize-handle] {
  z-index: 2;
  box-sizing: border-box;
  width: 8px;
  height: 8px;
  background: var(--ui-bg, #fff);
  border: 1.5px solid var(--ui-primary);
  border-radius: 9999px;
  opacity: 0;
  pointer-events: none;
}

.ProseMirror [data-resize-container].ProseMirror-selectednode [data-resize-handle],
.ProseMirror-selectednode[data-resize-container] [data-resize-handle],
.ProseMirror [data-resize-container][data-resize-state="true"] [data-resize-handle] {
  opacity: 1;
  pointer-events: auto;
}

.ProseMirror [data-resize-handle="top-left"] { transform: translate(-50%, -50%); cursor: nwse-resize; }
.ProseMirror [data-resize-handle="top-right"] { transform: translate(50%, -50%); cursor: nesw-resize; }
.ProseMirror [data-resize-handle="bottom-left"] { transform: translate(-50%, 50%); cursor: nesw-resize; }
.ProseMirror [data-resize-handle="bottom-right"] { transform: translate(50%, 50%); cursor: nwse-resize; }
`

/** Idempotent: safe to call from every WYSIWYG instance. */
export const ensureWysiwygImageResizeStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = RESIZE_CSS
  document.head.appendChild(style)
}

/** Replace injected styles after HMR / style tweaks in the same session. */
export const refreshWysiwygImageResizeStyles = () => {
  if (typeof document === 'undefined') return
  document.getElementById(STYLE_ID)?.remove()
  ensureWysiwygImageResizeStyles()
}
