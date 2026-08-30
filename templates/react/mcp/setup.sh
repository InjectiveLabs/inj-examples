#!/bin/bash
set -e

echo "🔧 Setting up Injective MCP Server..."

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
  echo "❌ Node.js v22+ required. Current: $(node -v 2>/dev/null || echo 'not found')"
  echo "   Install via: https://github.com/nvm-sh/nvm"
  exit 1
fi
echo "✅ Node.js $(node -v) — OK"

# Clone and build
if [ -d "injective-mcp-server" ]; then
  echo "📁 Found existing injective-mcp-server, pulling latest..."
  cd injective-mcp-server && git pull && cd ..
else
  echo "📥 Cloning Injective MCP server..."
  git clone https://github.com/InjectiveLabs/mcp-server injective-mcp-server
fi

echo "📦 Installing dependencies..."
cd injective-mcp-server && npm install

echo "🔨 Building..."
npm run build
cd ..

echo ""
echo "✅ Injective MCP server ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy mcp-config.json to your AI client's config directory"
echo "   2. Update the path in args[] to point to:"
echo "      $(pwd)/injective-mcp-server/dist/mcp/server.js"
echo ""
echo "   Claude Desktop (macOS): ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "   Claude Desktop (Windows): %APPDATA%\\Claude\\claude_desktop_config.json"
echo "   Cursor: .cursor/mcp.json (project root) or ~/.cursor/mcp.json (global)"
echo "   VS Code: .vscode/mcp.json"
