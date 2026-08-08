import { registerExamples } from '../register'

export const personCoreSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your name',
      i18n: 'name',
    },
    vegetarian: {
      type: 'boolean',
    },
    phone: {
      type: 'string',
      minLength: 10,
      pattern: '^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$',
    },
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.',
    },
    nationality: {
      type: 'string',
      enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
    },
  },
}

export const schema = {
  type: 'object',
  properties: {
    ...personCoreSchema.properties,
    personalData: {
      type: 'object',
      properties: {
        age: {
          type: 'integer',
          description: 'Please enter your age.',
        },
        height: {
          type: 'number',
        },
        drivingSkill: {
          type: 'number',
          maximum: 10,
          minimum: 1,
          default: 7,
        },
      },
      required: ['age', 'height'],
    },
    vegetarian: {
      type: 'boolean',
    },
    birthDate: {
      type: 'string',
      format: 'date',
    },
    occupation: {
      type: 'string',
    },
    postalCode: {
      type: 'string',
      maxLength: 5,
    },
  },
  required: ['occupation', 'nationality'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/name',
        },
        {
          type: 'Control',
          scope: '#/properties/personalData/properties/age',
        },
        {
          type: 'Control',
          scope: '#/properties/birthDate',
        },
        {
          type: 'Control',
          scope: '#/properties/vegetarian',
        },
        {
          type: 'Control',
          scope: '#/properties/phone',
        },
      ],
    },
    {
      type: 'Label',
      text: 'Additional Information',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/personalData/properties/height',
        },
        {
          type: 'Control',
          scope: '#/properties/nationality',
        },
        {
          type: 'Control',
          scope: '#/properties/occupation',
          options: {
            suggestion: [
              'Accountant',
              'Engineer',
              'Freelancer',
              'Journalism',
              'Physician',
              'Student',
              'Teacher',
              'Other',
            ],
          },
        },
      ],
    },
  ],
}

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
    name: 'person',
    label: 'Person',
    data,
    schema,
    uischema,
  },
])
