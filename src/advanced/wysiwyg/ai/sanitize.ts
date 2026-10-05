/**
 * Allowlist HTML sanitizer for AI output. The result is additionally parsed by the
 * Tiptap schema on insertion, which drops anything the editor does not model.
 * Generated HTML is never rendered with `v-html`.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'hr',
  'mark',
  'span',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
])

/** Dropped together with their content. */
const DROPPED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'frame',
  'frameset',
  'noscript',
  'template',
  'svg',
  'math',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'title',
  'head',
])

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  ol: ['start'],
}

const SAFE_SCHEME = /^(https?|mailto|tel):/i

/**
 * `true` for http(s), mailto, tel, fragment and relative URLs; `false` for any other
 * scheme (`javascript:`, `data:`…) and protocol-relative URLs (`//host`).
 */
export const isSafeWysiwygUrl = (url: string): boolean => {
  // Browsers ignore ASCII control characters and whitespace inside schemes.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point.
  const compact = url.replace(/[\u0000- \u007f]/g, '')
  if (!compact) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact)) return SAFE_SCHEME.test(compact)
  return !/^[\\/]{2}/.test(compact)
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const sanitizeNode = (node: Node, out: Document): Node | DocumentFragment | null => {
  if (node.nodeType === 3) return out.createTextNode(node.textContent ?? '')
  if (node.nodeType !== 1) return null

  const element = node as Element
  const tag = element.tagName.toLowerCase()
  if (DROPPED_TAGS.has(tag)) return null

  const children = out.createDocumentFragment()
  for (const child of Array.from(element.childNodes)) {
    const clean = sanitizeNode(child, out)
    if (clean) children.appendChild(clean)
  }
  if (!ALLOWED_TAGS.has(tag)) return children

  const clean = out.createElement(tag)
  for (const name of ALLOWED_ATTRIBUTES[tag] ?? []) {
    const value = element.getAttribute(name)
    if (value == null) continue
    if (name === 'href' && !isSafeWysiwygUrl(value)) continue
    if (name !== 'href' && name !== 'title' && !/^\d{1,3}$/.test(value)) continue
    clean.setAttribute(name, value)
  }
  if (tag === 'a' && clean.hasAttribute('href')) clean.setAttribute('rel', 'noopener noreferrer')
  clean.appendChild(children)
  return clean
}

/**
 * Returns sanitized HTML. Without `DOMParser` (SSR), falls back to escaped text so
 * nothing unsafe can be produced.
 */
export const sanitizeWysiwygAiHtml = (html: string): string => {
  if (typeof DOMParser === 'undefined') {
    return escapeHtml(html.replace(/<[^>]*>/g, ''))
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const out = document.implementation.createHTMLDocument('')
  const container = out.createElement('div')
  for (const child of Array.from(parsed.body.childNodes)) {
    const clean = sanitizeNode(child, out)
    if (clean) container.appendChild(clean)
  }
  return container.innerHTML
}
