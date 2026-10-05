/**
 * Nuxt UI's editor theme does not style tables, task lists or search matches. Scoped
 * to `.ProseMirror` and built on Nuxt UI CSS variables so the host theme applies.
 */
const STYLE_ID = 'jf-wysiwyg-editor'

const EDITOR_CSS = `
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  overflow: hidden;
}
.ProseMirror th,
.ProseMirror td {
  position: relative;
  min-width: 4rem;
  border: 1px solid var(--ui-border-accented);
  padding: 0.25rem 0.5rem;
  vertical-align: top;
  text-align: start;
}
.ProseMirror th {
  background: var(--ui-bg-elevated);
  font-weight: 600;
}
.ProseMirror th > *,
.ProseMirror td > * {
  margin: 0 !important;
}
.ProseMirror .selectedCell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: color-mix(in oklab, var(--ui-primary) 15%, transparent);
}
.ProseMirror .tableWrapper {
  overflow-x: auto;
}
/* Nuxt UI sets \`[&_ul]:list-disc\` as an important utility: only a more specific
   important rule in the same layer can override it. */
@layer utilities {
  .ProseMirror ul[data-type='taskList'] {
    list-style: none !important;
    padding-inline-start: 0 !important;
  }
}
.ProseMirror ul[data-type='taskList'] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding-inline-start: 0;
}
.ProseMirror ul[data-type='taskList'] li > label {
  flex: none;
  margin-top: 0.2rem;
  user-select: none;
}
.ProseMirror ul[data-type='taskList'] li > div {
  flex: 1 1 auto;
  min-width: 0;
}
.ProseMirror ul[data-type='taskList'] li[data-checked='true'] > div {
  color: var(--ui-text-muted);
  text-decoration: line-through;
}
.ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
  accent-color: var(--ui-primary);
}
.ProseMirror mark {
  border-radius: 0.125rem;
  padding: 0 0.125rem;
  color: inherit;
}
.ProseMirror .jf-wysiwyg-search-match {
  background: color-mix(in oklab, var(--ui-warning) 30%, transparent);
  border-radius: 0.125rem;
}
.ProseMirror .jf-wysiwyg-search-match-current {
  background: color-mix(in oklab, var(--ui-warning) 60%, transparent);
  outline: 1px solid var(--ui-warning);
}
`

/** Idempotent: safe to call from every WYSIWYG instance. */
export const ensureWysiwygEditorStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = EDITOR_CSS
  document.head.appendChild(style)
}

/** Replace injected styles after HMR / style tweaks in the same session. */
export const refreshWysiwygEditorStyles = () => {
  if (typeof document === 'undefined') return
  document.getElementById(STYLE_ID)?.remove()
  ensureWysiwygEditorStyles()
}
