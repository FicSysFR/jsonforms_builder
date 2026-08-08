import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    addressSearch: {
      type: 'string',
      description: "Recherche d'adresse via API (autocomplete)",
    },
    string: {
      type: 'string',
    },
    boolean: {
      type: 'boolean',
      description: 'Boolean description as a tooltip',
    },
    number: {
      type: 'number',
      description: 'Number description',
    },
    integer: {
      type: 'integer',
    },
    date: {
      type: 'string',
      format: 'date',
    },
    time: {
      type: 'string',
      format: 'time',
    },
    dateTime: {
      type: 'string',
      format: 'date-time',
    },
    enum: {
      type: 'string',
      enum: ['One', 'Two', 'Three'],
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/addressSearch',
      options: {
        placeholder: 'Rechercher une adresse…',
        minLength: 3,
        api: {
          base: 'https://data.geopf.fr',
          url: '/geocodage/search',
          queryKey: 'q',
          params: {
            autocomplete: 1,
            index: 'address',
            limit: 10,
            returntruegeometry: false,
          },
          itemsPath: 'features',
          labelKey: 'properties.label',
          valueKey: 'properties.id',
          headers: {
            accept: 'application/json',
          },
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/string',
    },
    {
      type: 'Control',
      scope: '#/properties/boolean',
    },
    {
      type: 'Control',
      scope: '#/properties/number',
    },
    {
      type: 'Control',
      scope: '#/properties/integer',
    },
    {
      type: 'Control',
      scope: '#/properties/date',
    },
    {
      type: 'Control',
      scope: '#/properties/time',
    },
    {
      type: 'Control',
      scope: '#/properties/dateTime',
    },
    {
      type: 'Control',
      scope: '#/properties/enum',
    },
  ],
}

export const data = {
  addressSearch: null,
  string: 'This is a string',
  boolean: true,
  number: 50.5,
  integer: 50,
  date: '2020-06-25',
  time: '23:08:00',
  dateTime: '2020-06-25T23:08:42+02:00',
  enum: 'Two',
}

export const extendedSchema = {
  type: 'object',
  properties: {
    multilineString: {
      type: 'string',
      description: 'Multiline Example',
    },
    objectDoc: {
      type: 'object',
      description: 'WYSIWYG Example',
    },
    slider: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      default: 2,
      description: 'Slider Example',
    },
    trimText: {
      type: 'string',
      description: 'Trim indicates whether the control shall grab the full width available',
    },
    restrictText: {
      type: 'string',
      maxLength: 5,
      description: 'Restricts the input length to the set value (in this case: 5)',
    },
    unfocusedDescription: {
      type: 'string',
      description: 'This description is shown even when the control is not focused',
    },
    hideRequiredAsterisk: {
      type: 'string',
      description: 'Hides the "*" symbol, when the field is required',
    },
    toggle: {
      type: 'boolean',
      description: 'The "toggle" option renders boolean values as a toggle.',
    },
  },
  required: ['hideRequiredAsterisk', 'restrictText'],
}

export const extendedUischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/objectDoc',
      options: {
        wysiwyg: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/multilineString',
      options: {
        multi: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/slider',
      options: {
        slider: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/trimText',
      options: {
        trim: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/restrictText',
      options: {
        restrict: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/unfocusedDescription',
      options: {
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/hideRequiredAsterisk',
      options: {
        hideRequiredAsterisk: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/toggle',
      label: 'Boolean as Toggle',
      options: {
        toggle: true,
      },
    },
  ],
}

export const extendedData = {
  multilineString: 'Multi-\nline\nexample',
  objectDoc: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [
              {
                type: 'underline',
              },
            ],
            text: 'Multi',
          },
          {
            type: 'text',
            text: '-',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'italic',
              },
            ],
            text: 'line',
          },
          {
            type: 'text',
            text: ' ',
          },
          {
            type: 'text',
            marks: [
              {
                type: 'bold',
              },
            ],
            text: 'example',
          },
        ],
      },
      {
        type: 'paragraph',
      },
      {
        type: 'heading',
        attrs: {
          level: 3,
        },
        content: [
          {
            type: 'text',
            marks: [
              {
                type: 'textStyle',
                attrs: {
                  fontFamily: 'BBH Sans Bogle',
                  fontSize: null,
                  color: null,
                  backgroundColor: null,
                },
              },
            ],
            text: 'test',
          },
        ],
      },
      {
        type: 'paragraph',
      },
    ],
  },
  slider: 4,
  trimText: 'abcdefg',
  restrictText: 'abcde',
  toggle: false,
}

const combinedSchema = {
  ...extendedSchema,
  properties: {
    ...schema.properties,
    ...extendedSchema.properties,
  },
}

const combinedUiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Normal controls',
      elements: [uischema],
    },
    {
      type: 'Category',
      label: 'Configured controls',
      elements: [extendedUischema],
    },
  ],
}

const combinedData = {
  ...data,
  ...extendedData,
}

registerExamples([
  {
    name: 'control-options',
    label: 'Control Options',
    data: combinedData,
    schema: combinedSchema,
    uischema: combinedUiSchema,
  },
])
