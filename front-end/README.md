# AiDesigner Web UI

A modern, responsive web interface for AiDesigner that provides a chat-based interface for designing and building applications through natural conversation.

## Features

### 1. Chat Interface

- Natural conversation with the AiDesigner AI
- Real-time message streaming
- Phase-aware responses (Analyst, PM, Architect, UX, SM, Dev, QA)
- Tool usage visualization showing which MCP tools are being called

### 2. Live UI Preview

- Live rendering of the current project UI fed by backend WebSocket events
- Sanitized iframe output with hardened sandboxing for untrusted HTML
- Automatic refresh when components install or the theme updates
- Loading and error states so users always know what is happening

### 3. Theme Editor

- Visual color pickers and hex inputs with accessibility friendly labels
- Debounced synchronization with the `/ui/theme` API endpoint
- Immediate application of CSS variables across the interface
- Safe validation helpers (`normalizeHex`, `hexToRgba`, `ensureValidHex`) with automated tests

### 4. Component Registry

- Browse the merged shadcn/Kibo catalog from inside the app
- Install components directly into the project with progress feedback
- Optimized lookup of installed components for large registries
- Registry dialog featuring status badges, retry flows, and helpful empty states

### 5. Tools Dashboard

- Display of all available MCP tools
- Real-time project state visualization
- Tool descriptions and capabilities
- JSON-formatted state inspection

## Getting Started

### Prerequisites

- Node.js >= 20.10.0
- npm >= 9.0.0

### Installation

```bash
cd front-end
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide Icons** for beautiful icons
- **Recharts** for data visualization (future use)

## Project Structure

```
front-end/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── App.tsx          # Main application component
│   ├── App.css          # Global styles
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies and scripts
```

## Key Components

### App.tsx

The main application component that handles:

- Message state management
- Chat interactions
- Project state tracking
- UI generation and preview
- Tool call visualization

### Interface Types

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: string;
  duration?: number;
}

interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, any>;
  decisions?: Record<string, any>;
  nextSteps?: string;
}

interface GeneratedUI {
  id: string;
  name: string;
  html: string;
  timestamp: Date;
  phase?: string;
}
```

## Features in Detail

### Phase Tracking

The application tracks the current phase of the design process:

- **Analyst** (blue) - Discovery and requirements gathering
- **PM** (purple) - Product management and planning
- **Architect** (green) - Technical architecture design
- **UX** (pink) - User experience and design
- **SM** (orange) - Scrum master / story management
- **Dev** (red) - Development
- **QA** (yellow) - Quality assurance

### Tool Visualization

When the AI uses tools, they are displayed with:

- Tool name
- Duration (in milliseconds)
- Result message
- Visual grouping in the chat

### UI & Theme Synchronization

The application keeps the preview and theme in sync by:

1. Listening for `ui:components` and `ui:theme` WebSocket events
2. Debouncing outgoing theme updates to prevent server overload
3. Sanitizing backend HTML with DOMPurify before rendering
4. Automatically refreshing the iframe when installs or updates land

### Component Installation

Installing from the registry now:

1. Prevents duplicate installs by tracking pending status per component
2. Surfaces success and error feedback inline with retry affordances
3. Refreshes the installed component list and preview in parallel
4. Handles network failures gracefully with user facing error messages

## Current State (Mock Implementation)

**Note**: The current implementation uses mock responses and simulated tool calls for demonstration purposes. To connect to the actual AiDesigner backend:

1. Replace mock response generation with API calls to the MCP server
2. Implement WebSocket connection for real-time updates
3. Connect to the actual project state management system
4. Integrate with real tool execution

## Future Enhancements

### Backend Integration

- Connect to actual AiDesigner MCP server
- Real-time project state synchronization
- Actual tool execution and results
- Conversation persistence

### Additional Features

- Code editor for generated HTML/CSS
- Design token editor
- Component library browser
- Export to various frameworks (React, Vue, Svelte)
- Collaboration features (multiplayer)
- Design history and versioning
- Template marketplace

### Performance

- Virtual scrolling for long conversations
- Lazy loading of UI previews
- Caching of generated designs
- Optimistic UI updates

## License

MIT License - Same as AiDesigner project

## Support

For issues or questions about the web UI:

- Open an issue on GitHub
- Join the Discord community
- Check the main AiDesigner documentation
