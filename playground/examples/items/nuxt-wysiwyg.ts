import { registerExamples } from '../register'

export const data = {
  body: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Compte-rendu de la réunion du matin.' }],
      },
    ],
  },
  notesHtml: '<p>Notes HTML libres…</p>',
  article: [
    '## Procédure',
    '',
    '1. Ouvrir le portail',
    '2. Cliquer sur **Nouvelle demande**',
    '',
    '> Astuce : joignez une capture.',
  ].join('\n'),
}

export const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      title: 'Corps (ProseMirror JSON)',
      description: 'options.wysiwyg + contentType: "json" — nécessite allRenderers (UEditor).',
    },
    notesHtml: {
      type: 'string',
      title: 'Notes (HTML)',
      description: 'contentType: "html" stocke une chaîne HTML.',
    },
    article: {
      type: 'string',
      title: 'Article (Markdown)',
      description: 'contentType: "markdown" stocke une chaîne Markdown.',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/body',
      options: {
        wysiwyg: true,
        contentType: 'json',
        placeholder: 'Rédigez le contenu…',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/notesHtml',
      options: {
        wysiwyg: true,
        contentType: 'html',
        placeholder: 'Saisie HTML…',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/article',
      options: {
        wysiwyg: true,
        contentType: 'markdown',
        density: 'prose',
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-wysiwyg',
    label: 'Nuxt UI — WYSIWYG',
    data,
    schema,
    uischema,
  },
])
