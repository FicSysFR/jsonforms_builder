import { registerExamples } from '../register'

export const data = {
  overall: 4,
  precision: 3.5,
}

export const schema = {
  type: 'object',
  properties: {
    overall: {
      type: 'integer',
      title: 'Satisfaction générale',
      description: 'Le maximum du schéma fixe le nombre d’étoiles.',
      minimum: 1,
      maximum: 5,
    },
    precision: {
      type: 'number',
      title: 'Précision de la commande',
      description: 'multipleOf 0.5 : demi-étoiles.',
      minimum: 0,
      maximum: 5,
      multipleOf: 0.5,
    },
    difficulty: {
      type: 'integer',
      title: 'Difficulté perçue',
      description: 'Dix niveaux, icône personnalisée, note chiffrée masquée.',
      minimum: 1,
      maximum: 10,
    },
  },
  required: ['overall'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/overall',
      options: {
        format: 'rating',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/precision',
      options: {
        format: 'rating',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/difficulty',
      options: {
        format: 'rating',
        icon: 'i-lucide-flame',
        emptyIcon: 'i-lucide-flame',
        hideValue: true,
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-rating',
    label: 'Nuxt UI — Rating',
    data,
    schema,
    uischema,
  },
])
