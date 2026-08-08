// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
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
      minItems: 1,
      maxItems: 5,
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
        restrict: true,
      },
    },
  ],
}

export const data = {
  comments: [
    {
      date: '2001-09-11',
      message: 'This is an example message',
    },
    {
      date: '2021-08-13',
      message: 'Get ready for booohay',
    },
  ],
}

registerExamples([
  {
    name: 'vuetify-array-restrict',
    label: 'Array Restrict (Vuetify)',
    data,
    schema,
    uischema,
  },
])
