import { registerExamples } from '../register'

/**
 * Journal de chantier — exemple de référence pour les renderers ajoutés en v2
 * (Group, Array, OneOf, WYSIWYG), calqué sur le besoin de QualiRail#72 :
 * « contenu adaptable à l'activité ».
 *
 * L'idée : un tronc commun (date, météo, zone) plus une section `activity` en `oneOf`
 * dont les champs changent selon la nature du travail réalisé.
 */
export const schema = {
  type: 'object',
  properties: {
    date: {
      type: 'string',
      format: 'date',
      description: "Date du journal",
    },
    weather: {
      type: 'string',
      enum: ['Ensoleillé', 'Nuageux', 'Pluie', 'Neige', 'Brouillard'],
    },
    zone: {
      type: 'string',
      description: 'Zone géographique du chantier',
    },
    staff: {
      type: 'array',
      description: 'Effectif présent par entreprise',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string', title: 'Entreprise' },
          count: { type: 'integer', title: 'Effectif', minimum: 0 },
        },
        required: ['company'],
      },
    },
    activity: {
      title: "Activité du jour",
      oneOf: [
        {
          title: 'Pose de voie',
          type: 'object',
          required: ['kind', 'metersLaid'],
          properties: {
            kind: { const: 'track', title: 'Nature' },
            metersLaid: { type: 'integer', title: 'Mètres posés', minimum: 0 },
            ballastTonnage: { type: 'number', title: 'Tonnage ballast' },
          },
        },
        {
          title: 'Caténaire',
          type: 'object',
          required: ['kind', 'polesInstalled'],
          properties: {
            kind: { const: 'catenary', title: 'Nature' },
            polesInstalled: { type: 'integer', title: 'Poteaux posés', minimum: 0 },
            tensionChecked: { type: 'boolean', title: 'Tension contrôlée' },
          },
        },
        {
          title: 'Signalisation',
          type: 'object',
          required: ['kind', 'signalsTested'],
          properties: {
            kind: { const: 'signalling', title: 'Nature' },
            signalsTested: { type: 'integer', title: 'Signaux testés', minimum: 0 },
          },
        },
      ],
    },
    observations: {
      type: 'string',
      description: 'Compte rendu détaillé de la journée',
    },
  },
  required: ['date', 'weather'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Journal de chantier' },
    {
      type: 'Group',
      label: 'Conditions',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/date' },
            { type: 'Control', scope: '#/properties/weather' },
            { type: 'Control', scope: '#/properties/zone' },
          ],
        },
      ],
    },
    {
      type: 'Control',
      scope: '#/properties/staff',
      options: { elementLabelProp: 'company' },
    },
    { type: 'Control', scope: '#/properties/activity' },
    {
      type: 'Control',
      scope: '#/properties/observations',
      options: { wysiwyg: true, placeholder: 'Décrivez la journée…' },
    },
  ],
}

const data = {
  date: '2026-08-07',
  weather: 'Nuageux',
  zone: 'PK 12+400 → PK 13+100',
  staff: [
    { company: 'AMOT Ferroviaire', count: 6 },
    { company: 'Sous-traitant TP', count: 3 },
  ],
  activity: {
    kind: 'track',
    metersLaid: 240,
    ballastTonnage: 18.5,
  },
  observations: '<p>Pose nominale. <strong>Aucun incident</strong> à signaler.</p>',
}

registerExamples([
  {
    name: 'worksite-journal',
    label: 'Journal de chantier (Group / Array / OneOf / WYSIWYG)',
    data,
    schema,
    uischema,
  },
])
