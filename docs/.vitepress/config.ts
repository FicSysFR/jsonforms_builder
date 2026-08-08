import { defineConfig } from 'vitepress'

const repo = 'https://github.com/tacxou/jsonforms_builder'
const base = '/jsonforms_builder/'

export default defineConfig({
  title: 'JSONForms Builder',
  description:
    'JSONForms renderers for Vue 3 on Nuxt UI & Tailwind CSS, plus a visual form builder.',
  base,
  lang: 'fr-FR',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }]],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'JSONForms Builder' },
    siteTitle: 'JSONForms Builder',
    outline: { level: [2, 3], label: 'Sur cette page' },
    socialLinks: [{ icon: 'github', link: repo }],
    search: { provider: 'local' },
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Modifier cette page',
    },
    lastUpdated: { text: 'Mis à jour' },
    docFooter: { prev: 'Précédent', next: 'Suivant' },
    returnToTopLabel: 'Retour en haut',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Thème',
    lightModeSwitchTitle: 'Passer en clair',
    darkModeSwitchTitle: 'Passer en sombre',

    nav: [
      { text: 'Guide', link: '/guide/installation' },
      { text: 'Renderers', link: '/guide/renderers' },
      {
        text: 'Options',
        link: '/guide/options/',
        activeMatch: '/guide/options',
      },
      { text: 'Builder', link: '/guide/builder' },
      { text: 'Playground', link: '/playground' },
      {
        text: 'npm',
        link: 'https://www.npmjs.com/package/@tacxou/jsonforms_builder',
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Utilisation', link: '/guide/usage' },
          { text: 'Renderers', link: '/guide/renderers' },
          { text: 'Personnalisation', link: '/guide/customization' },
          { text: 'Intégration', link: '/guide/integration' },
          { text: 'Builder visuel', link: '/guide/builder' },
        ],
      },
      {
        text: 'Options API',
        collapsed: false,
        items: [
          { text: 'Vue d’ensemble', link: '/guide/options/' },
          { text: 'Communes', link: '/guide/options/common' },
          { text: 'Texte & médias', link: '/guide/options/string' },
          { text: 'Nombres', link: '/guide/options/number' },
          { text: 'Booléen', link: '/guide/options/boolean' },
          { text: 'Enumérations', link: '/guide/options/enum' },
          { text: 'Dates', link: '/guide/options/date' },
          { text: 'Tableaux & objets', link: '/guide/options/array' },
          { text: 'Layouts', link: '/guide/options/layouts' },
          { text: 'Pass-through', link: '/guide/options/pass-through' },
        ],
      },
      {
        text: 'Playground',
        items: [
          { text: 'Galerie interactive', link: '/playground' },
          {
            text: 'Ouvrir en plein écran',
            link: '/play/index.html',
            target: '_blank',
          },
        ],
      },
    ],

    footer: {
      message: 'Publié sous licence BSD-3-Clause.',
      copyright: 'Copyright © tacxou et contributeurs',
    },
  },
})
