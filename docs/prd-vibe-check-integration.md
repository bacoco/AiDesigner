---
title: 'Vibe Check Safety Gate PRD'
description: 'Product requirements for enforcing the Vibe Check MCP server across AiDesigner agent workflows.'
status: 'Draft'
author: 'AI Product Team'
revision: '0.1'
---

# Vibe Check Safety Gate PRD

## 1. Executive Summary

AiDesigner must apply tone and safety review to all marketing- and product-facing copy before downstream agents act on it. The published `vibe-check-mcp-server` already exists in configuration, but the orchestrator does not call it. This PRD establishes the product requirements to: (1) integrate the Vibe Check MCP as a blocking gate in relevant workflows, (2) expose the review signal to agents and operators, and (3) provide controls for tuning thresholds and bypass policies.

## 2. Goals & Non-Goals

### Goals

- Enforce an automated tone review on product briefs, PRDs, and storytelling copy before architecture and implementation agents proceed.
- Surface Vibe Check outcomes (score, verdict, suggestions) in the AiDesigner project record so humans and agents can react.
- Fail fast when Vibe Check is misconfigured or produces a failing verdict, prompting credential fixes or copy edits.
- Provide administrators with environment flags for tuning score thresholds and temporary overrides.

### Non-Goals

- Replacing manual editorial review or QA conversations.
- Generating new copy; Vibe Check only evaluates content produced elsewhere.
- Building a standalone user interface for Vibe Check—visibility occurs through existing logs and project artifacts.

## 3. User Stories

1. **As a PM agent**, I need my generated PRD to be tone-checked so the architecture lane never consumes misaligned language.
2. **As a safety reviewer**, I want the orchestrator to block continuation if Vibe Check scores are below policy so I can revise the copy.
3. **As an operator**, I need configuration knobs to disable the gate (with audit logs) during outages without editing code.
4. **As downstream agents (architect, SM, dev)**, I want access to the last Vibe Check verdict so I can reference the feedback while planning implementation.

## 4. Functional Requirements

| ID  | Requirement                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR1 | The orchestrator must call the `vibe_check` tool after the PM phase produces a PRD or comparable copy artifact.                                             |
| FR2 | If the Vibe Check score falls below a configurable threshold or the verdict is `negative`, the workflow must fail with an actionable error.                 |
| FR3 | Successful calls must log score, verdict, and suggestions to the project decision register and structured logger.                                           |
| FR4 | Provide environment toggles to disable the gate (`AIDESIGNER_VIBE_CHECK_ENABLED=false`) and to configure minimum score (`AIDESIGNER_VIBE_CHECK_MIN_SCORE`). |
| FR5 | When credentials are missing or the server is unreachable, raise a blocking error that instructs operators to configure the MCP server.                     |
| FR6 | Persist Vibe Check metadata so downstream agents can inspect the result even after the workflow completes.                                                  |

## 5. Non-Functional Requirements

- **Reliability**: Propagate descriptive errors when the MCP server cannot be reached or returns malformed payloads.
- **Security**: Never log API keys; read them from the environment and redact outputs to score/verdict/suggestions.
- **Observability**: Emit structured logs for call start, completion, latency, and outcome.
- **Extensibility**: Allow injection of a mock client for automated tests to keep MCP integration deterministic.

## 6. Acceptance Criteria

1. Running the complex lane workflow triggers a Vibe Check call immediately after the PM phase. The workflow proceeds only if the gate passes.
2. When the MCP server returns a failing verdict or low score, the orchestrator stops and surfaces suggestions in the error message.
3. The project state records a decision such as `vibe_check` with verdict and score.
4. Configuration flags enable bypassing or tightening the gate without code changes.
5. Automated tests cover pass/fail scenarios for the gate with mocked MCP responses.

## 7. Launch Plan

1. **Development** – Implement orchestrator integration, logging, and configuration flags. Ship automated tests.
2. **Verification** – Run MCP inspector to confirm tool availability. Exercise workflows with sample copy to validate block/pass behavior.
3. **Rollout** – Enable the gate by default in staging, confirm environment variables are set, then deploy to production.
4. **Monitoring** – Track structured log events `vibe_check_pass` / `vibe_check_fail` and monitor failure counts for regressions.
5. **Docs & Enablement** – Update operator guides with configuration steps and troubleshooting tips for Vibe Check MCP.

## 8. Open Questions

- Should Vibe Check run on additional artifacts (e.g., epic descriptions, story drafts) before developer execution? Initial scope limits to PRD-level copy; future iterations may expand coverage.
- Do enterprise tenants require separate thresholds or allowlists for verdict levels? Configuration hooks exist but policy segmentation is deferred.
- What is the retry policy if Vibe Check fails due to transient errors? Current plan is fail-fast with operator retry; a future enhancement could introduce automatic retries with backoff.

---

_Version 0.1 — Draft prepared to unblock implementation work integrating the Vibe Check MCP server._
