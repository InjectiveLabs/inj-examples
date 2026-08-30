# Injective MCP Integration

This module integrates the [Injective MCP Server](https://github.com/InjectiveLabs/mcp-server) with this dApp template, enabling AI assistants (Claude, Cursor, VS Code Copilot) to query and transact on Injective via natural language.

## What is MCP?

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/introduction) is an open standard that lets AI assistants connect to external tools and data sources. The Injective MCP server exposes Injective's capabilities — trading, queries, transfers, EVM transactions — as MCP tools that any compatible AI client can use.

## Quick Setup

### Prerequisites

- Node.js v22+ (`node -v` to check)
- An MCP-compatible AI client (Claude Desktop, Cursor, VS Code, etc.)

### 1. Run the Setup Script

```bash
cd mcp
chmod +x setup.sh
./setup.sh
```

This clones and builds the Injective MCP server locally.

### 2. Configure Your AI Client

#### Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "injective": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/injective-mcp-server/dist/mcp/server.js"],
      "env": {
        "INJECTIVE_NETWORK": "testnet"
      }
    }
  }
}
```

Restart Claude Desktop. The Injective tools will appear in Claude's tool list.

#### Cursor IDE

Create `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "injective": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/injective-mcp-server/dist/mcp/server.js"],
      "env": {
        "INJECTIVE_NETWORK": "testnet"
      }
    }
  }
}
```

#### VS Code (GitHub Copilot)

Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "injective": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/mcp/injective-mcp-server/dist/mcp/server.js"],
      "env": {
        "INJECTIVE_NETWORK": "testnet"
      }
    }
  }
}
```

> **Tip**: Replace `testnet` with `mainnet` when going to production.

## What You Can Do

Once connected, ask your AI assistant in plain English:

| Prompt | What Happens |
|--------|-------------|
| "What's the INJ balance of 0x..." | Queries `eth_getBalance` on Injective |
| "Check USDC balance on Injective testnet" | Reads ERC20 balance |
| "Did tx 0xabc... succeed?" | Fetches transaction receipt |
| "What's the current gas price on Injective?" | Returns network gas info |
| "Query the latest block on Injective" | Fetches block data |

The full tool list is available at: [github.com/InjectiveLabs/mcp-server#tools](https://github.com/InjectiveLabs/mcp-server#tools)

## Switching to Mainnet

Change the env in your client config:

```json
"env": {
  "INJECTIVE_NETWORK": "mainnet"
}
```

Mainnet RPC: `https://svm.injective.network/`

## Extending with Custom Tools

See [`examples/custom-tools.md`](./examples/custom-tools.md) for a guide on adding your own MCP tools for your dApp's contracts.

## Resources

- [Injective MCP Server Repo](https://github.com/InjectiveLabs/mcp-server)
- [Injective Developer Docs](https://docs.injective.network/)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)
- [Injective Testnet Faucet](https://testnet.faucet.injective.network/)
- [Injective Testnet Explorer](https://testnet.explorer.injective.network/)
