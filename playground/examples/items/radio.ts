import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    exampleRadioEnum: {
      type: 'string',
      description: 'Choisissez une couleur',
      enum: ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Black', 'White'],
    },
    exampleRadioInline: {
      type: 'string',
      description: 'Même contrôle en disposition horizontale',
      enum: ['Low', 'Medium', 'High'],
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/exampleRadioEnum',
      options: {
        format: 'radio',
        // Variante `list` : pastilles radio classiques (indicateur circulaire).
        radioGroup: {
          color: 'primary',
          variant: 'list',
          size: 'md',
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/exampleRadioInline',
      options: {
        format: 'radio',
        vertical: false,
        radioGroup: {
          color: 'primary',
          variant: 'list',
          size: 'md',
        },
      },
    },
  ],
}

export const data = {
  exampleRadioEnum: 'Green',
  exampleRadioInline: 'Medium',
}

registerExamples([
  {
    name: 'Radio',
    label: 'Radio Example',
    data,
    schema,
    uischema,
  },
])
