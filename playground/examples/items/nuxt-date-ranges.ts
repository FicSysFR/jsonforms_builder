import { registerExamples } from '../register'

/**
 * Plages de dates + jours / mois / années désactivés.
 *
 * Options supportées sur les contrôles date / calendar :
 * - `minDate` / `maxDate` — bornes inclusives
 * - `disabledDates` — jours précis (`YYYY-MM-DD`)
 * - `disabledWeekdays` — `0`=dimanche … `6`=samedi
 * - `disabledMonths` — `1`–`12` (picker mois)
 * - `disabledYears` — années (picker année)
 * - `range: true` — objet `{ start, end }` + calendrier intervalle
 */
export const data = {
  stay: {
    start: '2026-08-10',
    end: '2026-08-17',
  },
  monthSpan: {
    start: '2026.03',
    end: '2026.06',
  },
  appointment: '2026-08-12',
  delivery: '2026-08-14',
  reportMonth: '2026.09',
  fiscalYear: '2027',
}

export const schema = {
  type: 'object',
  properties: {
    stay: {
      type: 'object',
      title: 'Séjour',
      description: 'Plage de jours (options.range) — week-ends et jours fériés exclus.',
      properties: {
        start: { type: 'string', format: 'date' },
        end: { type: 'string', format: 'date' },
      },
    },
    monthSpan: {
      type: 'object',
      title: 'Période (mois)',
      description: 'Plage de mois — janvier et août désactivés.',
      properties: {
        start: { type: 'string' },
        end: { type: 'string' },
      },
    },
    appointment: {
      type: 'string',
      title: 'Rendez-vous',
      description: 'Champ segmenté — bornes août 2026, samedi/dimanche désactivés.',
      format: 'date',
    },
    delivery: {
      type: 'string',
      title: 'Livraison',
      description: 'Calendrier déplié — 15 août bloqué + week-ends.',
      format: 'date',
    },
    reportMonth: {
      type: 'string',
      title: 'Mois du rapport',
      description: 'Picker mois — Q1 (jan–mar) désactivé, bornes 2026–2027.',
    },
    fiscalYear: {
      type: 'string',
      title: 'Exercice',
      description: 'Picker année — 2024 et 2025 fermés.',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Group',
      label: 'Plages (range)',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/stay',
          options: {
            format: 'calendar',
            range: true,
            months: 2,
            minDate: '2026-08-01',
            maxDate: '2026-09-30',
            disabledWeekdays: [0, 6],
            disabledDates: ['2026-08-15', '2026-08-16'],
            showUnfocusedDescription: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/monthSpan',
          options: {
            format: 'calendar',
            range: true,
            pattern: 'YYYY.MM',
            minDate: '2026-01',
            maxDate: '2026-12',
            disabledMonths: [1, 8],
            showUnfocusedDescription: true,
          },
        },
      ],
    },
    {
      type: 'Group',
      label: 'Jours désactivés',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/appointment',
              options: {
                minDate: '2026-08-01',
                maxDate: '2026-08-31',
                disabledWeekdays: [0, 6],
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/delivery',
              options: {
                format: 'calendar',
                minDate: '2026-08-01',
                maxDate: '2026-08-31',
                disabledWeekdays: [0, 6],
                disabledDates: ['2026-08-15'],
                showUnfocusedDescription: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Group',
      label: 'Mois / années désactivés',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/reportMonth',
              options: {
                format: 'calendar',
                pattern: 'YYYY.MM',
                minDate: '2026-01',
                maxDate: '2027-12',
                disabledMonths: [1, 2, 3],
                showUnfocusedDescription: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/fiscalYear',
              options: {
                format: 'calendar',
                pattern: 'YYYY',
                minDate: '2023',
                maxDate: '2030',
                disabledYears: [2024, 2025],
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
    name: 'nuxt-date-ranges',
    label: 'Nuxt UI — Date ranges & constraints',
    data,
    schema,
    uischema,
  },
])
