// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    oneOfMultiEnum: {
      type: 'array',
      uniqueItems: true,
      items: {
        oneOf: [
          {
            const: 'foo',
            title: 'My Foo',
          },
          {
            const: 'bar',
            title: 'My Bar',
          },
          {
            const: 'foobar',
            title: 'My FooBar',
          },
        ],
      },
    },
    multiEnum: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['foo', 'bar', 'foobar'],
      },
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/oneOfMultiEnum',
      options: {
        vuetify: {
          'v-checkbox': {
            foo: {
              color: 'green',
            },
          },
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/multiEnum',
      options: {
        vuetify: {
          'v-checkbox': {
            foobar: {
              color: 'yellow',
            },
          },
        },
      },
    },
  ],
}

export const data = {
  oneOfMultiEnum: ['foo'],
  multiEnum: ['bar'],
}

registerExamples([
  {
    name: 'vuetify-multi-enum',
    label: 'Multi Enum (Vuetify)',
    data,
    schema,
    uischema,
  },
])
