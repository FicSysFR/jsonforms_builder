import { registerExamples } from '../register'

export const data = {
  volume: 40,
  temperature: 21.5,
  opacity: 75,
  priority: 3,
}

export const schema = {
  type: 'object',
  properties: {
    volume: {
      type: 'integer',
      title: 'Volume',
      description: 'options.slider: true — pas schema.multipleOf (5).',
      minimum: 0,
      maximum: 100,
      multipleOf: 5,
    },
    temperature: {
      type: 'number',
      title: 'Température (°C)',
      description: 'Pas décimal via options.step (prioritaire sur multipleOf).',
      minimum: 15,
      maximum: 30,
    },
    opacity: {
      type: 'integer',
      title: 'Opacité',
      description: 'Pass-through Nuxt UI : options.slider = { size, color }.',
      minimum: 0,
      maximum: 100,
    },
    priority: {
      type: 'integer',
      title: 'Priorité',
      description: 'options.hideValue: true — badge numérique masqué (tooltip seul).',
      minimum: 1,
      maximum: 5,
    },
  },
  required: ['volume'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/volume',
      options: {
        slider: true,
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/temperature',
      options: {
        slider: true,
        step: 0.5,
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/opacity',
      options: {
        slider: { size: 'lg', color: 'primary' },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/priority',
      options: {
        slider: { color: 'warning' },
        hideValue: true,
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-slider',
    label: 'Nuxt UI — Slider',
    data,
    schema,
    uischema,
  },
])
