import { registerExamples } from '../register'

export const schema = {
  "type": "object",
  "properties": {
    "exampleRadioEnum": {
      "type": "string",
      "enum": ["Red", "Green", "Blue", "Yellow", "Purple", "Orange", "Black", "White"],
    }
  }
}

export const uischema = {
  "type": "Control",
  "scope": "#/properties/exampleRadioEnum",
  "options": {
    "format": "radio",
    // Démonstration de `uiProps` : tout ce qui est sous la clé du composant est
    // transmis tel quel au `URadioGroup`.
    "radioGroup": {
      "color": "primary",
      "variant": "table",
      "size": "md"
    }
  }
}

export const data = {
  exampleRadioEnum: 'Green',
}

registerExamples([
  {
    name: 'Radio',
    label: 'Radio Example',
    data,
    schema,
    uischema,
  },
])
