import { registerExamples } from '../register'

export const data = {
  age: 32,
  price: 19.9,
  volume: 40,
}

export const schema = {
  type: 'object',
  properties: {
    age: {
      type: 'integer',
      title: 'Âge',
      description: 'UInputNumber — bornes schema.minimum / maximum, pas options.step.',
      minimum: 0,
      maximum: 120,
    },
    price: {
      type: 'number',
      title: 'Prix (€)',
      description: 'Pas décimal 0.01 via options.step.',
      minimum: 0,
    },
    volume: {
      type: 'number',
      title: 'Volume',
      description: 'options.slider: true → USlider piloté par minimum / maximum / multipleOf.',
      minimum: 0,
      maximum: 100,
      multipleOf: 5,
    },
  },
  required: ['age'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/age',
      options: {
        step: 1,
        inputNumber: { size: 'md' },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/price',
      options: {
        step: 0.01,
        placeholder: '0.00',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/volume',
      options: {
        slider: { size: 'lg', color: 'primary' },
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-number',
    label: 'Nuxt UI — Number & Slider',
    data,
    schema,
    uischema,
  },
])
