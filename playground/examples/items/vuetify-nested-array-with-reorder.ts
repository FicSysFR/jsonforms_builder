// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
import { registerExamples } from '../register'

export const schema = {
  "type": "object",
  "properties": {
    "exampleArray": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "phones": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$"
            }
          }
        },
        "required":[
          "name"
        ]
      }
    }
  }
}

export const uischema = {
  "type": "HorizontalLayout",
  "elements": [
    {
      "type": "Control",
      "label": {
        "text": "Example Array",
        "show": true
      },
      "scope": "#/properties/exampleArray",
      "options": {
        "showSortButtons": true
      }
    }
  ]
}

export const data = {
  "exampleArray": [
    {
      "phones": ["555-1212", "(888)555-1212"],
      "name": "John Smith"
    }
  ]
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
