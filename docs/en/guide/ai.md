# AI agents

How coding assistants (Cursor, Claude, and similar) can consume `@tacxou/jsonforms_builder` documentation.

## `llms.txt` files

On docs build, VitePress emits machine-readable indexes (**English** docs only):

| File | Role |
|---|---|
| [llms.txt](https://ficsysfr.github.io/jsonforms_builder/llms.txt) | Short index: sections + links to Markdown pages |
| [llms-full.txt](https://ficsysfr.github.io/jsonforms_builder/llms-full.txt) | Full Markdown bundle |

Each guide page also has a `.md` variant (e.g. `/en/guide/installation.md`) for targeted fetches.

## MCP server

The [`@tacxou/jsonforms_builder-mcp`](https://www.npmjs.com/package/@tacxou/jsonforms_builder-mcp) package exposes the docs over the [Model Context Protocol](https://modelcontextprotocol.io/) (**stdio** transport).

### Tools

| Tool | Role |
|---|---|
| `list_doc_sources` | Reads the `llms.txt` index |
| `search_docs` | Finds relevant pages in the index / full bundle |
| `fetch_docs` | Fetches a docs URL (whitelisted host) |

### Cursor

In `~/.cursor/mcp.json` (or project MCP config):

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

In `claude_desktop_config.json`:

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

### Environment variable

| Variable | Default | Role |
|---|---|---|
| `DOCS_BASE_URL` | `https://ficsysfr.github.io/jsonforms_builder` | Docs origin (no trailing slash). Point at a local `docs:preview` when needed. |

Local example:

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

> Locally, the host must stay on the MCP whitelist (`ficsysfr.github.io`, `127.0.0.1`, `localhost`).

## Suggested agent rule

Add to User Rules / project rules:

```text
For any question about @tacxou/jsonforms_builder (Nuxt UI renderers, uischema options, FormBuilder, Tailwind/Vite integration):
1. call list_doc_sources
2. call search_docs with the question
3. call fetch_docs on relevant URLs
4. answer from that context (do not invent options)
```
