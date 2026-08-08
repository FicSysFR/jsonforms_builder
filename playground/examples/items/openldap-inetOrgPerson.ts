import { registerExamples } from '../register'

/**
 * inetOrgPerson (RFC 2798 / inetorgperson.schema) — the structural objectClass
 * most used to represent a person in OpenLDAP.
 * Inherits from organizationalPerson → person (MUST: cn, sn).
 */
export const schema = {
  type: 'object',
  title: 'inetOrgPerson',
  properties: {
    dn: {
      type: 'string',
      title: 'DN',
      description: 'Distinguished Name (ex. uid=jdoe,ou=people,dc=example,dc=com)',
      pattern: '^.+=.+(,.+=.+)*$',
    },
    objectClass: {
      type: 'array',
      title: 'objectClass',
      items: { type: 'string' },
      default: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
      minItems: 1,
      uniqueItems: true,
    },
    cn: {
      type: 'array',
      title: 'cn (commonName)',
      description: 'MUST — person',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    sn: {
      type: 'array',
      title: 'sn (surname)',
      description: 'MUST — person',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    givenName: {
      type: 'array',
      title: 'givenName',
      items: { type: 'string' },
    },
    displayName: {
      type: 'string',
      title: 'displayName',
    },
    uid: {
      type: 'array',
      title: 'uid',
      items: { type: 'string', pattern: '^[a-zA-Z0-9._-]+$' },
    },
    mail: {
      type: 'array',
      title: 'mail',
      items: { type: 'string', format: 'email' },
    },
    telephoneNumber: {
      type: 'array',
      title: 'telephoneNumber',
      items: { type: 'string' },
    },
    mobile: {
      type: 'array',
      title: 'mobile',
      items: { type: 'string' },
    },
    facsimileTelephoneNumber: {
      type: 'array',
      title: 'facsimileTelephoneNumber',
      items: { type: 'string' },
    },
    title: {
      type: 'array',
      title: 'title',
      items: { type: 'string' },
    },
    ou: {
      type: 'array',
      title: 'ou (organizationalUnit)',
      items: { type: 'string' },
    },
    o: {
      type: 'array',
      title: 'o (organization)',
      items: { type: 'string' },
    },
    departmentNumber: {
      type: 'array',
      title: 'departmentNumber',
      items: { type: 'string' },
    },
    employeeNumber: {
      type: 'string',
      title: 'employeeNumber',
    },
    employeeType: {
      type: 'array',
      title: 'employeeType',
      items: {
        type: 'string',
        enum: ['Employee', 'Contractor', 'Intern', 'Temp', 'External'],
      },
    },
    roomNumber: {
      type: 'array',
      title: 'roomNumber',
      items: { type: 'string' },
    },
    labeledURI: {
      type: 'array',
      title: 'labeledURI',
      items: { type: 'string', format: 'uri' },
    },
    street: {
      type: 'array',
      title: 'street',
      items: { type: 'string' },
    },
    l: {
      type: 'array',
      title: 'l (locality)',
      items: { type: 'string' },
    },
    st: {
      type: 'array',
      title: 'st (stateOrProvince)',
      items: { type: 'string' },
    },
    postalCode: {
      type: 'array',
      title: 'postalCode',
      items: { type: 'string' },
    },
    postalAddress: {
      type: 'array',
      title: 'postalAddress',
      items: { type: 'string' },
    },
    preferredLanguage: {
      type: 'string',
      title: 'preferredLanguage',
      enum: ['fr', 'en', 'de', 'es', 'it'],
    },
    description: {
      type: 'array',
      title: 'description',
      items: { type: 'string' },
    },
    userPassword: {
      type: 'string',
      format: 'password',
      title: 'userPassword',
      description: 'Souvent stocké sous forme {SSHA}… — saisie claire pour le formulaire',
      minLength: 8,
    },
  },
  required: ['dn', 'cn', 'sn'],
}

export const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Identité',
      elements: [
        { type: 'Control', scope: '#/properties/dn' },
        { type: 'Control', scope: '#/properties/objectClass' },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/cn' },
            { type: 'Control', scope: '#/properties/sn' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/givenName' },
            { type: 'Control', scope: '#/properties/displayName' },
          ],
        },
        { type: 'Control', scope: '#/properties/uid' },
        { type: 'Control', scope: '#/properties/description' },
      ],
    },
    {
      type: 'Category',
      label: 'Coordonnées',
      elements: [
        { type: 'Control', scope: '#/properties/mail' },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/telephoneNumber' },
            { type: 'Control', scope: '#/properties/mobile' },
            { type: 'Control', scope: '#/properties/facsimileTelephoneNumber' },
          ],
        },
        { type: 'Control', scope: '#/properties/labeledURI' },
        { type: 'Control', scope: '#/properties/preferredLanguage' },
      ],
    },
    {
      type: 'Category',
      label: 'Organisation',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/title' },
            { type: 'Control', scope: '#/properties/ou' },
            { type: 'Control', scope: '#/properties/o' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/departmentNumber' },
            { type: 'Control', scope: '#/properties/employeeNumber' },
            { type: 'Control', scope: '#/properties/employeeType' },
          ],
        },
        { type: 'Control', scope: '#/properties/roomNumber' },
      ],
    },
    {
      type: 'Category',
      label: 'Adresse',
      elements: [
        { type: 'Control', scope: '#/properties/street' },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/l' },
            { type: 'Control', scope: '#/properties/st' },
            { type: 'Control', scope: '#/properties/postalCode' },
          ],
        },
        { type: 'Control', scope: '#/properties/postalAddress' },
      ],
    },
    {
      type: 'Category',
      label: 'Sécurité',
      elements: [{ type: 'Control', scope: '#/properties/userPassword' }],
    },
  ],
}

const data = {
  dn: 'uid=jdoe,ou=people,dc=example,dc=com',
  objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
  cn: ['Jane Doe', 'J. Doe'],
  sn: ['Doe'],
  givenName: ['Jane'],
  displayName: 'Jane Doe',
  uid: ['jdoe'],
  mail: ['jane.doe@example.com', 'j.doe@example.com'],
  telephoneNumber: ['+33 1 23 45 67 89'],
  mobile: ['+33 6 12 34 56 78'],
  title: ['Ingénieure système'],
  ou: ['IT', 'Infrastructure'],
  o: ['Example Corp'],
  departmentNumber: ['IT-OPS'],
  employeeNumber: 'E-1042',
  employeeType: ['Employee'],
  roomNumber: ['B.204'],
  preferredLanguage: 'fr',
  l: ['Paris'],
  st: ['Île-de-France'],
  postalCode: ['75001'],
}

registerExamples([
  {
    name: 'openldap-inetOrgPerson',
    label: 'OpenLDAP — inetOrgPerson',
    data,
    schema,
    uischema,
  },
])
