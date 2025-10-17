# Theme Editor - Complete Integration Guide

The AiDesigner Theme Editor provides a comprehensive, AI-powered theming system with three interaction modes:

1. **Visual UI** - Drag-and-drop theme customization in the web interface
2. **AI Chatbot** - Natural language theme editing
3. **MCP Tools** - Programmatic control via CLI and orchestrator

## 🎨 Features

### Visual Theme Editor

- **Color Tokens**: Edit primary, accent, and background colors with live preview
- **Presets**: Apply curated themes (Ocean, Sunset, Forest, Midnight, Coral)
- **Palette Generator**: Create harmonious color schemes (monochromatic, complementary, analogous, triadic)
- **Dark Mode**: Generate dark mode variants automatically
- **History**: Undo/redo changes with full history tracking
- **Export**: Export themes as JSON, CSS, or Tailwind config

### AI Chatbot Assistant

Natural language commands supported:

- "Make the primary color blue"
- "Apply the ocean preset"
- "Generate a warm palette from #ff6b35"
- "Create a dark mode version"
- "Make it warmer/cooler"
- "Increase brightness"
- "Make colors more vibrant"
- "Export as CSS"

### MCP Server Tools

Eight programmatic tools available:

1. `theme_set_color` - Set a specific color token
2. `theme_apply_preset` - Apply a theme preset
3. `theme_generate_palette` - Generate palette from base color
4. `theme_generate_dark_mode` - Create dark mode version
5. `theme_get_current` - Get current theme
6. `theme_export` - Export in various formats
7. `theme_undo` - Undo last change
8. `theme_list_presets` - List available presets

## 🚀 Usage

### Web UI

1. Navigate to the **Theme** tab in the AiDesigner web interface
2. Use the visual controls to adjust colors
3. Or click the chat icon (💬) to use the AI assistant
4. Changes are synced to the server in real-time

### CLI

Use the theme CLI wrapper for quick operations:

```bash
# Set colors
node tools/theme-cli.js set-color primary "#3b82f6"
node tools/theme-cli.js set-color accent "#ec4899"

# Apply presets
node tools/theme-cli.js apply-preset ocean
node tools/theme-cli.js apply-preset sunset

# Generate palettes
node tools/theme-cli.js generate-palette "#ff6b35" complementary
node tools/theme-cli.js generate-palette "#3b82f6" triadic

# Dark mode
node tools/theme-cli.js generate-dark

# Export
node tools/theme-cli.js export json
node tools/theme-cli.js export css
node tools/theme-cli.js export tailwind

# Utilities
node tools/theme-cli.js get-current
node tools/theme-cli.js list-presets
node tools/theme-cli.js undo
```

### MCP Server

The theme editor MCP server runs as a standalone service:

```bash
node dist/mcp/src/mcp-server/theme-editor-server.js
```

Integrate it into your MCP configuration:

```json
{
  "mcpServers": {
    "theme-editor": {
      "command": "node",
      "args": ["node_modules/aidesigner/dist/mcp/src/mcp-server/theme-editor-server.js"]
    }
  }
}
```

## 📖 Architecture

### State Management

The theme editor uses Zustand for state management:

```typescript
// Front-end store
useThemeStore(); // Access theme state, actions, and history
```

State includes:

- Current theme (primary, accent, background)
- History array with timestamps and actions
- Presets library
- History navigation (undo/redo)

### Components

- **ThemeEditor** (`front-end/src/components/ThemeEditor.tsx`)
  - Main visual editor with tabs for colors, presets, and generation
  - Integrated history viewer
  - Export functionality

- **ThemeEditorChat** (`front-end/src/components/ThemeEditorChat.tsx`)
  - AI chatbot with natural language parsing
  - Pattern-matching command interpreter
  - Real-time theme manipulation

- **Theme Store** (`front-end/src/stores/themeStore.ts`)
  - Zustand-based state management
  - History tracking with automatic snapshots
  - HSL color manipulation utilities
  - Export formatters (JSON, CSS, Tailwind)

### MCP Server

- **Theme Editor Server** (`.dev/src/mcp-server/theme-editor-server.ts`)
  - Model Context Protocol compliant
  - 8 tools for theme manipulation
  - Stateful server with history tracking
  - Color theory utilities (HSL conversion, palette generation)

- **CLI Wrapper** (`tools/theme-cli.js`)
  - User-friendly CLI interface
  - MCP tool invocation
  - Pretty-printed results

## 🎯 Integration Points

### Web UI Integration

The theme editor is integrated into `App.tsx` as a dedicated tab:

1. Theme store syncs with App state
2. Changes trigger API calls to persist to server
3. Real-time updates via WebSocket
4. Background style updates on theme changes

### Main Chat Integration

The theme editor can be controlled via the main AiDesigner chat:

```
User: "Can you change the primary color to blue?"
Assistant: [Uses theme_set_color tool] ✓ Set primary to #3b82f6
```

This requires the invisible orchestrator to recognize theme-related intents and call the appropriate MCP tools.

## 🛠️ Development

### Adding New Presets

Edit `front-end/src/stores/themeStore.ts` and add to `DEFAULT_PRESETS`:

```typescript
{
  id: 'my-preset',
  name: 'My Preset',
  description: 'Custom theme description',
  colors: { primary: '#...', accent: '#...', background: '#...' },
  tags: ['tag1', 'tag2'],
}
```

Also update the MCP server in `.dev/src/mcp-server/theme-editor-server.ts`.

### Adding Chat Commands

Edit `ThemeEditorChat.tsx` and add pattern matching in `parseCommand()`:

```typescript
if (lower.match(/my pattern/i)) {
  return {
    action: 'myAction',
    params: { ... },
    response: 'User-facing message'
  };
}
```

Then implement the action in `executeCommand()`.

### Adding MCP Tools

Edit `.dev/src/mcp-server/theme-editor-server.ts`:

1. Add tool definition to `getTools()`
2. Add case to tool handler switch
3. Implement handler method
4. Rebuild: `npm run build:mcp`

## 📝 Example Workflows

### Workflow 1: Quick Theming

```bash
# Apply a preset
node tools/theme-cli.js apply-preset ocean

# Adjust to taste
node tools/theme-cli.js set-color primary "#0066cc"

# Export for use
node tools/theme-cli.js export css > theme.css
```

### Workflow 2: Custom Palette

```bash
# Start with a base color
node tools/theme-cli.js generate-palette "#ff6b35" complementary

# Create dark variant
node tools/theme-cli.js generate-dark

# Export as Tailwind
node tools/theme-cli.js export tailwind > tailwind-theme.js
```

### Workflow 3: Conversational Design

Open the web UI, enable the AI chat, and:

```
> Apply a professional blue theme
✓ Applied Midnight preset

> Make it a bit lighter
✓ Increased brightness of all colors

> Export as CSS
✓ Exported theme as CSS (copied to clipboard)
```

## 🔮 Future Enhancements

- **Color Contrast Checker**: WCAG compliance validation
- **Brand Color Import**: Extract colors from logos/images
- **Inspiration Mode**: Generate themes from photos
- **Semantic Tokens**: Named tokens beyond primary/accent/background
- **Component Preview**: See theme applied to UI components
- **Theme Marketplace**: Share and discover themes
- **Gradient Support**: Multi-stop gradient themes
- **Animation Preview**: See theme transitions

## 🤝 Contributing

When adding features:

1. Update both the visual UI and chatbot
2. Add corresponding MCP tool if appropriate
3. Update documentation
4. Add tests for color manipulation logic
5. Ensure accessibility (contrast ratios)

## 📚 Resources

- [Color Theory Primer](https://www.interaction-design.org/literature/topics/color-theory)
- [HSL Color System](https://en.wikipedia.org/wiki/HSL_and_HSV)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Built with ❤️ for AiDesigner**
