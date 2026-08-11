import DefaultTheme from 'vitepress/theme'
import { defineClientComponent } from 'vitepress'
import './custom.css'

const PlaygroundEmbed = defineClientComponent(() => import('./PlaygroundEmbed.vue'))

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundEmbed', PlaygroundEmbed)
  },
}
