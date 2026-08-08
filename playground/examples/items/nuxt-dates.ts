import { registerExamples } from '../register'

/**
 * Example dedicated to date / time popovers (icon → UCard).
 * Complements the « Dates » example (patterns) and « Nuxt UI — Calendar » (expanded calendar).
 */
export const data = {
  meetingDay: '2026-08-08',
  meetingTime: '14:30',
  meetingSlot: '2026-08-08T14:30:00',
  reportMonth: '2026.07',
  fiscalYear: '2026',
}

export const schema = {
  type: 'object',
  properties: {
    meetingDay: {
      type: 'string',
      title: 'Jour de réunion',
      description: 'Clic sur l’icône calendrier → UCalendar dans une UCard.',
      format: 'date',
    },
    meetingTime: {
      type: 'string',
      title: 'Heure de début',
      description: 'Clic sur l’horloge → spinners H / M (pattern sans secondes).',
    },
    meetingSlot: {
      type: 'string',
      title: 'Créneau complet',
      description: 'Date-time : calendrier et heure dans le même popover.',
      format: 'date-time',
    },
    reportMonth: {
      type: 'string',
      title: 'Mois du rapport',
      description: 'YYYY.MM — popover en mode mois, jour masqué dans le champ.',
    },
    fiscalYear: {
      type: 'string',
      title: 'Exercice fiscal',
      description: 'YYYY — popover en mode année.',
    },
    emptyOptional: {
      type: 'string',
      title: 'Date libre',
      description: 'Champ optionnel vide — sélection puis effacement possible.',
      format: 'date',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Group',
      label: 'Popover calendrier / heure',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/meetingDay',
              options: { showUnfocusedDescription: true },
            },
            {
              type: 'Control',
              scope: '#/properties/meetingTime',
              options: {
                format: 'time',
                pattern: 'HH:mm',
                showUnfocusedDescription: true,
              },
            },
          ],
        },
        {
          type: 'Control',
          scope: '#/properties/meetingSlot',
          options: {
            pattern: 'YYYY-MM-DDTHH:mm:ss',
            showUnfocusedDescription: true,
          },
        },
      ],
    },
    {
      type: 'Group',
      label: 'Précision réduite (mois / année)',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/reportMonth',
              options: {
                format: 'date',
                pattern: 'YYYY.MM',
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/fiscalYear',
              options: {
                format: 'date',
                pattern: 'YYYY',
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/emptyOptional',
              options: { showUnfocusedDescription: true },
            },
          ],
        },
      ],
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-dates',
    label: 'Nuxt UI — Date & Time',
    data,
    schema,
    uischema,
  },
])
