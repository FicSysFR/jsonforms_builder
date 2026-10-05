# WYSIWYG editor & AI assistant

The WYSIWYG renderer (`options.wysiwyg: true`) is still built on `UEditor` (Nuxt UI,
Tiptap 3). It adds rich editing features and an **optional** AI writing assistant designed
for an [AI SDK](https://ai-sdk.dev/) backend owned by the host application.

`{ wysiwyg: true }` keeps working unchanged: AI, the formatting bubble and the `/` menu are
off by default.

## Editing features

| Option | Type | Default | Description |
|---|---|---|---|
| `features` | `false` \| `WysiwygFeatures` | all on | Toggles each capability (Tiptap extension + toolbar entries). `false` removes them all. |
| `features.taskList` | `Boolean` | `true` | Task lists. |
| `features.textAlign` | `Boolean` | `true` | Heading and paragraph alignment. |
| `features.table` | `Boolean` | `true` | Tables, insertion and the contextual bubble (rows, columns, merge, headers). |
| `features.textColor` | `Boolean` | `true` | Text color. |
| `features.highlight` | `Boolean` | `true` | Multicolor highlight. |
| `features.linkEditor` | `Boolean` | `true` | Link panel (rejects `javascript:`, `data:`…) instead of the native `prompt()`. |
| `features.findReplace` | `Boolean` | `true` | Find & replace (optional case sensitivity). |
| `features.sourceMode` | `Boolean` | `true` | Raw HTML or JSON editing; applied content goes through the Tiptap schema. |
| `features.preview` | `Boolean` | `true` | Read-only preview. |
| `bubbleMenu` | `Boolean` | `false` | Formatting bubble on text selection. |
| `slashCommands` | `Boolean` | `false` | `/` command palette. |
| `ai` | `WysiwygAiOptions` | — | AI assistant (see below). |

A host extension passed through `options.extensions` (e.g. its own `Table`) wins over the
built-in extension of the same name. A custom `toolbar` is never altered; its items can use
the built-in `kind`s: `textColor`, `highlight`, `table`, `tableAction`, `findReplace`,
`sourceMode`, `preview`, `ai`.

## AI assistant

```ts
options: {
  wysiwyg: true,
  ai: {
    enabled: true,
    endpoint: '/api/ai/editor',
    actions: ['improve', 'fixGrammar', 'shorter', 'longer', 'summarize', 'translate'],
  },
}
```

No AI code runs unless `ai.enabled === true` and an `endpoint` / `transport` is provided.

### Flow

1. The user selects text and picks an action (bubble, toolbar or `/ai`).
2. The request goes to the application backend, which calls AI SDK.
3. The answer is **streamed into a detached panel**: the document is never modified while
   generating.
4. The user chooses: *Replace selection* / *Replace block*, *Insert*, *Insert below*,
   *Retry*, *Stop* (aborts the request through `AbortController`) or *Discard*.

Without a selection, a transform action targets the current block; a generate action
(`continue`, `paragraph`, `ask` without selection) inserts at the cursor. If the targeted
text changes while generating, the replacement is refused.

### `ai` options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `Boolean` | — | **Required** (`true`). |
| `endpoint` | `String` | — | Backend route used by the default HTTP transport. |
| `transport` | `WysiwygAiTransport` | — | Custom transport; takes precedence over `endpoint`. |
| `actions` | `Array` | all | Default ids and/or `{ id, label, icon?, description?, instruction?, mode?, promptForInstruction? }` actions. |
| `bubbleMenu` | `Boolean` | `true` | AI menu in the selection bubble. |
| `slashCommands` | `Boolean` | `true` | AI entries in the `/` palette (filter with `/ai`). |
| `stream` | `Boolean` | `true` | Uses `transport.stream()` when available. |
| `maxContextCharacters` | `Number` | `12000` | Budget for the document context sent. |
| `includeHtml` / `includeJson` | `Boolean` | `false` | Attach the document HTML / Tiptap JSON. |
| `format` | `"text"` \| `"html"` | `"text"` | Expected format. HTML is sanitized, then filtered by the schema. |
| `headers` | `Object` | — | HTTP transport headers (never provider keys). |
| `body` | `Object` | — | Data forwarded as-is in `request.metadata`. |
| `labels` | `Object` | French | Menu and panel labels. |

Default actions (`DEFAULT_WYSIWYG_AI_ACTIONS`): `improve`, `fixGrammar`, `shorter`, `longer`,
`simplify`, `rewrite`, `professional`, `summarize`, `translate`, `continue`, `paragraph`,
`ask`. Their instructions are provider-agnostic.

### Request payload

```ts
type WysiwygAiRequest = {
  action: string
  instruction?: string
  mode: 'transform' | 'generate'
  selection?: { from: number; to: number }
  selectedText?: string
  currentBlock?: string
  textBeforeSelection?: string
  textAfterSelection?: string
  documentText: string // truncated to maxContextCharacters
  truncated?: boolean
  html?: string // only with includeHtml
  json?: JSONContent // only with includeJson
  format: 'text' | 'html'
  metadata?: Record<string, unknown>
  stream: boolean // added by the HTTP transport
}
```

### AI SDK backend (Nuxt / Nitro example)

The library depends neither on `ai` nor on any `@ai-sdk/*` package, and never calls a
provider from the browser. The model and API key stay on the server.

```ts
// server/api/ai/editor.post.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const SYSTEM = `
You are an AI writing assistant embedded inside a rich-text editor.
Follow the requested editing action precisely.
Answer in the language of the text unless asked otherwise.
Return only the proposed text, without quotes or commentary.
`.trim()

const buildPrompt = (r: Record<string, any>) =>
  [
    `Action: ${r.action}`,
    r.instruction && `Instruction: ${r.instruction}`,
    r.selectedText ? `Text:\n${r.selectedText}` : `Text before cursor:\n${r.textBeforeSelection}`,
    r.textAfterSelection && `Text after:\n${r.textAfterSelection}`,
  ]
    .filter(Boolean)
    .join('\n\n')

export default defineEventHandler(async (event) => {
  const request = await readBody(event)
  // Authenticate the user and rate-limit here.
  const result = streamText({
    model: openai(process.env.AI_MODEL ?? 'gpt-5-mini'),
    system: SYSTEM,
    prompt: buildPrompt(request),
  })
  return result.toUIMessageStreamResponse() // or result.toTextStreamResponse()
})
```

The provider is swappable without touching the editor: `anthropic(...)`, `google(...)`,
`mistral(...)`, `xai(...)`, OpenRouter, any OpenAI-compatible provider, or a local model
exposed through an AI SDK provider.

The default HTTP transport understands:

- `toUIMessageStreamResponse()`: `text-delta`, `error` and `data-*` parts carrying
  `{ operations }`;
- `toTextStreamResponse()`: streamed plain text;
- a JSON `{ text }`, `{ operation, content, explanation }` or `{ operations }` body, e.g.
  from `generateText({ output: Output.object(...) })` or `generateObject()`.

### Custom transport

```ts
import { createWysiwygAiHttpTransport, type WysiwygAiTransport } from '@ficsysfr/jsonforms_builder'

const transport = createWysiwygAiHttpTransport({
  endpoint: '/api/ai/editor',
  headers: () => ({ 'x-csrf-token': csrfToken() }),
})

// Or fully custom:
const custom: WysiwygAiTransport = {
  async generate(request, { signal } = {}) {
    return { text: await myClient.rewrite(request, signal) }
  },
  async *stream(request, { signal } = {}) {
    for await (const delta of myClient.stream(request, signal)) yield delta
  },
}
```

Pass the transport in a UI schema built in code (`ai: { enabled: true, transport }`); a
serialized JSON UI schema uses `endpoint`.

### Structured operations and agent tools

A response can propose operations (`replaceSelection`, `insertBelow`, `insertAtCursor`,
`replaceText`, `insertContent`). They are validated, then **applied only after clicking
*Apply***.

`createWysiwygEditorTools(editor)` exposes tools shaped like AI SDK `tool()` (`description`,
JSON Schema `inputSchema`, `execute`) for a future agent mode:

- read-only, safe to run automatically: `getSelection`, `getDocumentText`,
  `getCurrentBlock`, `getHeadings`, `findText`;
- proposal, never mutating: `proposeReplaceSelection`, `proposeInsertContent`,
  `proposeReplaceText` return a `WysiwygAiOperation` that needs approval
  (`applyWysiwygAiOperation`).

## Security

- No provider key in the browser: authentication, quotas and model choice belong to the
  backend.
- Generated text is inserted as Tiptap text nodes, never interpreted as HTML.
- With `format: 'html'`, output goes through an allowlist (tags; `href` limited to http(s),
  mailto, tel and relative) then through the Tiptap schema; the preview never uses `v-html`.
- A read-only, disabled or previewing editor neither runs nor applies AI actions.

## Playground

- [WYSIWYG + AI](/en/playground#/?section=docs&example=nuxt-wysiwyg-ai) (local demo
  transport, no network)
