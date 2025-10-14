# AiDesigner Full-Stack Setup Guide

This guide explains how to run the complete AiDesigner stack with the web UI connected to the real backend API.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       AiDesigner Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React + TypeScript)                              │
│  http://localhost:5173                                       │
│  ├─ Chat Interface                                          │
│  ├─ UI Preview                                              │
│  └─ Tools Dashboard                                         │
│                        │                                     │
│                        │ REST API + WebSocket                │
│                        ▼                                     │
│                                                              │
│  API Server (Express + TypeScript)                          │
│  http://localhost:3000                                       │
│  ├─ HTTP REST endpoints                                     │
│  ├─ WebSocket for real-time updates                         │
│  └─ Wraps existing .dev/lib modules                         │
│                        │                                     │
│                        ▼                                     │
│                                                              │
│  AiDesigner Core Modules                                     │
│  .dev/lib/                                                   │
│  ├─ project-state.js                                        │
│  ├─ aidesigner-bridge.js                                    │
│  ├─ deliverable-generator.js                                │
│  └─ ...                                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 20.10.0
- npm >= 9.0.0

### Option 1: Run Everything with One Command

From the project root:

```bash
# Terminal 1: Start API Server
cd packages/api-server && npm install && npm run dev

# Terminal 2: Start Frontend
cd front-end && npm install && npm run dev
```

### Option 2: Development Mode (Recommended)

**Terminal 1 - API Server**:

```bash
cd packages/api-server
npm install
npm run dev
```

The API server will start on http://localhost:3000

**Terminal 2 - Frontend**:

```bash
cd front-end
npm install
npm run dev
```

The frontend will start on http://localhost:5173 and automatically connect to the API.

## Features

### Backend API Server (`packages/api-server/`)

**Technology Stack**:

- Express.js with TypeScript
- Socket.io for WebSocket
- Winston for structured logging
- Zod for validation

**Endpoints**:

- `POST /api/projects` - Create a new project
- `GET /api/projects/:id/state` - Get project state
- `PATCH /api/projects/:id/state` - Update project state
- `GET /api/projects/:id/conversation` - Get messages
- `POST /api/projects/:id/conversation` - Add message
- `GET /api/projects/:id/deliverables` - List deliverables
- `POST /api/projects/:id/deliverables` - Create deliverable
- `GET /api/agents` - List available agents
- `POST /api/agents/:id/execute` - Execute agent command
- And more...

**WebSocket Events**:

- `state:updated` - Project state changed
- `message:added` - New message in conversation
- `deliverable:created` - New deliverable generated
- `decision:recorded` - New decision logged
- `agent:executed` - Agent command completed

### Frontend Web UI (`front-end/`)

**Technology Stack**:

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui
- Socket.io-client for WebSocket

**Features**:

- ✅ Real-time chat interface
- ✅ Live project state updates
- ✅ Tool usage visualization
- ✅ Phase tracking
- ✅ Connection status indicator
- ✅ Error handling with user-friendly messages

## Configuration

### API Server Configuration

Create `packages/api-server/.env`:

```env
API_PORT=3000
WS_PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Frontend Configuration

Create `front-end/.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Development Workflow

### Making Changes

1. **Backend Changes**: Edit files in `packages/api-server/src/`
   - The server auto-reloads on file changes (tsx watch)
   - Check logs in Terminal 1

2. **Frontend Changes**: Edit files in `front-end/src/`
   - Vite auto-reloads on file changes
   - Changes appear instantly in browser

3. **Testing API Endpoints**:

```bash
# Health check
curl http://localhost:3000/health

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}'

# Get project state
curl http://localhost:3000/api/projects/{projectId}/state
```

### Debugging

**Backend Logs**:

- Structured JSON logs in Terminal 1
- All HTTP requests logged with duration
- WebSocket connections logged

**Frontend Debugging**:

- Open browser DevTools (F12)
- Check Console for WebSocket messages
- Check Network tab for API calls
- React DevTools for component inspection

**Common Issues**:

1. **CORS Error**: Make sure `CORS_ORIGIN` in API server .env matches frontend URL
2. **WebSocket Not Connecting**: Check that both servers are running
3. **404 on API calls**: Verify `VITE_API_URL` in frontend .env is correct

## Architecture Details

### No Mock Data

**Before**: Frontend used generated mock responses
**Now**: Frontend makes real API calls to backend which uses actual AiDesigner modules

All data flows:

```
User Input → Frontend → API → AiDesigner Core → API → Frontend → User
```

### In-Memory Storage

Currently, project data is stored in memory (Map in ProjectService). This means:

- ✅ Fast and simple
- ✅ No database setup required
- ⚠️ Data lost on server restart
- ⚠️ Not suitable for production

Future enhancement: Add PostgreSQL adapter for persistent storage.

### WebSocket Real-Time Updates

When project state changes:

1. Backend emits event via Socket.io
2. All connected clients in that project room receive update
3. Frontend updates UI automatically

This enables multiple users to see updates in real-time (future feature).

## Testing

### Manual Testing

1. Open http://localhost:5173 in browser
2. You should see "Real Backend Connected!" banner
3. Type a message: "I want to build a task management app"
4. Verify:
   - Message appears in chat
   - Backend logs show API call
   - Project state updates in Tools tab
   - WebSocket shows as "Connected"

### API Testing

Use the API with curl or Postman:

```bash
# Test health
curl http://localhost:3000/health

# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' | jq -r '.projectId')

# Add message
curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/conversation \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello", "metadata": {"phase": "analyst"}}'

# Get conversation
curl http://localhost:3000/api/projects/$PROJECT_ID/conversation
```

## Production Deployment

For production deployment, see:

- `packages/api-server/README.md` - API server deployment
- `PRD_AIDESIGNER_MODERNIZATION.md` - Full production roadmap
- `IMPLEMENTATION_PLAN.md` - Detailed implementation steps

Future enhancements:

- PostgreSQL database
- JWT authentication
- Rate limiting
- Docker containerization
- Prometheus metrics
- Horizontal scaling

## Troubleshooting

### Server Won't Start

```bash
# Check if ports are in use
lsof -i :3000  # API server
lsof -i :5173  # Frontend

# Kill processes if needed
kill -9 <PID>
```

### Frontend Can't Connect to API

1. Verify API server is running: `curl http://localhost:3000/health`
2. Check `front-end/.env` has correct `VITE_API_URL`
3. Check browser console for error messages
4. Verify CORS is configured correctly in API server

### WebSocket Not Connecting

1. Check API server logs for WebSocket connection attempts
2. Verify Socket.io is properly initialized
3. Check browser console for WebSocket errors
4. Try refreshing the page

## Additional Resources

- [API Server README](packages/api-server/README.md)
- [Frontend README](front-end/README.md)
- [PRD](PRD_AIDESIGNER_MODERNIZATION.md)
- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Code Review](CODE_REVIEW_AND_IMPROVEMENTS.md)

## Contributing

When making changes:

1. Keep API and frontend types in sync
2. Add error handling for all API calls
3. Test both success and error cases
4. Update documentation
5. Run lint before committing:
   ```bash
   npm run lint          # Root project
   cd packages/api-server && npm run build  # Check TypeScript
   cd front-end && npm run build            # Check frontend build
   ```

## What's Next?

See `IMPLEMENTATION_PLAN.md` for the full roadmap. Current status:

- ✅ Phase 1 Week 1: API Server operational
- ✅ Phase 2 Week 1: Frontend connected
- ⏳ Future: Agent execution, deliverable generation, production features

---

**Status**: ✅ Working - Frontend connected to real backend with zero mock data!
