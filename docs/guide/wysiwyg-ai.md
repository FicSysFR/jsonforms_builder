# Éditeur WYSIWYG & assistant IA

Le renderer WYSIWYG (`options.wysiwyg: true`) reste bâti sur `UEditor` (Nuxt UI, Tiptap 3).
Il ajoute des fonctions d'édition riches et un assistant d'écriture IA **optionnel**, conçu
pour un backend [AI SDK](https://ai-sdk.dev/) fourni par l'application hôte.

`{ wysiwyg: true }` reste valide tel quel : l'IA, la bulle de mise en forme et le menu `/`
sont désactivés par défaut.

## Fonctions d'édition

| Option | Type | Défaut | Description |
|---|---|---|---|
| `features` | `false` \| `WysiwygFeatures` | tout activé | Active ou retire chaque capacité (extension Tiptap + entrées de barre). `false` les retire toutes. |
| `features.taskList` | `Boolean` | `true` | Listes de tâches. |
| `features.textAlign` | `Boolean` | `true` | Alignement des titres et paragraphes. |
| `features.table` | `Boolean` | `true` | Tableaux, insertion et bulle contextuelle (lignes, colonnes, fusion, en-têtes). |
| `features.textColor` | `Boolean` | `true` | Couleur du texte. |
| `features.highlight` | `Boolean` | `true` | Surlignage multicolore. |
| `features.linkEditor` | `Boolean` | `true` | Panneau d'édition de lien (refuse `javascript:`, `data:`…) à la place du `prompt()` natif. |
| `features.findReplace` | `Boolean` | `true` | Rechercher / remplacer (sensible à la casse en option). |
| `features.sourceMode` | `Boolean` | `true` | Édition brute du HTML ou du JSON ; le contenu appliqué passe par le schéma Tiptap. |
| `features.preview` | `Boolean` | `true` | Aperçu en lecture seule. |
| `bubbleMenu` | `Boolean` | `false` (`true` avec `blockEditor`) | Bulle de mise en forme sur sélection de texte. |
| `slashCommands` | `Boolean` | `false` (`true` avec `blockEditor`) | Palette de commandes `/`. |
| `blockEditor` | `Boolean` \| `Object` | `false` | Édition par blocs (voir ci-dessous). |
| `ai` | `WysiwygAiOptions` | — | Assistant IA (voir ci-dessous). |

Une extension fournie par l'hôte via `options.extensions` (par exemple sa propre `Table`)
prend le pas sur l'extension intégrée du même nom. Une `toolbar` personnalisée n'est jamais
modifiée ; ses éléments peuvent utiliser les `kind` intégrés : `textColor`, `highlight`,
`table`, `tableAction`, `findReplace`, `sourceMode`, `preview`, `ai`.

## Édition par blocs

`blockEditor: true` transforme le champ en page éditée bloc par bloc, à la manière de Notion :

- au survol, une poignée apparaît dans la marge gauche de chaque bloc : `+` ajoute un bloc en
  dessous (et ouvre la palette `/` si elle est active), la poignée `⋮⋮` se **glisse** pour
  déplacer le bloc ou se **clique** pour ouvrir son menu : *Transformer en* (paragraphe,
  titres, listes, citation, code), *Effacer la mise en forme*, *Dupliquer*, *Copier le texte*,
  *Monter*, *Descendre*, *Supprimer* ;
- le bloc vide qui porte le curseur affiche un indice (`Titre 2` sur un titre, « tapez « / » »
  ailleurs) ; le `placeholder` de l'hôte reste affiché tant que le document est vide ;
- la barre d'outils fixe disparaît au profit de la bulle de mise en forme et de la palette `/` ;
- la page n'a plus de bordure et garde une marge gauche pour la poignée (masquée sous `sm`).

La poignée agit sur les blocs de premier niveau : une liste ou un tableau se déplace en entier.
Elle ne repose que sur ProseMirror et n'ajoute aucune dépendance (pas de `@tiptap/y-tiptap`,
contrairement à `UEditorDragHandle`).

Les raccourcis Markdown de Tiptap restent actifs (`# `, `- `, `1. `, `[ ] `, `> `, ` ``` `).
Chaque option explicite l'emporte : `toolbar`, `bubbleMenu`, `slashCommands`, `density`,
`padding`, `minHeight` et `blockSpacing`. Verrouillé (lecture seule, désactivé) ou en aperçu,
l'éditeur n'affiche ni poignée ni indice.

| Option | Type | Défaut | Description |
|---|---|---|---|
| `blockEditor` | `Boolean` \| `Object` | `false` | Active l'édition par blocs. |
| `blockEditor.dragHandle` | `Boolean` | `true` | Poignée de marge : `+`, glisser-déposer, menu du bloc. |
| `blockEditor.placeholders` | `Boolean` | `true` | Indice sur le bloc vide qui porte le curseur. |
| `blockEditor.bordered` | `Boolean` | `false` | Garde la bordure du champ autour de la page. |

```json
{
  "type": "Control",
  "scope": "#/properties/page",
  "options": { "wysiwyg": true, "contentType": "json", "blockEditor": true }
}
```

Aucun nouveau type de nœud n'est ajouté : le contenu reste identique en `json`, `html` ou
`markdown` et se relit avec ou sans `blockEditor`.

## Assistant IA

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

Aucun code IA ne s'exécute tant que `ai.enabled !== true` ou qu'aucun `endpoint` /
`transport` n'est fourni.

### Parcours

1. L'utilisateur sélectionne du texte puis choisit une action (bulle, barre d'outils ou `/ai`).
2. La requête part vers le backend de l'application, qui appelle AI SDK.
3. La réponse est **streamée dans un panneau détaché** : le document n'est jamais modifié
   pendant la génération.
4. L'utilisateur choisit : *Remplacer la sélection* / *Remplacer le bloc*, *Insérer*,
   *Insérer en dessous*, *Réessayer*, *Arrêter* (annule la requête via `AbortController`)
   ou *Ignorer*.

Sans sélection, une action de transformation porte sur le bloc courant ; une action de
génération (`continue`, `paragraph`, `ask` sans sélection) insère au curseur. Si le texte
ciblé est modifié pendant la génération, le remplacement est refusé.

### Options `ai`

| Option | Type | Défaut | Description |
|---|---|---|---|
| `enabled` | `Boolean` | — | **Requis** (`true`). |
| `endpoint` | `String` | — | Route du backend, utilisée par le transport HTTP par défaut. |
| `transport` | `WysiwygAiTransport` | — | Transport personnalisé ; prioritaire sur `endpoint`. |
| `actions` | `Array` | toutes | Identifiants par défaut et/ou actions `{ id, label, icon?, description?, instruction?, mode?, promptForInstruction? }`. |
| `bubbleMenu` | `Boolean` | `true` | Menu IA dans la bulle de sélection. |
| `slashCommands` | `Boolean` | `true` | Entrées IA dans la palette `/` (filtrables avec `/ai`). |
| `stream` | `Boolean` | `true` | Utilise `transport.stream()` quand il existe. |
| `maxContextCharacters` | `Number` | `12000` | Budget du contexte documentaire envoyé. |
| `includeHtml` / `includeJson` | `Boolean` | `false` | Joint le HTML / JSON Tiptap du document. |
| `format` | `"text"` \| `"html"` | `"text"` | Format attendu. Le HTML est assaini puis filtré par le schéma. |
| `headers` | `Object` | — | En-têtes du transport HTTP (jamais de clé de fournisseur). |
| `body` | `Object` | — | Données transmises telles quelles dans `request.metadata`. |
| `labels` | `Object` | français | Libellés du menu et du panneau. |

Actions par défaut (`DEFAULT_WYSIWYG_AI_ACTIONS`) : `improve`, `fixGrammar`, `shorter`,
`longer`, `simplify`, `rewrite`, `professional`, `summarize`, `translate`, `continue`,
`paragraph`, `ask`. Leurs instructions sont neutres vis-à-vis du fournisseur.

### Requête envoyée

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
  documentText: string // tronqué à maxContextCharacters
  truncated?: boolean
  html?: string // seulement avec includeHtml
  json?: JSONContent // seulement avec includeJson
  format: 'text' | 'html'
  metadata?: Record<string, unknown>
  stream: boolean // ajouté par le transport HTTP
}
```

### Backend AI SDK (exemple Nuxt / Nitro)

La bibliothèque ne dépend ni de `ai` ni d'un paquet `@ai-sdk/*`, et n'appelle jamais un
fournisseur depuis le navigateur. Le modèle et la clé d'API restent côté serveur.

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
  // Authentifier l'utilisateur et limiter le débit ici.
  const result = streamText({
    model: openai(process.env.AI_MODEL ?? 'gpt-5-mini'),
    system: SYSTEM,
    prompt: buildPrompt(request),
  })
  return result.toUIMessageStreamResponse() // ou result.toTextStreamResponse()
})
```

Le fournisseur se remplace sans toucher à l'éditeur : `anthropic(...)`, `google(...)`,
`mistral(...)`, `xai(...)`, OpenRouter, un fournisseur compatible OpenAI ou un modèle local
exposé par un fournisseur AI SDK.

Le transport HTTP par défaut comprend :

- `toUIMessageStreamResponse()` : parts `text-delta`, `error` et `data-*` portant
  `{ operations }` ;
- `toTextStreamResponse()` : texte brut streamé ;
- une réponse JSON `{ text }`, `{ operation, content, explanation }` ou `{ operations }`,
  par exemple issue de `generateText({ output: Output.object(...) })` ou `generateObject()`.

### Transport personnalisé

```ts
import { createWysiwygAiHttpTransport, type WysiwygAiTransport } from '@ficsysfr/jsonforms_builder'

const transport = createWysiwygAiHttpTransport({
  endpoint: '/api/ai/editor',
  headers: () => ({ 'x-csrf-token': csrfToken() }),
})

// Ou entièrement sur mesure :
const custom: WysiwygAiTransport = {
  async generate(request, { signal } = {}) {
    return { text: await myClient.rewrite(request, signal) }
  },
  async *stream(request, { signal } = {}) {
    for await (const delta of myClient.stream(request, signal)) yield delta
  },
}
```

Le transport se passe dans le UI schema côté code (`ai: { enabled: true, transport }`) ; un
UI schema JSON sérialisé utilise `endpoint`.

### Opérations structurées et outils d'agent

Une réponse peut proposer des opérations (`replaceSelection`, `insertBelow`,
`insertAtCursor`, `replaceText`, `insertContent`). Elles sont validées puis **appliquées
seulement après le clic sur *Appliquer***.

`createWysiwygEditorTools(editor)` expose des outils au format `tool()` d'AI SDK
(`description`, `inputSchema` JSON Schema, `execute`) pour un futur mode agent :

- lecture, exécutables automatiquement : `getSelection`, `getDocumentText`,
  `getCurrentBlock`, `getHeadings`, `findText` ;
- proposition, sans mutation : `proposeReplaceSelection`, `proposeInsertContent`,
  `proposeReplaceText` renvoient une `WysiwygAiOperation` soumise à approbation
  (`applyWysiwygAiOperation`).

## Sécurité

- Aucune clé de fournisseur dans le navigateur : authentification, quotas et choix du modèle
  relèvent du backend.
- Le texte généré est inséré comme nœuds texte Tiptap, jamais interprété comme HTML.
- Avec `format: 'html'`, la sortie passe par une liste blanche (balises, `href` limité à
  http(s), mailto, tel et relatif) puis par le schéma Tiptap ; l'aperçu n'utilise pas `v-html`.
- L'éditeur en lecture seule, désactivé ou en aperçu n'exécute ni n'applique aucune action IA.

## Playground

- [WYSIWYG + IA](/playground#/?section=docs&example=nuxt-wysiwyg-ai) (transport de
  démonstration local, sans réseau)
