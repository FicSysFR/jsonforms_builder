import './main.css'
import type { ValidationMode } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/vue'
import {
  createJsonFormsTranslator,
  nuxtUiRenderers,
  strictCspRenderers,
} from '@ficsysfr/jsonforms_builder/core'
import UApp from '@nuxt/ui/components/App.vue'
import ui from '@nuxt/ui/vue-plugin'
import { createApp, defineComponent, h, markRaw, shallowRef } from 'vue'
import { buildUischema, data as initialData, schema } from './cases'

declare global {
  interface Window {
    __recipe: { ready: boolean; data: unknown; changes: number }
  }
}

/**
 * Query parameters:
 * - `validation`: JSON Forms validation mode (default `NoValidation`);
 * - `registry=full`: `nuxtUiRenderers` instead of `strictCspRenderers`;
 * - `readonly=form|config`: `<json-forms readonly>` or `config.readonly`;
 * - `rule=schema`: schema-based SHOW condition instead of a LEAF one;
 * - `serverErrors`: a host error on `text` (filtered before touch locally), cleared by the
 *   host once `text` changes, as a server round trip would;
 * - `locale=en`: interface texts through `createJsonFormsTranslator({ locale: 'en' })`.
 */
const params = new URLSearchParams(location.search)
const validationMode = (params.get('validation') ?? 'NoValidation') as ValidationMode
const readonlySource = params.get('readonly')
const registry = params.get('registry') === 'full' ? nuxtUiRenderers : strictCspRenderers
const uischema = buildUischema({ schemaRule: params.get('rule') === 'schema' })
const withServerErrors = params.has('serverErrors')
const locale = params.get('locale')
const i18n = locale ? { locale, translate: createJsonFormsTranslator({ locale }) } : undefined

const SERVER_ERROR = {
  instancePath: '/text',
  schemaPath: '',
  keyword: 'server',
  params: {},
  message: 'Already used on the server',
}

window.__recipe = { ready: false, data: structuredClone(initialData), changes: 0 }

const Recipe = defineComponent({
  setup() {
    const data = shallowRef<Record<string, unknown>>(structuredClone(initialData))
    const additionalErrors = shallowRef(withServerErrors ? [SERVER_ERROR] : [])
    const renderers = markRaw([...registry])
    const config = {
      // The autocomplete queries `/api/cities` on this origin: the host allows it explicitly.
      apiPolicy: { allowedOrigins: ['self'] },
      ...(readonlySource === 'config' ? { readonly: true } : {}),
      ...(withServerErrors ? { enableFilterErrorsBeforeTouch: true } : {}),
    }

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
              config,
              additionalErrors: additionalErrors.value,
              i18n,
              onChange: (event: { data: Record<string, unknown> }) => {
                if (event.data.text !== data.value.text) additionalErrors.value = []
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
