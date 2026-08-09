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
}

export const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      title: 'Corps (ProseMirror JSON)',
      description:
        'options.wysiwyg + contentType: "json" — nécessite allRenderers (UEditor).',
    },
    notesHtml: {
      type: 'string',
      title: 'Notes (HTML)',
      description: 'contentType: "html" stocke une chaîne HTML.',
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
