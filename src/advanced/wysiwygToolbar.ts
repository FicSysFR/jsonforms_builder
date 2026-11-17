import { createUiText, type UiText } from '../i18n/ui'

/**
 * Default toolbar for the WYSIWYG renderer, labelled through `t`.
 *
 * Each sub-array forms a group; `UEditorToolbar` inserts separators between them.
 * Override via `options.toolbar`, or set `options.toolbar: false` to hide.
 */
export const buildDefaultWysiwygToolbar = (t: UiText = createUiText()) => [
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo-2',
      'aria-label': t('jsonformsBuilder.wysiwyg.undo'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.undo') },
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo-2',
      'aria-label': t('jsonformsBuilder.wysiwyg.redo'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.redo') },
    },
  ],
  [
    {
      kind: 'heading',
      level: 1,
      icon: 'i-lucide-heading-1',
      'aria-label': t('jsonformsBuilder.wysiwyg.heading', { level: 1 }),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.heading', { level: 1 }) },
    },
    {
      kind: 'heading',
      level: 2,
      icon: 'i-lucide-heading-2',
      'aria-label': t('jsonformsBuilder.wysiwyg.heading', { level: 2 }),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.heading', { level: 2 }) },
    },
    {
      kind: 'heading',
      level: 3,
      icon: 'i-lucide-heading-3',
      'aria-label': t('jsonformsBuilder.wysiwyg.heading', { level: 3 }),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.heading', { level: 3 }) },
    },
    {
      kind: 'paragraph',
      icon: 'i-lucide-pilcrow',
      'aria-label': t('jsonformsBuilder.wysiwyg.paragraph'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.paragraph') },
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      'aria-label': t('jsonformsBuilder.wysiwyg.bold'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.bold') },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      'aria-label': t('jsonformsBuilder.wysiwyg.italic'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.italic') },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      'aria-label': t('jsonformsBuilder.wysiwyg.underline'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.underline') },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      'aria-label': t('jsonformsBuilder.wysiwyg.strike'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.strike') },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      'aria-label': t('jsonformsBuilder.wysiwyg.code'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.code') },
    },
  ],
  [
    {
      kind: 'textAlign',
      align: 'left',
      icon: 'i-lucide-align-left',
      'aria-label': t('jsonformsBuilder.wysiwyg.alignLeft'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.alignLeft') },
    },
    {
      kind: 'textAlign',
      align: 'center',
      icon: 'i-lucide-align-center',
      'aria-label': t('jsonformsBuilder.wysiwyg.alignCenter'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.alignCenter') },
    },
    {
      kind: 'textAlign',
      align: 'right',
      icon: 'i-lucide-align-right',
      'aria-label': t('jsonformsBuilder.wysiwyg.alignRight'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.alignRight') },
    },
    {
      kind: 'textAlign',
      align: 'justify',
      icon: 'i-lucide-align-justify',
      'aria-label': t('jsonformsBuilder.wysiwyg.alignJustify'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.alignJustify') },
    },
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      'aria-label': t('jsonformsBuilder.wysiwyg.bulletList'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.bulletList') },
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      'aria-label': t('jsonformsBuilder.wysiwyg.orderedList'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.orderedList') },
    },
    {
      kind: 'taskList',
      icon: 'i-lucide-list-checks',
      'aria-label': t('jsonformsBuilder.wysiwyg.taskList'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.taskList') },
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-lucide-quote',
      'aria-label': t('jsonformsBuilder.wysiwyg.blockquote'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.blockquote') },
    },
    {
      kind: 'codeBlock',
      icon: 'i-lucide-square-code',
      'aria-label': t('jsonformsBuilder.wysiwyg.codeBlock'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.codeBlock') },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-minus',
      'aria-label': t('jsonformsBuilder.wysiwyg.horizontalRule'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.horizontalRule') },
    },
  ],
  [
    {
      kind: 'link',
      icon: 'i-lucide-link',
      'aria-label': t('jsonformsBuilder.wysiwyg.link'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.link') },
    },
    {
      kind: 'imageUpload',
      icon: 'i-lucide-image',
      'aria-label': t('jsonformsBuilder.wysiwyg.image'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.insertImage') },
    },
  ],
  [
    {
      kind: 'clearFormatting',
      icon: 'i-lucide-remove-formatting',
      'aria-label': t('jsonformsBuilder.wysiwyg.clearFormatting'),
      tooltip: { text: t('jsonformsBuilder.wysiwyg.clearFormatting') },
    },
  ],
]

/** `buildDefaultWysiwygToolbar()` with the French labels. */
export const DEFAULT_TOOLBAR = buildDefaultWysiwygToolbar()
