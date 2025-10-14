# AiDesigner Modernization: Detailed Implementation Plan

**Project**: AiDesigner Framework Modernization & Web UI Integration  
**Duration**: 10 weeks  
**Start Date**: Week of October 14, 2025  
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Foundation (Weeks 1-4)](#phase-1-foundation-weeks-1-4)
3. [Phase 2: API Layer & Events (Weeks 5-7)](#phase-2-api-layer--events-weeks-5-7)
4. [Phase 3: Frontend Integration (Weeks 8-9)](#phase-3-frontend-integration-weeks-8-9)
5. [Phase 4: Production Infrastructure (Week 10)](#phase-4-production-infrastructure-week-10)
6. [Daily Workflow](#daily-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Risk Management](#risk-management)

---

## Overview

This implementation plan breaks down the modernization of AiDesigner into 4 phases over 10 weeks. Each phase has clear deliverables, acceptance criteria, and testing requirements. The plan is designed to maintain backward compatibility while enabling new web UI capabilities.

### Principles

1. **Iterative Development**: Each phase delivers working software
2. **Test-Driven**: Write tests before or alongside implementation
3. **Backward Compatible**: CLI must continue working throughout
4. **Documented**: Update docs as features are completed
5. **Reviewed**: All code goes through PR review process

---

## Phase 1: Foundation (Weeks 1-4)

### Goal

Establish type safety foundation and core abstractions needed for API layer.

### Week 1: TypeScript Infrastructure & Project State

#### Tasks

**Day 1-2: TypeScript Setup**

- [ ] Create `tsconfig.json` for core modules with strict mode
- [ ] Create `tsconfig.build.json` for build output
- [ ] Add TypeScript build scripts to `package.json`
- [ ] Set up ts-node for development
- [ ] Add TypeScript to CI/CD pipeline
- [ ] Update `.gitignore` for TypeScript artifacts

**Day 3-5: Migrate project-state.js**

- [ ] Create `lib/project-state.ts` with interfaces
- [ ] Define `ProjectState`, `PhaseTransition`, `Message`, `Deliverable` types
- [ ] Add Zod schemas for runtime validation
- [ ] Port all methods with proper typing
- [ ] Update tests to TypeScript
- [ ] Verify backward compatibility

#### Deliverables

- ✅ TypeScript build infrastructure working
- ✅ `lib/project-state.ts` fully typed
- ✅ All existing tests passing
- ✅ CI/CD running TypeScript checks

#### Files Created/Modified

```
tsconfig.json (new)
tsconfig.build.json (new)
package.json (modified)
lib/project-state.ts (new, replaces .js)
lib/project-state.test.ts (modified)
```

#### Acceptance Criteria

- [ ] `npm run build:types` completes without errors
- [ ] All 230+ tests pass with TypeScript
- [ ] Zero `any` types in project-state.ts
- [ ] Zod schemas validate all inputs/outputs

---

### Week 2: BMAD Bridge & Agent Loading

#### Tasks

**Day 1-3: Migrate bmad-bridge.js**

- [ ] Create `lib/bmad-bridge.ts` with interfaces
- [ ] Define `Agent`, `Template`, `Task`, `Workflow` types
- [ ] Port agent loading with proper typing
- [ ] Add context enrichment types
- [ ] Update dependency resolution logic
- [ ] Add comprehensive error handling

**Day 4-5: Create Shared Types Package**

- [ ] Create `packages/types/` directory
- [ ] Define shared types (Phase, AgentId, DeliverableType, etc.)
- [ ] Export all types from index.ts
- [ ] Update project-state and bmad-bridge to use shared types
- [ ] Document all exported types

#### Deliverables

- ✅ `lib/bmad-bridge.ts` fully typed
- ✅ `packages/types/` package created
- ✅ All agent loading logic type-safe
- ✅ Tests updated and passing

#### Files Created/Modified

```
lib/bmad-bridge.ts (new)
lib/bmad-bridge.test.ts (modified)
packages/types/index.ts (new)
packages/types/agent.ts (new)
packages/types/state.ts (new)
packages/types/deliverable.ts (new)
packages/types/phase.ts (new)
```

#### Acceptance Criteria

- [ ] All agent definitions load with proper types
- [ ] Dependency resolution is type-safe
- [ ] Context enrichment fully typed
- [ ] Shared types package importable from other modules

---

### Week 3: CLI Entry Points & Environment Utils

#### Tasks

**Day 1-2: Migrate assistant-env.js**

- [ ] Create `common/utils/assistant-env.ts`
- [ ] Define types for environment variables
- [ ] Type-safe environment variable resolution
- [ ] Add validation for required env vars
- [ ] Update all usages throughout codebase

**Day 3-5: Migrate CLI Entry Points**

- [ ] Create `bin/aidesigner.ts` (keep old as wrapper)
- [ ] Type CLI arguments and options
- [ ] Add Zod schema for CLI input validation
- [ ] Ensure backward compatibility
- [ ] Update tests for CLI

#### Deliverables

- ✅ All common utils migrated to TypeScript
- ✅ CLI entry points type-safe
- ✅ CLI functionality unchanged
- ✅ Tests passing

#### Files Created/Modified

```
common/utils/assistant-env.ts (new)
common/utils/assistant-env.test.ts (modified)
bin/aidesigner.ts (new)
bin/aidesigner (modified to call .ts version)
```

#### Acceptance Criteria

- [ ] CLI commands work exactly as before
- [ ] All environment variables typed
- [ ] Invalid CLI args caught at runtime with clear errors
- [ ] Documentation updated with TypeScript examples

---

### Week 4: Storage Abstraction & Input Validation

#### Tasks

**Day 1-2: Create Storage Adapter Interface**

- [ ] Design `StorageAdapter` interface
- [ ] Implement `FileSystemStorageAdapter`
- [ ] Implement `InMemoryStorageAdapter` (for testing)
- [ ] Update ProjectState to use adapters
- [ ] Add adapter tests

**Day 3-4: Comprehensive Zod Schemas**

- [ ] Create `lib/schemas/` directory
- [ ] Define schema for every data structure
- [ ] Add validation middleware
- [ ] Update all input points to validate
- [ ] Add schema tests

**Day 5: Integration & Testing**

- [ ] Integration tests for Phase 1 modules
- [ ] Performance testing (ensure no regression)
- [ ] Update all documentation
- [ ] PR review and merge

#### Deliverables

- ✅ Storage abstraction complete
- ✅ Zod schemas for all inputs
- ✅ Phase 1 integration tests passing
- ✅ Documentation updated

#### Files Created/Modified

```
lib/storage/adapter.ts (new)
lib/storage/filesystem-adapter.ts (new)
lib/storage/memory-adapter.ts (new)
lib/storage/adapter.test.ts (new)
lib/schemas/index.ts (new)
lib/schemas/*.ts (new - one per domain)
```

#### Acceptance Criteria

- [ ] Storage adapters swappable at runtime
- [ ] All external inputs validated with Zod
- [ ] Validation errors have clear messages
- [ ] Tests cover all storage adapter implementations
- [ ] Documentation includes adapter usage examples

---

## Phase 2: API Layer & Events (Weeks 5-7)

### Goal

Create HTTP API server with WebSocket support and event system for real-time updates.

### Week 5: API Server Foundation

#### Tasks

**Day 1-2: Express Server Setup**

- [ ] Create `packages/api-server/` directory
- [ ] Initialize Express.js with TypeScript
- [ ] Set up middleware (cors, body-parser, compression)
- [ ] Add logging middleware (Winston)
- [ ] Configure error handling middleware
- [ ] Add health check endpoints

**Day 3-4: Core API Endpoints**

- [ ] POST `/api/projects` - Create project
- [ ] GET `/api/projects/:id` - Get project
- [ ] GET `/api/projects/:id/state` - Get state
- [ ] PATCH `/api/projects/:id/state` - Update state
- [ ] Add request validation middleware
- [ ] Add tests for endpoints

**Day 5: API Documentation**

- [ ] Set up Swagger/OpenAPI
- [ ] Document all endpoints
- [ ] Generate Postman collection
- [ ] Create API usage guide

#### Deliverables

- ✅ Express server running on port 3000
- ✅ Core state management endpoints working
- ✅ API documentation auto-generated
- ✅ Postman collection for testing

#### Files Created/Modified

```
packages/api-server/src/index.ts (new)
packages/api-server/src/app.ts (new)
packages/api-server/src/middleware/ (new)
packages/api-server/src/routes/ (new)
packages/api-server/src/controllers/ (new)
packages/api-server/tsconfig.json (new)
packages/api-server/package.json (new)
docs/api-reference.md (new)
```

#### Acceptance Criteria

- [ ] Server starts without errors
- [ ] Health checks return 200 OK
- [ ] All endpoints return proper status codes
- [ ] CORS configured correctly
- [ ] Error responses follow standard format
- [ ] API docs accessible at `/docs`

---

### Week 6: Agent & Deliverable APIs

#### Tasks

**Day 1-2: Agent Management Endpoints**

- [ ] GET `/api/agents` - List all agents
- [ ] GET `/api/agents/:id` - Get agent details
- [ ] POST `/api/agents/:id/execute` - Execute agent command
- [ ] Add agent execution validation
- [ ] Add timeout handling
- [ ] Add tests

**Day 3-4: Deliverable Endpoints**

- [ ] POST `/api/projects/:id/deliverables` - Generate deliverable
- [ ] GET `/api/projects/:id/deliverables` - List deliverables
- [ ] GET `/api/projects/:id/deliverables/:type` - Get specific deliverable
- [ ] Add deliverable caching
- [ ] Add tests

**Day 5: Phase Management Endpoints**

- [ ] POST `/api/projects/:id/phase/detect` - Detect phase
- [ ] POST `/api/projects/:id/phase/transition` - Transition phase
- [ ] GET `/api/projects/:id/phase/history` - Get phase history
- [ ] Add transition validation
- [ ] Add tests

#### Deliverables

- ✅ All agent endpoints working
- ✅ All deliverable endpoints working
- ✅ Phase management endpoints working
- ✅ Comprehensive test coverage

#### Files Created/Modified

```
packages/api-server/src/routes/agents.ts (new)
packages/api-server/src/routes/deliverables.ts (new)
packages/api-server/src/routes/phase.ts (new)
packages/api-server/src/controllers/agents.controller.ts (new)
packages/api-server/src/controllers/deliverables.controller.ts (new)
packages/api-server/src/controllers/phase.controller.ts (new)
packages/api-server/src/services/ (new)
```

#### Acceptance Criteria

- [ ] All endpoints documented in Swagger
- [ ] Agent execution respects timeouts
- [ ] Deliverable generation is async
- [ ] Phase transitions validate prerequisites
- [ ] Error handling comprehensive

---

### Week 7: WebSocket & Event System

#### Tasks

**Day 1-2: Event Bus Implementation**

- [ ] Create typed EventBus class
- [ ] Define all event types
- [ ] Implement event persistence
- [ ] Add event filtering
- [ ] Add tests

**Day 2-3: WebSocket Server**

- [ ] Set up Socket.io server
- [ ] Implement authentication for WebSocket
- [ ] Connect event bus to WebSocket
- [ ] Add room management (per project)
- [ ] Handle disconnections gracefully
- [ ] Add tests

**Day 4: Conversation Endpoints**

- [ ] GET `/api/projects/:id/conversation` - Get messages
- [ ] POST `/api/projects/:id/conversation` - Add message
- [ ] WebSocket event for new messages
- [ ] Add tests

**Day 5: Decision & Review Endpoints**

- [ ] GET `/api/projects/:id/decisions` - Get decisions
- [ ] POST `/api/projects/:id/decisions` - Record decision
- [ ] GET `/api/projects/:id/reviews` - Get reviews
- [ ] Add WebSocket events
- [ ] Add tests

#### Deliverables

- ✅ Event bus broadcasting events
- ✅ WebSocket server connected to API
- ✅ All remaining endpoints implemented
- ✅ Real-time updates working

#### Files Created/Modified

```
packages/api-server/src/events/bus.ts (new)
packages/api-server/src/events/types.ts (new)
packages/api-server/src/websocket/server.ts (new)
packages/api-server/src/websocket/auth.ts (new)
packages/api-server/src/routes/conversation.ts (new)
packages/api-server/src/routes/decisions.ts (new)
```

#### Acceptance Criteria

- [ ] Events broadcast to all project clients <100ms
- [ ] WebSocket reconnection works automatically
- [ ] Event history queryable
- [ ] No duplicate events sent
- [ ] All event types documented

---

## Phase 3: Frontend Integration (Weeks 8-9)

### Goal

Connect web UI to real backend, remove all mock data, implement real-time updates.

### Week 8: API Client & State Management

#### Tasks

**Day 1-2: Create Typed API Client**

- [ ] Create `front-end/src/api/` directory
- [ ] Implement typed HTTP client (axios/fetch wrapper)
- [ ] Add automatic token injection
- [ ] Add retry logic
- [ ] Add request/response interceptors
- [ ] Generate TypeScript types from API

**Day 2-3: WebSocket Integration**

- [ ] Create WebSocket client wrapper
- [ ] Implement automatic reconnection
- [ ] Add event type safety
- [ ] Create React hooks for WebSocket events
- [ ] Add connection status indicator

**Day 3-4: TanStack Query Setup**

- [ ] Set up React Query provider
- [ ] Create query hooks for all endpoints
- [ ] Configure caching strategy
- [ ] Add optimistic updates
- [ ] Add loading/error states

**Day 5: Remove Mock Data**

- [ ] Delete `generateMockResponse()`
- [ ] Delete `generateMockToolCalls()`
- [ ] Delete `generateMockHTML()`
- [ ] Replace with API calls
- [ ] Update all components

#### Deliverables

- ✅ Typed API client working
- ✅ WebSocket client connected
- ✅ React Query configured
- ✅ Zero mock data in codebase

#### Files Created/Modified

```
front-end/src/api/client.ts (new)
front-end/src/api/websocket.ts (new)
front-end/src/api/types.ts (new - generated)
front-end/src/hooks/useWebSocket.ts (new)
front-end/src/hooks/useProject.ts (new)
front-end/src/hooks/useAgents.ts (new)
front-end/src/App.tsx (heavily modified)
```

#### Acceptance Criteria

- [ ] All API calls type-safe
- [ ] WebSocket connects on mount
- [ ] Reconnection works after disconnect
- [ ] Loading states show during requests
- [ ] Errors displayed to user
- [ ] No console errors

---

### Week 9: UI Integration & Polish

#### Tasks

**Day 1-2: Chat Interface Integration**

- [ ] Connect chat to real conversation API
- [ ] Implement real-time message updates via WebSocket
- [ ] Add message sending with validation
- [ ] Show tool calls from actual execution
- [ ] Display phase badges from real state
- [ ] Add error recovery

**Day 2-3: UI Preview Integration**

- [ ] Connect to real deliverable generation
- [ ] Display actual generated HTML
- [ ] Implement download functionality
- [ ] Show generation progress
- [ ] Handle errors gracefully

**Day 3-4: Tools Dashboard Integration**

- [ ] Display real project state
- [ ] Show actual MCP tools
- [ ] Add state inspection
- [ ] Implement refresh mechanism
- [ ] Add filtering/search

**Day 4-5: Error Handling & UX Polish**

- [ ] Add error boundaries
- [ ] Implement toast notifications
- [ ] Add loading skeletons
- [ ] Optimize performance
- [ ] Add keyboard shortcuts
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit

#### Deliverables

- ✅ All UI features working with real data
- ✅ Error handling comprehensive
- ✅ UX polished and responsive
- ✅ Accessibility standards met

#### Files Created/Modified

```
front-end/src/components/Chat.tsx (modified)
front-end/src/components/UIPreview.tsx (modified)
front-end/src/components/ToolsDashboard.tsx (modified)
front-end/src/components/ErrorBoundary.tsx (new)
front-end/src/components/Toast.tsx (new)
front-end/src/components/LoadingSkeleton.tsx (new)
```

#### Acceptance Criteria

- [ ] All features from prototype work with real backend
- [ ] No mock data anywhere
- [ ] Errors show user-friendly messages
- [ ] Loading states clear and consistent
- [ ] Works on mobile devices
- [ ] Passes WCAG 2.1 AA audit
- [ ] Performance metrics meet targets (LCP <2s, FID <100ms)

---

## Phase 4: Production Infrastructure (Week 10)

### Goal

Add monitoring, security, scalability features for production deployment.

### Week 10: Production Readiness

#### Tasks

**Day 1: Logging & Metrics**

- [ ] Add structured logging throughout
- [ ] Implement Prometheus metrics
- [ ] Add custom metrics for key operations
- [ ] Create Grafana dashboard
- [ ] Test metric collection

**Day 2: Tracing & Observability**

- [ ] Set up OpenTelemetry
- [ ] Add distributed tracing
- [ ] Connect to Jaeger
- [ ] Trace key workflows
- [ ] Test trace collection

**Day 3: Database Support**

- [ ] Create PostgreSQL schema
- [ ] Implement DatabaseStorageAdapter
- [ ] Add migration scripts
- [ ] Test data persistence
- [ ] Document database setup

**Day 4: Docker & Deployment**

- [ ] Create Dockerfiles for frontend/backend
- [ ] Create docker-compose.yml
- [ ] Add nginx configuration
- [ ] Set up Redis for caching
- [ ] Test full stack locally
- [ ] Document deployment process

**Day 5: Security & Final Testing**

- [ ] Implement JWT authentication
- [ ] Add rate limiting
- [ ] Security headers
- [ ] Run security scan (OWASP ZAP)
- [ ] Load testing (k6)
- [ ] End-to-end testing
- [ ] Final documentation
- [ ] Release preparation

#### Deliverables

- ✅ Monitoring stack operational
- ✅ Database support working
- ✅ Docker deployment tested
- ✅ Security features implemented
- ✅ All tests passing
- ✅ Documentation complete

#### Files Created/Modified

```
packages/api-server/src/observability/ (new)
packages/api-server/src/metrics/ (new)
lib/storage/database-adapter.ts (new)
migrations/ (new)
docker-compose.yml (new)
Dockerfile.api (new)
Dockerfile.frontend (new)
nginx.conf (new)
k6-load-test.js (new)
docs/deployment.md (new)
docs/monitoring.md (new)
```

#### Acceptance Criteria

- [ ] Metrics visible in Grafana
- [ ] Traces visible in Jaeger
- [ ] Database adapter passes all tests
- [ ] Docker compose starts full stack
- [ ] Security scan shows no critical issues
- [ ] Load test handles 100 concurrent users
- [ ] All documentation complete and reviewed
- [ ] Ready for production deployment

---

## Daily Workflow

### Morning (9:00 AM - 12:00 PM)

1. Check GitHub issues and PRs
2. Daily standup (if team)
3. Code implementation
4. Write tests alongside code
5. Run tests locally

### Afternoon (1:00 PM - 5:00 PM)

1. Continue implementation
2. Code review (give and receive)
3. Update documentation
4. Run full test suite
5. End-of-day commit

### Best Practices

- **Commit frequently**: At least 3-4 commits per day
- **Test everything**: Aim for >80% coverage
- **Document as you go**: Don't leave it for later
- **Ask for help**: Use Discord if blocked >30 minutes
- **Review daily**: Spend 30 minutes reviewing others' PRs

---

## Testing Strategy

### Unit Tests

- Every new function/class
- Test edge cases and error conditions
- Mock external dependencies
- Run with: `npm test`

### Integration Tests

- Test API endpoint combinations
- Test WebSocket flows
- Test phase transitions
- Run with: `npm run test:integration`

### E2E Tests

- Test complete user journeys
- Use Playwright or Cypress
- Run against real services
- Run with: `npm run test:e2e`

### Performance Tests

- Load test with k6
- Test at 50, 100, 200 concurrent users
- Monitor response times and error rates
- Run with: `npm run test:load`

### Security Tests

- Run OWASP ZAP scan
- Check dependencies for vulnerabilities
- Verify authentication flows
- Run with: `npm run test:security`

---

## Risk Management

### Risk Tracking Table

| Risk                            | Mitigation                          | Status     | Owner |
| ------------------------------- | ----------------------------------- | ---------- | ----- |
| TypeScript migration breaks CLI | Extensive testing, backward compat  | 🟡 Monitor | TBD   |
| API performance at scale        | Early load testing, caching         | 🟢 OK      | TBD   |
| WebSocket instability           | Fallback to polling, retry logic    | 🟢 OK      | TBD   |
| Database migration complexity   | Support dual mode, migration tools  | 🟡 Monitor | TBD   |
| Schedule slip in Phase 1        | Buffer time built in, parallel work | 🟢 OK      | TBD   |

Status Legend:

- 🟢 OK: Risk mitigated or low probability
- 🟡 Monitor: Actively watching
- 🔴 Critical: Needs immediate attention

---

## Progress Tracking

### Phase Completion Checklist

#### Phase 1: Foundation ✅

- [ ] TypeScript infrastructure
- [ ] project-state.ts migrated
- [ ] bmad-bridge.ts migrated
- [ ] Shared types package
- [ ] CLI entry points migrated
- [ ] Storage abstraction
- [ ] Zod schemas
- [ ] Tests passing (target: 250+)
- [ ] Documentation updated

#### Phase 2: API Layer ✅

- [ ] Express server running
- [ ] Core endpoints implemented
- [ ] Agent endpoints implemented
- [ ] Deliverable endpoints implemented
- [ ] Phase endpoints implemented
- [ ] WebSocket server working
- [ ] Event bus broadcasting
- [ ] API documentation complete
- [ ] Tests passing (target: 280+)

#### Phase 3: Frontend ✅

- [ ] API client implemented
- [ ] WebSocket client working
- [ ] React Query configured
- [ ] Mock data removed
- [ ] Chat interface integrated
- [ ] UI Preview integrated
- [ ] Tools Dashboard integrated
- [ ] Error handling complete
- [ ] Accessibility audit passed
- [ ] Tests passing (target: 300+)

#### Phase 4: Production ✅

- [ ] Logging implemented
- [ ] Metrics collecting
- [ ] Tracing working
- [ ] Database support added
- [ ] Docker images built
- [ ] Security hardening complete
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Ready for deployment

---

## Definition of Done

A task is considered "done" when:

1. ✅ Code is written and follows style guide
2. ✅ Tests are written and passing (unit + integration)
3. ✅ Code is reviewed and approved
4. ✅ Documentation is updated
5. ✅ Changes are merged to appropriate branch
6. ✅ CI/CD pipeline passes
7. ✅ Feature is manually tested
8. ✅ No regressions in existing functionality

---

## Tools & Resources

### Development Tools

- **IDE**: VS Code with TypeScript extensions
- **API Testing**: Postman, Insomnia
- **Database**: pgAdmin, DBeaver
- **Monitoring**: Grafana, Jaeger UI
- **Load Testing**: k6, Artillery
- **Security**: OWASP ZAP, npm audit

### Documentation

- **API Docs**: Generated from TypeScript/OpenAPI
- **Architecture**: Mermaid diagrams in markdown
- **Deployment**: Step-by-step guides
- **Troubleshooting**: Common issues and solutions

### Communication

- **GitHub Issues**: Feature requests, bugs
- **GitHub Projects**: Kanban board for tracking
- **Discord**: Real-time discussions
- **PR Reviews**: Code review feedback

---

## Next Steps

After Phase 4 completion:

1. **Beta Testing**: Invite 10-20 users to test
2. **Feedback Collection**: Gather user feedback
3. **Bug Fixes**: Address critical issues
4. **Performance Tuning**: Optimize based on real usage
5. **Public Launch**: Announce on Discord, Twitter, etc.
6. **Ongoing Support**: Monitor production, fix issues

---

## Version History

| Version | Date       | Author         | Changes                     |
| ------- | ---------- | -------------- | --------------------------- |
| 1.0     | 2025-10-14 | Loic Baconnier | Initial implementation plan |
