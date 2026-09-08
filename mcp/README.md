# `@tacxou/jsonforms_builder-mcp`

MCP (stdio) server that exposes the published [JSONForms Builder](https://ficsysfr.github.io/jsonforms_builder/) documentation to coding agents.

## Tools

| Tool | Description |
|---|---|
| `list_doc_sources` | Fetch and return `llms.txt` |
| `search_docs` | Keyword / NL search over the index (and `llms-full.txt` when available) |
| `fetch_docs` | Fetch a whitelisted docs URL |

## Cursor

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

## Environment

| Variable | Default |
|---|---|
| `DOCS_BASE_URL` | `https://ficsysfr.github.io/jsonforms_builder` |

Allowed hosts: `ficsysfr.github.io`, `127.0.0.1`, `localhost`.

## Develop

```bash
yarn install
yarn build
node dist/index.js
```

Docs: [AI agents guide](https://ficsysfr.github.io/jsonforms_builder/en/guide/ai)
