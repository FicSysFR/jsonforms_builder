# Agents IA

Cette page décrit comment les assistants de code (Cursor, Claude, etc.) peuvent consommer la documentation de `@tacxou/jsonforms_builder`.

## Fichiers `llms.txt`

Au build de la doc, VitePress génère des index machine-readable (doc **anglaise** uniquement) :

| Fichier | Rôle |
|---|---|
| [llms.txt](https://ficsysfr.github.io/jsonforms_builder/llms.txt) | Index court : sections + liens vers les pages Markdown |
| [llms-full.txt](https://ficsysfr.github.io/jsonforms_builder/llms-full.txt) | Bundle Markdown complet |

Chaque page guide a aussi une variante `.md` (ex. `/en/guide/installation.md`) pour un fetch ciblé.

## Serveur MCP

Le paquet [`@tacxou/jsonforms_builder-mcp`](https://www.npmjs.com/package/@tacxou/jsonforms_builder-mcp) expose la doc via le [Model Context Protocol](https://modelcontextprotocol.io/) (transport **stdio**).

### Outils

| Outil | Rôle |
|---|---|
| `list_doc_sources` | Lit l’index `llms.txt` |
| `search_docs` | Cherche des pages pertinentes dans l’index / le bundle |
| `fetch_docs` | Récupère le contenu d’une URL de doc (hôte whiteliste) |

### Cursor

Dans `~/.cursor/mcp.json` (ou la config MCP du projet) :

```json
{
  "mcpServers": {
    "jsonforms-builder": {
      "command": "npx",
      "args": ["-y", "@tacxou/jsonforms_builder-mcp"]
    }
  }
}
```

### Claude Desktop

Dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "jsonforms-builder": {
      "command": "npx",
      "args": ["-y", "@tacxou/jsonforms_builder-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add-json jsonforms-builder '{"type":"stdio","command":"npx","args":["-y","@tacxou/jsonforms_builder-mcp"]}' -s local
```

### Variable d’environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `DOCS_BASE_URL` | `https://ficsysfr.github.io/jsonforms_builder` | Origine des docs (sans slash final). Utile pour pointer vers un `docs:preview` local. |

Exemple local :

```json
{
  "mcpServers": {
    "jsonforms-builder": {
      "command": "npx",
      "args": ["-y", "@tacxou/jsonforms_builder-mcp"],
      "env": {
        "DOCS_BASE_URL": "http://127.0.0.1:4173"
      }
    }
  }
}
```

> En local, l’hôte doit rester dans la whitelist du serveur MCP (`ficsysfr.github.io`, `127.0.0.1`, `localhost`).

## Règle agent suggérée

À ajouter dans les User Rules / règles projet :

```text
Pour toute question sur @tacxou/jsonforms_builder (renderers Nuxt UI, options uischema, FormBuilder, intégration Tailwind/Vite) :
1. appeler list_doc_sources
2. appeler search_docs avec la question
3. appeler fetch_docs sur les URLs pertinentes
4. répondre à partir de ce contexte (ne pas inventer d’options)
```
