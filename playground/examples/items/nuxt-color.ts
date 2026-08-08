import { registerExamples } from '../register'

export const data = {
  primary: '#00DC82',
}

export const schema = {
  type: 'object',
  properties: {
    primary: {
      type: 'string',
      title: 'Couleur principale',
      description: 'format: "color" — pipette en popover + saisie hexadécimale.',
      format: 'color',
      default: '#00DC82',
    },
    accent: {
      type: 'string',
      title: 'Couleur d’accentuation',
      description: 'Notation rgb() émise par la pipette (options.colorFormat).',
    },
    background: {
      type: 'string',
      title: 'Fond',
      description: 'Pipette seule, sans champ de saisie (options.showInput: false).',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/primary',
      options: {
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/accent',
      options: {
        format: 'color',
        colorFormat: 'rgb',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/background',
      options: {
        format: 'color',
        showInput: false,
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-color',
    label: 'Nuxt UI — Color Picker',
    data,
    schema,
    uischema,
  },
])
