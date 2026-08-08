import { registerExamples } from '../register'

/**
 * posixAccount + shadowAccount (nis.schema / RFC 2307) — comptes Unix/Linux
 * dans OpenLDAP. Souvent combiné avec inetOrgPerson sur la même entrée.
 */
export const schema = {
  type: 'object',
  title: 'posixAccount / shadowAccount',
  properties: {
    dn: {
      type: 'string',
      title: 'DN',
      pattern: '^.+=.+(,.+=.+)*$',
    },
    objectClass: {
      type: 'array',
      title: 'objectClass',
      items: { type: 'string' },
      default: ['top', 'account', 'posixAccount', 'shadowAccount'],
      minItems: 1,
      uniqueItems: true,
    },
    cn: {
      type: 'string',
      title: 'cn',
      description: 'MUST — posixAccount',
      minLength: 1,
    },
    uid: {
      type: 'string',
      title: 'uid (login)',
      description: 'MUST — posixAccount',
      pattern: '^[a-z_][a-z0-9_-]*$',
      minLength: 1,
      maxLength: 32,
    },
    uidNumber: {
      type: 'integer',
      title: 'uidNumber',
      description: 'MUST — identifiant numérique utilisateur',
      minimum: 1000,
    },
    gidNumber: {
      type: 'integer',
      title: 'gidNumber',
      description: 'MUST — groupe principal',
      minimum: 1000,
    },
    homeDirectory: {
      type: 'string',
      title: 'homeDirectory',
      description: 'MUST',
      pattern: '^/.*',
    },
    loginShell: {
      type: 'string',
      title: 'loginShell',
      enum: ['/bin/bash', '/bin/sh', '/bin/zsh', '/usr/bin/fish', '/sbin/nologin', '/bin/false'],
      default: '/bin/bash',
    },
    gecos: {
      type: 'string',
      title: 'gecos',
      description: 'Nom complet / commentaire passwd',
    },
    userPassword: {
      type: 'string',
      format: 'password',
      title: 'userPassword',
      minLength: 8,
    },
    description: {
      type: 'string',
      title: 'description',
    },
    shadowLastChange: {
      type: 'integer',
      title: 'shadowLastChange',
      description: 'Jours depuis 1970-01-01 du dernier changement de mot de passe',
      minimum: 0,
    },
    shadowMin: {
      type: 'integer',
      title: 'shadowMin',
      description: 'Jours minimum entre deux changements',
      minimum: 0,
      default: 0,
    },
    shadowMax: {
      type: 'integer',
      title: 'shadowMax',
      description: 'Jours maximum de validité du mot de passe',
      minimum: 0,
      default: 99999,
    },
    shadowWarning: {
      type: 'integer',
      title: 'shadowWarning',
      description: 'Jours d’avertissement avant expiration',
      minimum: 0,
      default: 7,
    },
    shadowInactive: {
      type: 'integer',
      title: 'shadowInactive',
      description: 'Jours d’inactivité autorisés après expiration (−1 = désactivé)',
      minimum: -1,
      default: -1,
    },
    shadowExpire: {
      type: 'integer',
      title: 'shadowExpire',
      description: 'Date d’expiration du compte (jours depuis epoch, −1 = jamais)',
      minimum: -1,
      default: -1,
    },
  },
  required: ['dn', 'cn', 'uid', 'uidNumber', 'gidNumber', 'homeDirectory'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Compte POSIX (nis.schema)' },
    { type: 'Control', scope: '#/properties/dn' },
    { type: 'Control', scope: '#/properties/objectClass' },
    {
      type: 'Group',
      label: 'posixAccount',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/uid' },
            { type: 'Control', scope: '#/properties/cn' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/uidNumber' },
            { type: 'Control', scope: '#/properties/gidNumber' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/homeDirectory' },
            { type: 'Control', scope: '#/properties/loginShell' },
          ],
        },
        { type: 'Control', scope: '#/properties/gecos' },
        { type: 'Control', scope: '#/properties/userPassword' },
        { type: 'Control', scope: '#/properties/description' },
      ],
    },
    {
      type: 'Group',
      label: 'shadowAccount',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/shadowLastChange' },
            { type: 'Control', scope: '#/properties/shadowMin' },
            { type: 'Control', scope: '#/properties/shadowMax' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/shadowWarning' },
            { type: 'Control', scope: '#/properties/shadowInactive' },
            { type: 'Control', scope: '#/properties/shadowExpire' },
          ],
        },
      ],
    },
  ],
}

const data = {
  dn: 'uid=jdoe,ou=people,dc=example,dc=com',
  objectClass: ['top', 'account', 'posixAccount', 'shadowAccount'],
  cn: 'Jane Doe',
  uid: 'jdoe',
  uidNumber: 10042,
  gidNumber: 10000,
  homeDirectory: '/home/jdoe',
  loginShell: '/bin/bash',
  gecos: 'Jane Doe,IT,B.204',
  shadowLastChange: 19800,
  shadowMin: 0,
  shadowMax: 365,
  shadowWarning: 14,
  shadowInactive: -1,
  shadowExpire: -1,
}

registerExamples([
  {
    name: 'openldap-posixAccount',
    label: 'OpenLDAP — posixAccount / shadowAccount',
    data,
    schema,
    uischema,
  },
])
