---
title: 'Persona Simulation: Startup Founder Using AiDesigner'
description: 'End-to-end walkthrough of a representative user chatting with AiDesigner from idea discovery to UI prompts and maquette.'
date: 2024-05-05
---

# Persona Simulation: Startup Founder Using AiDesigner

This document simulates a full AiDesigner session for a representative persona. It follows the journey from the initial idea through the Conversational UI Designer phase and into implementation planning, highlighting how each orchestrated agent contributes to a consistent outcome.

## Persona Snapshot

| Attribute        | Details                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Name             | Maya Chen                                                                                             |
| Role             | Founding Product Lead at a B2B SaaS startup                                                           |
| Product Vision   | An **AI-driven onboarding cockpit** that helps customer success teams welcome new enterprise accounts |
| Constraints      | Needs a polished MVP in four weeks, wants a dark theme inspired by Linear.app                         |
| Success Criteria | Interactive dashboard, token consistency for rapid iteration, developer-ready outputs                 |

## Journey Overview

1. **Phase Detection** identifies the conversation start and routes to the discovery lane.
2. **Discovery Agent** captures goals, personas, and success metrics.
3. **UI Designer Agent** extracts inspiration tokens, iterates on layout decisions, and produces Gemini prompts.
4. **Design System Agent** locks tokens and validates component usage.
5. **Implementation Planner** generates PRD highlights, architecture notes, and agile stories.

Each section below contains simulated chat excerpts plus analysis of the orchestration.

## Phase 1: Idea & Discovery

### Transcript Excerpt

> **AiDesigner (Invisible Orchestrator):** "Welcome! What are we designing today?"
>
> **Maya:** "A cockpit for customer success teams onboarding enterprise clients."
>
> **AiDesigner:** "Who will use it most, and what should success look like?"
>
> **Maya:** "CS managers tracking onboarding milestones. Success means they can see blockers instantly and keep stakeholders aligned."
>
> **AiDesigner:** "Noted. Any hard constraints or inspirations?"
>
> **Maya:** "Dark UI similar to Linear. Needs to surface timeline, task ownership, and health score."

### Orchestrator Analysis

- **Phase Detector** confirms "Idea & Discovery" because Maya introduces problem, users, and constraints.
- **Discovery Agent** captures: primary persona (CS manager), critical data (timeline, ownership, health score), and inspiration (Linear).
- **Output Validation** ensures responses are structured for downstream agents (personas, journeys, success metrics).

### Discovery Deliverable Snapshot

- **User Persona:** Customer success manager overseeing 8-10 enterprise onboardings simultaneously.
- **Primary Journey:** Track onboarding progress, resolve blockers, communicate status.
- **Success Metrics:** Time-to-value under 30 days, zero onboarding gaps, proactive alerting.

## Phase 2: Conversational UI Design

### Token Extraction Dialogue

> **Ui Designer Agent:** "I'll pull tokens from Linear.app via the Chrome MCP integration. Ready?"
>
> **Maya:** "Yes, let's use Linear as the base."
>
> **Ui Designer Agent:** "Extracted tokens: Primary #5E6AD2, Accent #3D9970, Background #0F1117, Typography Inter 400/600, Spacing scale 4/8/12/16/24. Keep or adjust?"
>
> **Maya:** "Keep colors and typography. Increase spacing scale with 32 for cards."

### Layout Exploration

> **Ui Designer Agent:** "For the main cockpit, I suggest: left navigation, top summary, central timeline, right insights. Thoughts?"
>
> **Maya:** "Add quick actions row under the summary for assigning owners."
>
> **Ui Designer Agent:** "Adding quick actions with pill buttons using accent color."

### Gemini Prompt Output

```
You are generating a high-fidelity dark UI concept for an "AI onboarding cockpit" web app.

Context:
- Audience: Customer success managers onboarding enterprise accounts.
- Must feel like Linear.app: dark background #0F1117, primary #5E6AD2, accent #3D9970.
- Typography: Inter font, weights 400 and 600.
- Spacing scale: 4, 8, 12, 16, 24, 32.

Screen requirements:
1. Left vertical navigation with sections: Overview, Active Onboardings, Playbooks, Health Alerts.
2. Top header containing account name, onboarding stage chip, and "Assign Owner" pill action.
3. Main panel with a horizontal milestone timeline (cards show phase name, owner avatar, completion %).
4. Secondary panel on the right with "Health Score", "Risk Flags", and "Upcoming Meetings" stacked cards.
5. Quick actions row beneath the header offering "Create Task", "Send Update", "Request Docs".

Tone: Sleek, minimal, high contrast. Include subtle glowing accents on active elements.
```

### Process Check

- **Design System Agent** updates spacing scale to include 32 and confirms accessibility contrast for the accent color on dark background.
- **Visual Prompt Generator** packages a context-rich Gemini brief, referencing tokens and layout decisions.
- **Validation Hooks** ensure each screen requirement maps to a later component for development.

## Maquette Summary

The Conversational UI Designer outputs a structured maquette for developers and designers:

| Region          | Components                                                           | Notes                                              |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| Left Navigation | Vertical nav bar with section icons, active state using primary glow | Width 240px, collapsed icons at <1280px            |
| Header          | Account name (Inter 600, 20px), stage chip, quick action pills       | Chip uses accent background, white text            |
| Quick Actions   | Three pill buttons with icon + label                                 | Hover state lightens to #49B486                    |
| Timeline Panel  | Horizontal stepper with cards (Inter 400 body, 600 headings)         | Progress bars use primary color, cards spaced 24px |
| Insights Panel  | Stack of cards for Health Score, Risk Flags, Upcoming Meetings       | Each card has 16px padding, subtle border #1C2030  |

The maquette directly references the token set and layout specs, enabling rapid component mapping.

## Phase 3: Implementation Planning

### Transcript Excerpt

> **AiDesigner (Implementation Planner):** "Generating PRD highlights and story skeletons based on the locked design."
>
> **Planner:** "Story AISD-101: Build onboarding timeline component using design tokens. Includes acceptance criteria for progress bar, owner avatars, and milestone states."
>
> **Planner:** "Architecture note: Use Shadcn Timeline and Card primitives, theme with provided tokens, ensure data fetch from onboarding API v2."

### Validation Summary

- **PRD Generator** references discovery goals and design decisions, confirming no context loss.
- **Story Writer** maps UI regions to backlog items with acceptance criteria tied to tokens.
- **Architecture Agent** aligns Shadcn components with the maquette, flagging need for timeline data contract.

## Interaction Quality Assessment

| Process           | Evaluation                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Discovery         | Collected clear persona, journey, and success metrics in under five turns.                                          |
| UI Design         | Balanced token reuse with customization, ensuring alignment with Linear inspiration while meeting new requirements. |
| Prompt Generation | Produced a detailed Gemini prompt embedding context, tokens, and layout constraints.                                |
| Maquette          | Expressed as structured regions that translate directly to design handoff and story creation.                       |
| Implementation    | Generated actionable stories and architectural notes tied to the locked design tokens.                              |

## Key Takeaways

- The **zero-knowledge interface** let Maya speak naturally while the orchestrator routed requests to specialized agents without manual handoffs.
- **Design decisions remained consistent** across phases because tokens and layout specs fed downstream outputs automatically.
- The generated **Gemini prompt** and **maquette** provide everything needed for a visual exploration and development sprint kick-off, demonstrating end-to-end continuity.

This simulation confirms the workflow operates as intended for a core persona: from idea to UI design prompts to implementation planning without losing fidelity.
