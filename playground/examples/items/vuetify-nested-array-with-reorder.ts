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
          name: { type: 'string' },
          phones: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$',
            },
          },
        },
        required: ['name'],
      },
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
        showSortButtons: true,
      },
    },
  ],
}

export const data = {
  exampleArray: [
    {
      phones: ['555-1212', '(888)555-1212'],
      name: 'John Smith',
    },
  ],
}

registerExamples([
  {
    name: 'vuetify-nested-array-with-reorder',
    label: 'Nested Array With Reorder (Vuetify)',
    data,
    schema,
    uischema,
  },
])
