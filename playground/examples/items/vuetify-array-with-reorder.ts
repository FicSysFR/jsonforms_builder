// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
          },
          message: {
            type: 'string',
            maxLength: 5,
          },
          enum: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      },
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/comments',
      options: {
        showSortButtons: true,
      },
    },
  ],
}

export const data = {
  comments: [
    {
      date: '2001-09-11',
      message: 'This is an example message',
      enum: 'foo',
    },
    {
      date: '2021-08-13',
      message: 'Get ready for booohay',
      enum: 'bar',
    },
  ],
}

registerExamples([
  {
    name: 'vuetify-array-with-reorder',
    label: 'Array With Reorder (Vuetify)',
    data,
    schema,
    uischema,
  },
])
