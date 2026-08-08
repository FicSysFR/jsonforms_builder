// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = undefined

export const uischema = undefined

export const data = {
  name: 'John Doe',
  vegetarian: false,
  birthDate: '1985-06-02',
  personalData: {
    age: 34,
  },
  postalCode: '12345',
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
