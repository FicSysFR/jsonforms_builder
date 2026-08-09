import { registerExamples } from '../register'

export const data = {
  arrival: '2026-08-12',
  departure: '2026-08-20',
  reference: '2026-08-15',
  yearMonth: '2026.08',
  booking: '2026-09-01T14:30:00',
}

export const schema = {
  type: 'object',
  properties: {
    arrival: {
      type: 'string',
      title: 'Date d’arrivée',
      description:
        'Calendrier déplié (options.format: "calendar") — même stockage qu’un champ date.',
      format: 'date',
    },
    departure: {
      type: 'string',
      title: 'Date de départ',
      description: 'Deux mois côte à côte + numéros de semaine (options.months / weekNumbers).',
      format: 'date',
    },
    reference: {
      type: 'string',
      title: 'Date de référence',
      description: 'Champ segmenté — l’icône ouvre le calendrier dans une card.',
      format: 'date',
    },
    yearMonth: {
      type: 'string',
      title: 'Période (année · mois)',
      description: 'pattern YYYY.MM sur un calendrier déplié type month.',
    },
    booking: {
      type: 'string',
      title: 'Créneau réservé',
      description: 'date-time segmenté — popover calendrier + spinners d’heure.',
      format: 'date-time',
    },
    optionalDay: {
      type: 'string',
      title: 'Jour optionnel',
      description: 'Vide au départ — bouton Effacer sur le calendrier déplié.',
      format: 'date',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Group',
      label: 'Calendriers dépliés',
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
          scope: '#/properties/yearMonth',
          options: {
            format: 'calendar',
            pattern: 'YYYY.MM',
            showUnfocusedDescription: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/optionalDay',
          options: {
            format: 'calendar',
            showUnfocusedDescription: true,
          },
        },
      ],
    },
    {
      type: 'Group',
      label: 'Champs segmentés (popover)',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/reference',
              options: {
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/booking',
              options: {
                pattern: 'YYYY-MM-DDTHH:mm:ss',
                showUnfocusedDescription: true,
              },
            },
          ],
        },
      ],
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
