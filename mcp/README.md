# geo-explorer-mcp

MCP server for the **Geo-Explorer** project. Exposes the learning-platform logic as MCP tools so that any MCP-compatible client (Bob, Claude Desktop, Cursor, etc.) can call them directly.

---

## Tools

| Tool | Description | Parameters |
|---|---|---|
| `listar_tecnologias` | Lists all available technologies with level and XP | *(none)* |
| `buscar_trilha` | Returns the full study plan for a technology | `tecnologia` (string) |
| `gerar_desafio` | Generates a random coding challenge | `tecnologia` (string), `nivel` (optional enum) |
| `gerar_certificado` | Issues a Markdown certificate | `nome` (string), `tecnologia` (string) |

### Parameter details

**`buscar_trilha`**
- `tecnologia` — partial or full technology name, case-insensitive. Examples: `"javascript"`, `"python"`, `"node.js"`.

**`gerar_desafio`**
- `tecnologia` — same as above.
- `nivel` — optional difficulty level. Accepted values: `Básico`, `Intermediário`, `Avançado` (accented forms), or `basico`, `intermediario`, `avancado` (unaccented). When omitted the level registered in the trail is used.

**`gerar_certificado`**
- `nome` — student's full name. Example: `"Ana Lima"`.
- `tecnologia` — technology of the completed trail.

---

## Prerequisites

- Node.js ≥ 18
- The server must be **built** before registration (see below).

---

## Build

Run once from the `mcp/` directory:

```bash
cd mcp
npm install
npm run build
```

The compiled entry-point will be at:

```
mcp/build/mcp/src/index.js
```

---

## Registering in Bob

Add the server to your Bob workspace MCP config (`.bob/mcp.json` inside the project folder, or the global config):

```json
{
  "mcpServers": {
    "geo-explorer": {
      "command": "node",
      "args": ["C:/Workspace/dio/geo-explorer/mcp/build/mcp/src/index.js"]
    }
  }
}
```

> **Tip:** use an absolute path to `index.js`. Relative paths can break depending on where Bob spawns the process.

Bob hot-reloads MCP servers when the config is saved. After adding the entry you should see **geo-explorer** listed as a connected server in the Bob MCP panel.

---

## Registering in Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "geo-explorer": {
      "command": "node",
      "args": ["C:/Workspace/dio/geo-explorer/mcp/build/mcp/src/index.js"]
    }
  }
}
```

Restart Claude Desktop to pick up the change.

---

## Example usage

Once connected, you can ask the assistant:

- *"Liste as tecnologias disponíveis."* → calls `listar_tecnologias`
- *"Qual é o plano de estudos de TypeScript?"* → calls `buscar_trilha`
- *"Gera um desafio avançado de Python."* → calls `gerar_desafio`
- *"Emite um certificado para Ana Lima na trilha de JavaScript."* → calls `gerar_certificado`

---

## Project structure

```
mcp/
├── src/
│   └── index.ts        # MCP server entry-point
├── build/              # Compiled output (git-ignored)
├── package.json
├── tsconfig.json
└── README.md
```

All business logic is imported directly from `../commands/` — no code is duplicated.

---

## Development

To iterate without rebuilding every time, run the server directly via `tsx`:

```bash
cd mcp
npm run dev
```

After any source change, rebuild with `npm run build` before restarting the registered server.
