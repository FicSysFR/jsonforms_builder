import { registerExamples } from '../register'

export const data = {
  page: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Compte-rendu de chantier' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Survolez un bloc : ' },
          { type: 'text', marks: [{ type: 'bold' }], text: '+' },
          { type: 'text', text: ' ajoute un bloc en dessous, la poignée ' },
          { type: 'text', marks: [{ type: 'bold' }], text: '⋮⋮' },
          { type: 'text', text: ' le déplace ou ouvre son menu. Tapez « / » sur une ligne vide.' },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Actions' }],
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Vérifier les accès' }] },
            ],
          },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Commander le matériel' }] },
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Sélectionnez du texte pour la bulle de mise en forme.' },
            ],
          },
        ],
      },
      { type: 'paragraph' },
    ],
  },
}

export const schema = {
  type: 'object',
  properties: {
    page: {
      type: 'object',
      title: 'Page',
      description: 'options.blockEditor: true — édition par blocs, sans barre d’outils fixe.',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/page',
      options: {
        wysiwyg: true,
        contentType: 'json',
        blockEditor: true,
        placeholder: 'Commencez à écrire…',
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-wysiwyg-blocks',
    label: 'Nuxt UI — WYSIWYG par blocs',
    data,
    schema,
    uischema,
  },
])
