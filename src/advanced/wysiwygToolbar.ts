/**
 * Default toolbar for the WYSIWYG renderer.
 *
 * Each sub-array forms a group; `UEditorToolbar` inserts separators between them.
 * Override via `options.toolbar`, or set `options.toolbar: false` to hide.
 */
export const DEFAULT_TOOLBAR = [
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo-2',
      'aria-label': 'Annuler',
      tooltip: { text: 'Annuler' },
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo-2',
      'aria-label': 'Rétablir',
      tooltip: { text: 'Rétablir' },
    },
  ],
  [
    {
      kind: 'heading',
      level: 1,
      icon: 'i-lucide-heading-1',
      'aria-label': 'Titre 1',
      tooltip: { text: 'Titre 1' },
    },
    {
      kind: 'heading',
      level: 2,
      icon: 'i-lucide-heading-2',
      'aria-label': 'Titre 2',
      tooltip: { text: 'Titre 2' },
    },
    {
      kind: 'heading',
      level: 3,
      icon: 'i-lucide-heading-3',
      'aria-label': 'Titre 3',
      tooltip: { text: 'Titre 3' },
    },
    {
      kind: 'paragraph',
      icon: 'i-lucide-pilcrow',
      'aria-label': 'Paragraphe',
      tooltip: { text: 'Paragraphe' },
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      'aria-label': 'Gras',
      tooltip: { text: 'Gras' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      'aria-label': 'Italique',
      tooltip: { text: 'Italique' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      'aria-label': 'Souligné',
      tooltip: { text: 'Souligné' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      'aria-label': 'Barré',
      tooltip: { text: 'Barré' },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      'aria-label': 'Code',
      tooltip: { text: 'Code' },
    },
  ],
  [
    {
      kind: 'textAlign',
      align: 'left',
      icon: 'i-lucide-align-left',
      'aria-label': 'Aligner à gauche',
      tooltip: { text: 'Aligner à gauche' },
    },
    {
      kind: 'textAlign',
      align: 'center',
      icon: 'i-lucide-align-center',
      'aria-label': 'Centrer',
      tooltip: { text: 'Centrer' },
    },
    {
      kind: 'textAlign',
      align: 'right',
      icon: 'i-lucide-align-right',
      'aria-label': 'Aligner à droite',
      tooltip: { text: 'Aligner à droite' },
    },
    {
      kind: 'textAlign',
      align: 'justify',
      icon: 'i-lucide-align-justify',
      'aria-label': 'Justifier',
      tooltip: { text: 'Justifier' },
    },
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      'aria-label': 'Liste à puces',
      tooltip: { text: 'Liste à puces' },
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      'aria-label': 'Liste numérotée',
      tooltip: { text: 'Liste numérotée' },
    },
    {
      kind: 'taskList',
      icon: 'i-lucide-list-checks',
      'aria-label': 'Liste de tâches',
      tooltip: { text: 'Liste de tâches' },
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-lucide-quote',
      'aria-label': 'Citation',
      tooltip: { text: 'Citation' },
    },
    {
      kind: 'codeBlock',
      icon: 'i-lucide-square-code',
      'aria-label': 'Bloc de code',
      tooltip: { text: 'Bloc de code' },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-minus',
      'aria-label': 'Filet horizontal',
      tooltip: { text: 'Filet horizontal' },
    },
  ],
  [
    {
      kind: 'link',
      icon: 'i-lucide-link',
      'aria-label': 'Lien',
      tooltip: { text: 'Lien' },
    },
    {
      kind: 'imageUpload',
      icon: 'i-lucide-image',
      'aria-label': 'Image',
      tooltip: { text: 'Insérer une image' },
    },
  ],
  [
    {
      kind: 'clearFormatting',
      icon: 'i-lucide-remove-formatting',
      'aria-label': 'Effacer la mise en forme',
      tooltip: { text: 'Effacer la mise en forme' },
    },
  ],
]
