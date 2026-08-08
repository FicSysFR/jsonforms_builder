import { registerExamples } from '../register'

/**
 * Vitrine des renderers ajoutés en v2 par-dessus le socle historique.
 *
 * Un seul formulaire plutôt qu'une page par composant : c'est là que les écarts de
 * hauteur, d'alignement et de largeur entre contrôles voisins se voient — un composant
 * isolé sur sa page paraît toujours correct.
 */
export const data = {
  displayName: 'Camille Dupont',
  tier: 'pro',
  brandColor: '#00DC82',
  skills: ['vue', 'typescript'],
  satisfaction: 4,
  startDate: '2026-09-01',
}

export const schema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: 'Nom affiché',
    },
    tier: {
      type: 'string',
      title: 'Formule',
      enum: ['free', 'pro', 'enterprise'],
    },
    verificationCode: {
      type: 'string',
      title: 'Code de vérification',
      pattern: '^\\d{6}$',
    },
    brandColor: {
      type: 'string',
      title: 'Couleur de marque',
      format: 'color',
    },
    skills: {
      type: 'array',
      title: 'Compétences',
      uniqueItems: true,
      items: { type: 'string' },
    },
    satisfaction: {
      type: 'integer',
      title: 'Satisfaction',
      minimum: 1,
      maximum: 5,
    },
    startDate: {
      type: 'string',
      title: 'Date de début',
      format: 'date',
    },
    logo: {
      type: 'string',
      title: 'Logo',
      format: 'data-url',
      contentMediaType: 'image/*',
    },
  },
  required: ['displayName', 'tier'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Group',
      label: 'Identité',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/displayName' },
            {
              type: 'Control',
              scope: '#/properties/tier',
              options: { format: 'select' },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/verificationCode',
              options: { format: 'pin', otp: true },
            },
            {
              type: 'Control',
              scope: '#/properties/brandColor',
            },
          ],
        },
      ],
    },
    {
      type: 'Group',
      label: 'Profil',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/skills',
          options: { format: 'tags', placeholder: 'Ajouter une compétence…' },
        },
        {
          type: 'Control',
          scope: '#/properties/satisfaction',
          options: { format: 'rating' },
        },
      ],
    },
    {
      type: 'Group',
      label: 'Pièces & planning',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/startDate',
              options: { format: 'calendar' },
            },
            {
              type: 'Control',
              scope: '#/properties/logo',
              options: { dropLabel: 'Déposez le logo' },
            },
          ],
        },
      ],
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-ui-showcase',
    label: 'Nuxt UI — Vitrine des contrôles',
    data,
    schema,
    uischema,
  },
])
