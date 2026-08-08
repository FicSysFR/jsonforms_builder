// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
import { registerExamples } from '../register'

export const schema = {
  "type": "object",
  "properties": {
    "foo": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "enum": [
            "foo",
            "bar"
          ]
        }
      ]
    }
  }
}

export const uischema = undefined

export const data = {
  "foo": "foo"
}

registerExamples([
  {
    name: 'vuetify-anyOf-simple',
    label: 'AnyOf Simple (Vuetify)',
    data,
    schema,
    uischema,
  },
])
