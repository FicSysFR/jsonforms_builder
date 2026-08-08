// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
import { registerExamples } from '../register'

export const schema = {
  "definitions": {
    "address": {
      "type": "object",
      "title": "Address",
      "properties": {
        "street_address": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "state": {
          "type": "string"
        }
      },
      "required": ["street_address", "city", "state"]
    },
    "user": {
      "type": "object",
      "title": "User",
      "properties": {
        "name": {
          "type": "string"
        },
        "mail": {
          "type": "string"
        }
      },
      "required": ["name", "mail"]
    }
  },
  "type": "object",
  "properties": {
    "label": {
      "type": "string"
    }
  },
  "anyOf": [
    {
      "$ref": "#/definitions/address"
    },
    {
      "$ref": "#/definitions/user"
    }
  ]
}

export const uischema = undefined

export const data = {
  "addressOrUser": {
    "street_address": "1600 Pennsylvania Avenue NW",
    "city": "Washington",
    "state": "DC"
  }
}

registerExamples([
  {
    name: 'vuetify-anyOf-with-props',
    label: 'AnyOf With Props (Vuetify)',
    data,
    schema,
    uischema,
  },
])
