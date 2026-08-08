/** TipTap ResizableNodeView ships no visuals — handles are otherwise 0×0. */
const STYLE_ID = 'jf-wysiwyg-image-resize'

const RESIZE_CSS = `
.ProseMirror [data-resize-container] {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}
.ProseMirror [data-resize-container] img {
  max-width: 100%;
  height: auto;
}
.ProseMirror [data-resize-container].ProseMirror-selectednode,
.ProseMirror-selectednode[data-resize-container] {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
.ProseMirror [data-resize-handle] {
  z-index: 2;
  box-sizing: border-box;
  width: 0.625rem;
  height: 0.625rem;
  background: var(--ui-bg, #fff);
  border: 2px solid var(--ui-primary);
  border-radius: 9999px;
  opacity: 0;
  pointer-events: none;
}
.ProseMirror [data-resize-container].ProseMirror-selectednode [data-resize-handle],
.ProseMirror-selectednode[data-resize-container] [data-resize-handle] {
  opacity: 1;
  pointer-events: auto;
}
.ProseMirror [data-resize-handle="top-left"] { transform: translate(-50%, -50%); cursor: nwse-resize; }
.ProseMirror [data-resize-handle="top-right"] { transform: translate(50%, -50%); cursor: nesw-resize; }
.ProseMirror [data-resize-handle="bottom-left"] { transform: translate(-50%, 50%); cursor: nesw-resize; }
.ProseMirror [data-resize-handle="bottom-right"] { transform: translate(50%, 50%); cursor: nwse-resize; }
.ProseMirror [data-resize-handle="left"],
.ProseMirror [data-resize-handle="right"] {
  width: 0.375rem;
  height: auto;
  min-height: 1.25rem;
  margin-block: auto;
  border-radius: 0.25rem;
  cursor: ew-resize;
}
.ProseMirror [data-resize-container][data-resize-state="true"] {
  outline: 2px solid var(--ui-primary);
}
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
