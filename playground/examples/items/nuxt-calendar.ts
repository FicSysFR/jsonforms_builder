import { registerExamples } from '../register'

export const data = {
  arrival: '2026-08-12',
}

export const schema = {
  type: 'object',
  properties: {
    arrival: {
      type: 'string',
      title: 'Date d’arrivée',
      description: 'Calendrier déplié — même valeur stockée que le champ segmenté.',
      format: 'date',
    },
    departure: {
      type: 'string',
      title: 'Date de départ',
      description: 'Deux mois affichés côte à côte (options.months).',
      format: 'date',
    },
    reference: {
      type: 'string',
      title: 'Date de référence',
      description: 'Champ segmenté UInputDate — icône ouvre le calendrier en card.',
      format: 'date',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/arrival',
      options: {
        format: 'calendar',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/departure',
      options: {
        format: 'calendar',
        months: 2,
        weekNumbers: true,
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/reference',
      options: {
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-calendar',
    label: 'Nuxt UI — Calendar',
    data,
    schema,
    uischema,
  },
])
