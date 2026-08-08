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
    "addressOrUser": {
      "oneOf": [
        {
          "$ref": "#/definitions/address"
        },
        {
          "$ref": "#/definitions/user"
        }
      ]
    }
  }
}

export const uischema = {
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "label": "Basic Information",
      "scope": "#/properties/addressOrUser",
      "options": {
        "variant": "tab"
      }
    }
  ]
}

export const data = {}

registerExamples([
  {
    name: 'vuetify-oneOf-tab',
    label: 'OneOf Tab (Vuetify)',
    data,
    schema,
    uischema,
  },
])
