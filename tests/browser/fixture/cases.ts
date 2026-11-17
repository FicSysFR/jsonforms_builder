import type { JsonSchema, UISchemaElement } from '@jsonforms/core'

/**
 * One form that reaches every renderer of `nuxtUiRenderers` (WYSIWYG excluded: it lives in
 * `advancedRenderers`). Field names say which renderer they target.
 */
export const schema: JsonSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', minLength: 3 },
    multiline: { type: 'string' },
    password: { type: 'string', format: 'password' },
    pin: { type: 'string', maxLength: 4 },
    color: { type: 'string', format: 'color' },
    fixed: { type: 'string', const: 'fixed value' },
    integer: { type: 'integer' },
    slider: { type: 'number', minimum: 0, maximum: 10 },
    rating: { type: 'integer', maximum: 5 },
    checkbox: { type: 'boolean' },
    toggle: { type: 'boolean' },
    enum: { type: 'string', enum: ['alpha', 'beta', 'gamma'] },
    oneOfConstants: {
      oneOf: [
        { const: 'draft', title: 'Draft' },
        { const: 'published', title: 'Published' },
      ],
    },
    select: { type: 'string', enum: ['north', 'south'] },
    radio: { type: 'string', enum: ['yes', 'no'] },
    multiEnum: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', enum: ['red', 'green', 'blue'] },
    },
    tags: { type: 'array', items: { type: 'string' } },
    date: { type: 'string', format: 'date' },
    dateTime: { type: 'string', format: 'date-time' },
    time: { type: 'string', format: 'time' },
    calendar: { type: 'string', format: 'date' },
    file: { type: 'string', format: 'data-url' },
    address: {
      type: 'object',
      properties: { street: { type: 'string' }, city: { type: 'string' } },
    },
    contacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, email: { type: 'string' } },
      },
    },
    variant: {
      oneOf: [
        { title: 'Person', type: 'object', properties: { first: { type: 'string' } } },
        { title: 'Company', type: 'object', properties: { siren: { type: 'string' } } },
      ],
    },
    merged: {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'string' } } },
      ],
    },
    items: {
      type: 'array',
      items: { type: 'object', properties: { label: { type: 'string' } } },
    },
  },
}

const control = (name: string, options?: Record<string, unknown>) => ({
  type: 'Control',
  scope: `#/properties/${name}`,
  ...(options ? { options } : {}),
})

export const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Simple',
      elements: [
        {
          type: 'Group',
          label: 'Text',
          elements: [
            control('text'),
            control('multiline', { multi: true }),
            control('password'),
            control('pin', { format: 'pin' }),
            control('color'),
            control('fixed'),
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            control('integer'),
            control('slider', { slider: true }),
            control('rating', { format: 'rating' }),
          ],
        },
        control('checkbox'),
        control('toggle', { toggle: true }),
        control('enum'),
        control('oneOfConstants'),
        control('select', { format: 'select' }),
        control('radio', { format: 'radio' }),
        control('multiEnum'),
        control('tags', { format: 'tags' }),
      ],
    },
    {
      type: 'Category',
      label: 'Dates',
      elements: [
        control('date'),
        control('dateTime'),
        control('time'),
        control('calendar', { format: 'calendar' }),
        control('file'),
      ],
    },
    {
      type: 'Category',
      label: 'Structures',
      elements: [
        control('address'),
        control('contacts'),
        control('variant'),
        control('merged'),
        { type: 'ListWithDetail', scope: '#/properties/items' },
      ],
    },
  ],
} as unknown as UISchemaElement

export const data = {
  text: 'ab',
  multiline: 'line one',
  password: 'secret',
  pin: '12',
  color: '#3366ff',
  fixed: 'fixed value',
  integer: 3,
  slider: 4,
  rating: 2,
  checkbox: false,
  toggle: true,
  enum: 'beta',
  oneOfConstants: 'draft',
  select: 'north',
  radio: 'yes',
  multiEnum: ['red'],
  tags: ['one'],
  date: '2026-11-17',
  dateTime: '2026-11-17T10:30:00+05:30',
  time: '08:15:00',
  calendar: '2026-11-20',
  address: { street: '1 rue', city: 'Paris' },
  contacts: [{ name: 'Ada', email: 'ada@example.test' }],
  variant: { first: 'Ada' },
  merged: { a: 'a', b: 'b' },
  items: [{ label: 'first' }, { label: 'second' }],
}
