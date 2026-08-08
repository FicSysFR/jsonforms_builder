// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    address: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nestedObject: {
            type: 'object',
            properties: {
              loc: {
                type: 'string',
              },
              toll: {
                type: ['string', 'null'],
              },
              message: {
                type: ['string', 'null'],
              },
            },
            required: ['loc'],
          },
          loc: {
            type: 'string',
          },
          toll: {
            type: ['string', 'null'],
          },
          message: {
            type: ['string', 'null'],
          },
        },
        required: ['loc'],
      },
    },
    user: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        mail: {
          type: 'string',
        },
        additional_details: {
          type: 'object',
          properties: {
            interests: {
              type: 'string',
            },
            optional_details: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                },
                related_activities: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    excemption: {
                      type: 'object',
                      properties: {
                        cause: {
                          type: 'string',
                        },
                        further_information: {
                          type: 'object',
                          properties: {
                            info: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            private_mail: {
              type: 'string',
            },
          },
        },
      },
      required: ['name', 'mail'],
    },
  },
}

export const uischema = undefined

export const data = {}

registerExamples([
  {
    name: 'vuetify-object-nested',
    label: 'Object Nested (Vuetify)',
    data,
    schema,
    uischema,
  },
])
