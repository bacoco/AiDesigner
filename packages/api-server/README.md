# AiDesigner API Server

HTTP API and WebSocket server for AiDesigner, providing REST endpoints and real-time updates.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run in development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

The API server will be available at `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects/:projectId/state` - Get project state
- `PATCH /api/projects/:projectId/state` - Update project state

### Conversation

- `GET /api/projects/:projectId/conversation` - Get conversation messages
- `POST /api/projects/:projectId/conversation` - Add a message

### Deliverables

- `GET /api/projects/:projectId/deliverables` - List all deliverables
- `GET /api/projects/:projectId/deliverables/:type` - Get specific deliverable
- `POST /api/projects/:projectId/deliverables` - Create a deliverable

### Decisions

- `GET /api/projects/:projectId/decisions` - Get recorded decisions
- `POST /api/projects/:projectId/decisions` - Record a decision

### Agents

- `GET /api/agents` - List all available agents
- `GET /api/agents/:agentId` - Get agent details
- `POST /api/agents/:agentId/execute` - Execute agent command

## WebSocket Events

Connect to WebSocket at `ws://localhost:3000` (same port as HTTP server).

### Client -> Server Events

- `join-project` - Join a project room
- `leave-project` - Leave a project room

### Server -> Client Events

- `state:updated` - Project state was updated
- `message:added` - New message added to conversation
- `deliverable:created` - New deliverable created
- `decision:recorded` - New decision recorded
- `agent:executed` - Agent command was executed

## Example Usage

### Create Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project"}'
```

### Get Project State

```bash
curl http://localhost:3000/api/projects/{projectId}/state
```

### Add Message

```bash
curl -X POST http://localhost:3000/api/projects/{projectId}/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "I want to build a task management app",
    "metadata": {"phase": "analyst"}
  }'
```

## WebSocket Example

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join project room
socket.emit('join-project', projectId);

// Listen for updates
socket.on('state:updated', (data) => {
  console.log('State updated:', data);
});

socket.on('message:added', (data) => {
  console.log('New message:', data);
});
```

## Development

- TypeScript is used for type safety
- Winston for structured logging
- Express.js for HTTP API
- Socket.io for WebSocket
- Zod for input validation

## Environment Variables

See `.env.example` for all available configuration options.
