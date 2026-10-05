import type {
  WysiwygAiRequest,
  WysiwygAiStreamChunk,
  WysiwygAiTransport,
} from '../../../src/advanced/wysiwyg/ai/types'
import { registerExamples } from '../register'

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    })
  })

/** Local stand-in for an AI SDK backend: deterministic, no network. */
const fakeAnswer = (request: WysiwygAiRequest): string => {
  const text = request.selectedText ?? ''
  switch (request.action) {
    case 'shorter':
    case 'summarize':
      return text
        .split(/\s+/)
        .slice(0, Math.max(3, Math.ceil(text.split(/\s+/).length / 2)))
        .join(' ')
    case 'longer':
      return `${text} Cette version développée précise le contexte et les prochaines étapes.`
    case 'professional':
      return `Nous vous informons que ${text.charAt(0).toLowerCase()}${text.slice(1)}`
    case 'continue':
      return ' La suite de la rédaction reprend le fil du paragraphe précédent.'
    case 'paragraph':
      return `Paragraphe généré à propos de « ${request.instruction?.split('\n\n').at(-1) ?? 'ce sujet'} ».`
    default:
      return text ? text.charAt(0).toUpperCase() + text.slice(1).replace(/\s+/g, ' ').trim() : '…'
  }
}

const demoTransport: WysiwygAiTransport = {
  async generate(request, options) {
    await wait(400, options?.signal)
    return { text: fakeAnswer(request) }
  },
  async *stream(request, options): AsyncGenerator<WysiwygAiStreamChunk> {
    for (const word of fakeAnswer(request).split(/(?<=\s)/)) {
      await wait(60, options?.signal)
      yield word
    }
  },
}

export const data = {
  notes:
    '<h2>Compte-rendu</h2><p>la réunion a permis de faire le point sur le chantier et les livraisons prévues la semaine prochaine.</p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Valider le planning</p></li></ul>',
}

export const schema = {
  type: 'object',
  properties: {
    notes: {
      type: 'string',
      title: 'Notes (HTML) avec assistant IA',
      description:
        'Sélectionnez du texte puis « IA », ou tapez / . Transport de démonstration local (aucun appel réseau).',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/notes',
      options: {
        wysiwyg: true,
        contentType: 'html',
        bubbleMenu: true,
        slashCommands: true,
        showUnfocusedDescription: true,
        ai: {
          enabled: true,
          transport: demoTransport,
        },
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-wysiwyg-ai',
    label: 'Nuxt UI — WYSIWYG + IA',
    data,
    schema,
    uischema,
  },
])
