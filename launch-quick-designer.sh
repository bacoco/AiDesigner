#!/bin/bash

# Launch Quick Designer v4 with Claude CLI

echo "🚀 Launching Quick Designer v4 with Claude CLI..."
echo "================================"
echo ""

# Build the MCP server
echo "📦 Building MCP server..."
npm run build:mcp

# Create Claude config with Quick Designer
echo "⚙️  Configuring Claude CLI..."

# Export the MCP config path
export CLAUDE_MCP_CONFIG="${PWD}/mcp/aidesigner-config.json"

echo ""
echo "✨ Quick Designer v4 Commands Available:"
echo "  - quick_designer_instant: Generate screen instantly"
echo "  - quick_designer_generate_with_ai: Generate with AI (8 variations max)"
echo "  - quick_designer_batch_generate: Generate multiple screens"
echo "  - quick_designer_refine: Refine with adjustments"
echo "  - quick_designer_validate: Validate a variation"
echo "  - quick_designer_show_system: Show design system"
echo "  - quick_designer_open_mockup: Open mockup in browser"
echo ""
echo "📝 Example usage:"
echo "  > Use quick_designer_instant with request 'modern login screen'"
echo "  > Use quick_designer_generate_with_ai to create a dashboard with 8 variations"
echo ""
echo "Starting Claude CLI..."
echo "================================"
echo ""

# Launch Claude CLI
claude chat --mcp-config "$CLAUDE_MCP_CONFIG"