import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { defineClientComponent } from 'vitepress'
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue'
import './custom.css'

const PlaygroundEmbed = defineClientComponent(() => import('./PlaygroundEmbed.vue'))

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundEmbed', PlaygroundEmbed)
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons)
  },
} satisfies Theme
