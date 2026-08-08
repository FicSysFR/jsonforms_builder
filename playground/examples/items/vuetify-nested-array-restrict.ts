// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    exampleArray: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          choices: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      minItems: 1,
      maxItems: 5,
    },
  },
}

export const uischema = {
  type: 'HorizontalLayout',
  elements: [
    {
      type: 'Control',
      label: {
        text: 'Example Array',
        show: true,
      },
      scope: '#/properties/exampleArray',
      options: {
        restrict: true,
      },
    },
  ],
}

export const data = {
  exampleArray: [
    {
      choices: ['This', 'is', 'an', 'example'],
      name: 'Hi there',
    },
  ],
}

registerExamples([
  {
    name: 'vuetify-nested-array-restrict',
    label: 'Nested Array Restrict (Vuetify)',
    data,
    schema,
    uischema,
  },
])
