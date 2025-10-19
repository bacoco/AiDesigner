# AiDesigner Deployment Guide

This guide covers the minimum steps required to deploy the AiDesigner API server and supporting services in a production-like environment.

## 1. Prerequisites

- Node.js 20.10 or later
- npm 10+
- A persistent storage volume for log files (optional but recommended)
- Access to provider credentials (Claude, GLM, etc.) if required for your workflow

## 2. Prepare the Environment

1. Copy the environment template and adjust values:
   ```bash
   cp .env.example .env
   ```
2. Set the following critical variables:
   - `NODE_ENV=production`
   - `API_PORT` (default `3000`)
   - `CORS_ORIGIN` to the URL of your web client
   - Provider credentials (e.g., `GLM_API_KEY`, `CLAUDE_DEFAULT_PROVIDER`)
   - Optional logging and timeout overrides (see `.env.example`)

## 3. Install Dependencies

```bash
npm install
npm run build --workspace @aidesigner/api-server
```

The build step transpiles TypeScript into `packages/api-server/dist`.

## 4. Run Database & External Services (if applicable)

AiDesigner stores state on the filesystem via `.dev/lib/project-state.js`. Ensure the `PROJECT_STATE_PATH` and `AIDESIGNER_PROJECT_ROOT` variables point to persistent locations if you plan to run long-lived projects.

## 5. Start the API Server

```bash
NODE_ENV=production ENABLE_FILE_LOGGING=true npm run start --workspace @aidesigner/api-server
```

- Health endpoints:
  - `GET /health` – liveness
  - `GET /health/ready` – readiness (returns HTTP 503 on failure)
  - `GET /health/detailed` – expanded metrics
- Logs are written to the console and rotated daily files under `LOG_DIR`.

## 6. Reverse Proxy (Recommended)

Place the API server behind a reverse proxy (NGINX, Caddy, or similar) to handle TLS termination, request limits, and caching. Forward WebSocket connections to support real-time project updates.

## 7. Monitoring & Alerting

- Tail the log directory or ship logs to your observability stack.
- Set alerts on readiness endpoint failures and high memory usage (exposed via `/health/detailed`).
- Track process uptime and restart counts.

## 8. Graceful Shutdown

Send `SIGTERM` or `SIGINT` to allow the server to close existing connections. The shutdown timeout can be tuned with `SHUTDOWN_TIMEOUT_MS`.

## 9. Post-Deployment Checklist

- [ ] Health endpoints return HTTP 200
- [ ] Logs are rotating and accessible
- [ ] CORS configuration matches expected clients
- [ ] Provider credentials verified via smoke test
- [ ] Backups configured for project output (if required)

## 10. Updating the Deployment

1. Pull the latest changes
2. Re-run `npm install` if dependencies changed
3. Rebuild the API server workspace
4. Restart the process via your process manager (PM2, systemd, Docker, etc.)

---

For additional architecture details, refer to the documentation under `docs/` and the roadmap in `TODO_ROADMAP_TO_PERFECTION.md`.
