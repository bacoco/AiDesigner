# Phase 4 – API & Remote Publishing Tasks (Optional)

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- **OPTIONAL**: Expose server-side services to manage Skill publishing via Anthropic APIs for users who opt in.
- Support long-running operations with reliable status reporting.

## Dependencies

- **Upstream**: Phase 2 and Phase 3 (requires local authoring pipeline and CLI commands)
- **Downstream**: Phase 5 (optional - for remote publishing after workflow completion)

## Privacy & Local-First Note

**This phase is completely optional.** Core Skill functionality (Phases 0-3, 5-7) operates entirely locally with no external API calls, maintaining AiDesigner's local-first commitment (README.md lines 132-136). Phase 4 is for users who want to publish Skills to Anthropic's remote catalog and requires explicit opt-in.

## Task List

- [ ] Implement a `SkillService` module in `packages/api-server` responsible for rendering Skill bundles, validating payloads, and invoking Anthropic's `/v1/skills` endpoints. Reference: [Anthropic Skills API Documentation](https://docs.anthropic.com/en/api/skills)
- [ ] Add configuration for Anthropic credentials (API keys, workspace IDs) following existing secure credential storage patterns in the codebase. Environment variable support: `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`.
- [ ] Create REST endpoints (e.g., `POST /skills/publish`, `GET /skills`, `POST /skills/validate`) along with request/response schemas and OpenAPI documentation.
- [ ] Integrate background job processing (queue or worker) to handle asset uploads and status polling with retry logic.
- [ ] Implement structured logging and error handling that surfaces actionable messages to clients and operations dashboards.
- [ ] Write integration tests using mocked Anthropic APIs to validate happy paths, error conditions, and retry behavior.
- [ ] Document operational runbooks covering credential setup, rate limits, and troubleshooting steps.

## Deliverables

- Server release including new Skill service, routes, and background job workers (all optional components).
- API documentation and operational runbooks published to `docs/api/skills-publishing.md`.
- Credential management documentation following existing patterns.

## Credential Management

- API keys stored using existing secure credential patterns in the codebase
- Encryption at rest for sensitive credentials
- Rotation guidance and best practices documentation
- Clear user communication that credentials are only needed for optional remote publishing
- Local Skills work without any Anthropic API credentials

## File Locations

- **Skill Service**: `packages/api-server/src/services/skill-service.ts`
- **REST Routes**: `packages/api-server/src/routes/skills.ts`
- **API Documentation**: `docs/api/skills-publishing.md`
- **Operational Runbooks**: `docs/operations/skills-publishing-runbook.md`
