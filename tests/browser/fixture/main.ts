import './main.css'
import type { ValidationMode } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/vue'
import { nuxtUiRenderers, strictCspRenderers } from '@ficsysfr/jsonforms_builder'
import UApp from '@nuxt/ui/components/App.vue'
import ui from '@nuxt/ui/vue-plugin'
import { createApp, defineComponent, h, markRaw, shallowRef } from 'vue'
import { data as initialData, schema, uischema } from './cases'

declare global {
  interface Window {
    __recipe: { ready: boolean; data: unknown; changes: number }
  }
}

const params = new URLSearchParams(location.search)
const validationMode = (params.get('validation') ?? 'NoValidation') as ValidationMode
// `form`: `<json-forms readonly>`; `config`: `config.readonly`, read by each control.
const readonlySource = params.get('readonly')
const registry = params.get('registry') === 'full' ? nuxtUiRenderers : strictCspRenderers

window.__recipe = { ready: false, data: structuredClone(initialData), changes: 0 }

const Recipe = defineComponent({
  setup() {
    const data = shallowRef<unknown>(structuredClone(initialData))
    const renderers = markRaw([...registry])

    return () =>
      h(UApp, null, {
        default: () =>
          h('main', { id: 'form', class: 'mx-auto max-w-3xl p-6' }, [
            h(JsonForms, {
              schema,
              uischema,
              data: data.value,
              renderers,
              validationMode,
              readonly: readonlySource === 'form',
              config: readonlySource === 'config' ? { readonly: true } : {},
              onChange: (event: { data: unknown }) => {
                data.value = event.data
                window.__recipe.data = event.data
                window.__recipe.changes += 1
              },
            }),
          ]),
      })
  },
})

createApp(Recipe).use(ui).mount('#app')
requestAnimationFrame(() => {
  window.__recipe.ready = true
})
