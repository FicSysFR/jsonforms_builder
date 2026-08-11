import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { playgroundResolveDedupe, playgroundUiPlugins } from '../../playground/vite.shared'

const repo = 'https://github.com/tacxou/jsonforms_builder'
/** GitHub Pages path in production; `/` for local `docs:dev`. */
const base = process.env.NODE_ENV === 'production' ? '/jsonforms_builder/' : '/'
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const playgroundRoot = path.resolve(repoRoot, 'playground')

export default defineConfig({
  title: 'JSONForms Builder',
  description:
    'JSONForms renderers for Vue 3 on Nuxt UI & Tailwind CSS, plus a visual form builder.',
  base,
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }]],

  /**
   * Playground is compiled into the docs bundle (same Nuxt UI / Pug stack as
   * `playground/vite.config.ts`) so GitHub Pages serves one site — no iframe
   * to a separate `/play/` SPA.
   */
  vite: {
    plugins: playgroundUiPlugins({ express: true }),
    optimizeDeps: {
      exclude: ['@nuxt/ui', '@nuxt/icon'],
      // Ensure the playground entry is pre-bundled with the docs server.
      include: ['vue-router', '@vueuse/core'],
    },
    resolve: {
      alias: {
        // Avoid `#…` (Node package imports). Stable path into the playground app.
        '@playground': playgroundRoot,
      },
      dedupe: [...playgroundResolveDedupe],
    },
    server: {
      fs: {
        allow: [repoRoot, playgroundRoot],
      },
    },
  },

  /**
   * French is the root locale (URLs unchanged), English lives under `/en/`.
   * Each locale carries its own nav / sidebar / UI labels.
   */
  locales: {
    root: {
      label: 'Français',
      lang: 'fr-FR',
      description:
        'Renderers JSONForms pour Vue 3 sur Nuxt UI & Tailwind CSS, plus un builder visuel.',
      themeConfig: {
        outline: { level: [2, 3], label: 'Sur cette page' },
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
        langMenuLabel: 'Changer de langue',

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
              { text: 'Exemples playground', link: '/guide/playground-examples' },
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
              { text: 'Exemples Nuxt UI', link: '/guide/playground-examples' },
            ],
          },
        ],

        footer: {
          message: 'Publié sous licence BSD-3-Clause.',
          copyright: 'Copyright © tacxou et contributeurs',
        },
      },
    },

    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description:
        'JSONForms renderers for Vue 3 on Nuxt UI & Tailwind CSS, plus a visual form builder.',
      themeConfig: {
        outline: { level: [2, 3], label: 'On this page' },
        editLink: {
          pattern: `${repo}/edit/main/docs/:path`,
          text: 'Edit this page',
        },
        lastUpdated: { text: 'Updated' },

        nav: [
          { text: 'Guide', link: '/en/guide/installation' },
          { text: 'Renderers', link: '/en/guide/renderers' },
          {
            text: 'Options',
            link: '/en/guide/options/',
            activeMatch: '/en/guide/options',
          },
          { text: 'Builder', link: '/en/guide/builder' },
          { text: 'Playground', link: '/en/playground' },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/@tacxou/jsonforms_builder',
          },
        ],

        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Installation', link: '/en/guide/installation' },
              { text: 'Usage', link: '/en/guide/usage' },
              { text: 'Renderers', link: '/en/guide/renderers' },
              { text: 'Customization', link: '/en/guide/customization' },
              { text: 'Integration', link: '/en/guide/integration' },
              { text: 'Visual builder', link: '/en/guide/builder' },
              { text: 'Playground examples', link: '/en/guide/playground-examples' },
            ],
          },
          {
            text: 'Options API',
            collapsed: false,
            items: [
              { text: 'Overview', link: '/en/guide/options/' },
              { text: 'Common', link: '/en/guide/options/common' },
              { text: 'Text & media', link: '/en/guide/options/string' },
              { text: 'Numbers', link: '/en/guide/options/number' },
              { text: 'Boolean', link: '/en/guide/options/boolean' },
              { text: 'Enums', link: '/en/guide/options/enum' },
              { text: 'Dates', link: '/en/guide/options/date' },
              { text: 'Arrays & objects', link: '/en/guide/options/array' },
              { text: 'Layouts', link: '/en/guide/options/layouts' },
              { text: 'Pass-through', link: '/en/guide/options/pass-through' },
            ],
          },
          {
            text: 'Playground',
            items: [
              { text: 'Interactive gallery', link: '/en/playground' },
              { text: 'Nuxt UI examples', link: '/en/guide/playground-examples' },
            ],
          },
        ],

        footer: {
          message: 'Released under the BSD-3-Clause License.',
          copyright: 'Copyright © tacxou and contributors',
        },
      },
    },
  },

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'JSONForms Builder' },
    siteTitle: 'JSONForms Builder',
    socialLinks: [{ icon: 'github', link: repo }],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Rechercher',
                buttonAriaLabel: 'Rechercher',
              },
              modal: {
                displayDetails: 'Afficher le détail',
                resetButtonTitle: 'Réinitialiser',
                backButtonTitle: 'Retour',
                noResultsText: 'Aucun résultat pour',
                footer: {
                  selectText: 'sélectionner',
                  navigateText: 'naviguer',
                  closeText: 'fermer',
                },
              },
            },
          },
        },
      },
    },
  },
})
