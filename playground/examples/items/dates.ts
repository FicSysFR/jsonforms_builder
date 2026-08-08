import { registerExamples } from '../register'

const today = new Date().toISOString().slice(0, 10)
const nowIso = new Date().toISOString()

export const schema = {
  type: 'object',
  properties: {
    // —— Formats JSON Schema de base ——
    date: {
      type: 'string',
      title: 'Date',
      description: 'format: "date" — champ segmenté + calendrier en card via l’icône.',
      format: 'date',
    },
    time: {
      type: 'string',
      title: 'Heure',
      description: 'format: "time" — spinners H/M(/S) via l’icône horloge.',
      format: 'time',
    },
    datetime: {
      type: 'string',
      title: 'Date et heure',
      description: 'format: "date-time" — calendrier + heure côte à côte dans le popover.',
      format: 'date-time',
    },

    // —— Motifs / granularité ——
    yearMonth: {
      type: 'string',
      title: 'Année · mois',
      description: 'pattern YYYY.MM — pas de sélection de jour (calendrier type month).',
    },
    yearOnly: {
      type: 'string',
      title: 'Année seule',
      description: 'pattern YYYY — calendrier type year, segment année uniquement.',
    },
    timeMinutes: {
      type: 'string',
      title: 'Heure (minutes)',
      description: 'pattern HH:mm — sans secondes dans le champ ni le popup.',
    },
    timeSeconds: {
      type: 'string',
      title: 'Heure (secondes)',
      description: 'pattern HH:mm:ss — spinners H / M / S.',
      format: 'time',
    },
    datetimeMinutes: {
      type: 'string',
      title: 'Date-heure (minutes)',
      description: 'pattern YYYY-MM-DDTHH:mm — sans secondes.',
    },
    datetimeSeconds: {
      type: 'string',
      title: 'Date-heure (secondes + Z)',
      description: 'pattern ISO avec millisecondes et Z littéral.',
    },

    // —— États ——
    requiredDate: {
      type: 'string',
      title: 'Date obligatoire',
      description: 'Champ requis, vide au départ.',
      format: 'date',
    },
    readonlyDate: {
      type: 'string',
      title: 'Date en lecture seule',
      description: 'options.readonly — icône décorative, pas de popover.',
      format: 'date',
    },
    disabledTime: {
      type: 'string',
      title: 'Heure désactivée',
      description: 'options.readonly sur un format time.',
      format: 'time',
    },
  },
  required: ['requiredDate'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Group',
      label: 'Formats standards',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/date',
              options: { showUnfocusedDescription: true },
            },
            {
              type: 'Control',
              scope: '#/properties/time',
              options: { showUnfocusedDescription: true },
            },
            {
              type: 'Control',
              scope: '#/properties/datetime',
              options: { showUnfocusedDescription: true },
            },
          ],
        },
      ],
    },
    {
      type: 'Group',
      label: 'Motifs (pattern) — granularité calendrier / heure',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/yearMonth',
              options: {
                format: 'date',
                pattern: 'YYYY.MM',
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/yearOnly',
              options: {
                format: 'date',
                pattern: 'YYYY',
                showUnfocusedDescription: true,
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/timeMinutes',
              options: {
                format: 'time',
                pattern: 'HH:mm',
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/timeSeconds',
              options: {
                pattern: 'HH:mm:ss',
                showUnfocusedDescription: true,
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/datetimeMinutes',
              options: {
                format: 'date-time',
                pattern: 'YYYY-MM-DDTHH:mm',
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/datetimeSeconds',
              options: {
                format: 'date-time',
                pattern: 'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
                showUnfocusedDescription: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Group',
      label: 'États',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/requiredDate',
              options: { showUnfocusedDescription: true },
            },
            {
              type: 'Control',
              scope: '#/properties/readonlyDate',
              options: {
                readonly: true,
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/disabledTime',
              options: {
                readonly: true,
                showUnfocusedDescription: true,
              },
            },
          ],
        },
      ],
    },
  ],
}

export const data = {
  date: today,
  time: '13:37:00',
  datetime: nowIso.slice(0, 19),
  yearMonth: '2024.03',
  yearOnly: '2024',
  timeMinutes: '09:30',
  timeSeconds: '14:05:42',
  datetimeMinutes: '1999-12-11T10:05',
  datetimeSeconds: nowIso,
  requiredDate: undefined,
  readonlyDate: today,
  disabledTime: '08:00:00',
}

registerExamples([
  {
    name: 'dates',
    label: 'Dates',
    data,
    schema,
    uischema,
  },
])
