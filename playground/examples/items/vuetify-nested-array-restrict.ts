// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
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
