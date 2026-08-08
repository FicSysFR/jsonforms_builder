// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
import { registerExamples } from '../register'

export const schema = undefined

export const uischema = undefined

export const data = {
  "name": "John Doe",
  "vegetarian": false,
  "birthDate": "1985-06-02",
  "personalData": {
    "age": 34
  },
  "postalCode": "12345"
}

registerExamples([
  {
    name: 'vuetify-no-schemas',
    label: 'No Schemas (Vuetify)',
    data,
    schema,
    uischema,
  },
])
