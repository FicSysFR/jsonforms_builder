import { registerExamples } from '../register'

/**
 * `avatar` is pre-filled: that is the only way to exercise the renderer's return path —
 * rebuild a displayable `File` (name included) from the stored data URL alone,
 * as when reloading a draft.
 */
export const data = {
  avatar:
    'data:image/png;name=pixel.png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
}

export const schema = {
  type: 'object',
  properties: {
    avatar: {
      type: 'string',
      title: 'Photo de profil',
      description: 'format: "data-url" — un seul fichier, restreint aux images.',
      format: 'data-url',
      contentMediaType: 'image/*',
    },
    contract: {
      type: 'string',
      title: 'Contrat signé',
      description: 'PDF uniquement, filtre imposé par options.accept.',
      format: 'data-url',
    },
    attachments: {
      type: 'array',
      title: 'Pièces jointes',
      description: 'Schéma array : dépôt multiple, chaque entrée est une URL de données.',
      items: {
        type: 'string',
        contentMediaType: '*',
      },
    },
  },
  required: ['avatar'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/avatar',
      options: {
        dropLabel: 'Déposez une image',
        layout: 'grid',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/contract',
      options: {
        accept: 'application/pdf',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/attachments',
      options: {
        format: 'file',
        dropLabel: 'Déposez vos documents',
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-file-upload',
    label: 'Nuxt UI — File Upload',
    data,
    schema,
    uischema,
  },
])
