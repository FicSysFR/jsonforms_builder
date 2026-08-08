import { registerExamples } from '../register'

export const data = {
  keywords: ['vue', 'jsonforms'],
}

export const schema = {
  type: 'object',
  properties: {
    keywords: {
      type: 'array',
      title: 'Mots-clés',
      description: 'Entrée ou virgule pour valider. uniqueItems interdit les doublons.',
      uniqueItems: true,
      maxItems: 6,
      items: {
        type: 'string',
        maxLength: 20,
      },
    },
    recipients: {
      type: 'array',
      title: 'Destinataires',
      description: 'Séparateur point-virgule, doublons autorisés.',
      items: { type: 'string' },
    },
  },
  required: ['keywords'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/keywords',
      options: {
        format: 'tags',
        placeholder: 'Ajouter un mot-clé…',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/recipients',
      options: {
        format: 'tags',
        delimiter: ';',
        placeholder: 'nom@exemple.fr ;',
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-tags',
    label: 'Nuxt UI — Tags',
    data,
    schema,
    uischema,
  },
])
