import { registerExamples } from '../register'

/**
 * sudoRole (sudo.schema / sudo-ldap) — rôle sudo stocké dans OpenLDAP.
 * Très courant pour centraliser les droits d’élévation.
 */
export const schema = {
  type: 'object',
  title: 'sudoRole',
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
      default: ['top', 'sudoRole'],
      minItems: 1,
      uniqueItems: true,
    },
    cn: {
      type: 'string',
      title: 'cn',
      description: 'Nom du rôle (souvent aussi le RDN)',
      minLength: 1,
    },
    description: {
      type: 'string',
      title: 'description',
    },
    sudoUser: {
      type: 'array',
      title: 'sudoUser',
      description: 'Utilisateurs ou %groupes autorisés (ALL, !user, %groupe…)',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    sudoHost: {
      type: 'array',
      title: 'sudoHost',
      description: 'Hôtes concernés (ALL, FQDN, réseau…)',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
      default: ['ALL'],
    },
    sudoCommand: {
      type: 'array',
      title: 'sudoCommand',
      description: 'Commandes autorisées (ALL, chemins absolus, !interdiction)',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    sudoRunAsUser: {
      type: 'array',
      title: 'sudoRunAsUser',
      description: 'Utilisateur cible (ALL, root…)',
      items: { type: 'string' },
      default: ['ALL'],
    },
    sudoRunAsGroup: {
      type: 'array',
      title: 'sudoRunAsGroup',
      items: { type: 'string' },
    },
    sudoOption: {
      type: 'array',
      title: 'sudoOption',
      description: 'Options sudo (ex. !authenticate, env_keep+=…)',
      items: { type: 'string' },
    },
    sudoNotBefore: {
      type: 'string',
      title: 'sudoNotBefore',
      description: 'Début de validité (AAAAMMJJhhmmssZ)',
      pattern: '^[0-9]{14}Z$',
    },
    sudoNotAfter: {
      type: 'string',
      title: 'sudoNotAfter',
      description: 'Fin de validité (AAAAMMJJhhmmssZ)',
      pattern: '^[0-9]{14}Z$',
    },
    sudoOrder: {
      type: 'integer',
      title: 'sudoOrder',
      description: 'Priorité d’évaluation (plus petit = plus tôt)',
      minimum: 0,
      default: 0,
    },
  },
  required: ['dn', 'cn', 'sudoUser', 'sudoHost', 'sudoCommand'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Rôle sudo (sudo.schema)' },
    {
      type: 'Group',
      label: 'Entrée',
      elements: [
        { type: 'Control', scope: '#/properties/dn' },
        { type: 'Control', scope: '#/properties/objectClass' },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/cn' },
            { type: 'Control', scope: '#/properties/sudoOrder' },
          ],
        },
        { type: 'Control', scope: '#/properties/description' },
      ],
    },
    {
      type: 'Group',
      label: 'Qui / où / quoi',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/sudoUser',
          options: { suggestion: ['ALL', '%admins', '%developers', 'jdoe'] },
        },
        {
          type: 'Control',
          scope: '#/properties/sudoHost',
          options: { suggestion: ['ALL', 'web01.example.com', 'db*.example.com'] },
        },
        {
          type: 'Control',
          scope: '#/properties/sudoCommand',
          options: {
            suggestion: [
              'ALL',
              '/usr/bin/systemctl',
              '/usr/bin/apt',
              '/bin/systemctl restart nginx',
              '!/bin/su',
            ],
          },
        },
      ],
    },
    {
      type: 'Group',
      label: 'RunAs & options',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/sudoRunAsUser',
              options: { suggestion: ['ALL', 'root', 'www-data', 'postgres'] },
            },
            {
              type: 'Control',
              scope: '#/properties/sudoRunAsGroup',
              options: { suggestion: ['ALL', 'root', 'adm'] },
            },
          ],
        },
        {
          type: 'Control',
          scope: '#/properties/sudoOption',
          options: {
            suggestion: ['!authenticate', 'authenticate', 'NOPASSWD', 'env_keep+=PATH'],
          },
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/sudoNotBefore' },
            { type: 'Control', scope: '#/properties/sudoNotAfter' },
          ],
        },
      ],
    },
  ],
}

const data = {
  dn: 'cn=deploy,ou=sudoers,dc=example,dc=com',
  objectClass: ['top', 'sudoRole'],
  cn: 'deploy',
  description: 'Déploiement applicatif sans mot de passe',
  sudoUser: ['%developers', 'jdoe'],
  sudoHost: ['web01.example.com', 'web02.example.com'],
  sudoCommand: [
    '/usr/bin/systemctl restart nginx',
    '/usr/bin/systemctl status nginx',
    '/usr/local/bin/deploy-app',
  ],
  sudoRunAsUser: ['root'],
  sudoOption: ['!authenticate'],
  sudoOrder: 10,
}

registerExamples([
  {
    name: 'openldap-sudoRole',
    label: 'OpenLDAP — sudoRole',
    data,
    schema,
    uischema,
  },
])
