# End-to-End Persona Simulation

This document simulates a single user persona interacting with the aidesigner orchestrator from the moment an idea forms through UI delivery. It illustrates how the invisible orchestrator, planning agents, and builder agents collaborate to produce validated outputs.

## Persona Overview

- **Name**: Maya Chen
- **Role**: Senior Product Manager at a mid-size telehealth startup
- **Goal**: Launch a companion mobile experience that increases patient adherence to post-surgery recovery plans
- **Success Criteria**:
  - Patients receive daily recovery nudges tailored to their procedures
  - Surgeons gain visibility into patient adherence metrics within two weeks of discharge
  - The first pilot cohort of 50 patients reports a 20% increase in checklist completion rates
- **Constraints**:
  - Pilot launch must be ready in 6 weeks
  - Existing backend is a FHIR-compliant API with OAuth2
  - Design language must align with the company’s blue/teal brand palette

## Simulation Timeline

1. Idea articulation inside the invisible orchestrator
2. Phase detection and workflow branching
3. Planner agent decomposition
4. Builder agent delivery
5. Gemini prompt preparation for the UI team
6. Maquette handoff and validation

Each step below captures representative dialog and the behind-the-scenes reasoning steps.

## 1. Idea Articulation

**User (Maya)**: "I need an app that helps post-surgery patients keep up with their recovery plan and lets surgeons monitor progress. We already have a FHIR backend and need something mobile-first in six weeks."

**Invisible Orchestrator**:

- Captures context (domain, timeline, technical constraint)
- Triggers phase detector with the collected statements
- Confirms understanding: "Target users are post-surgery patients and surgeons. Success means adherence nudges and monitoring. Platform preference is mobile-first with an existing FHIR backend. Did I capture that correctly?"

**User**: "Yes, that’s right."

At this point, the orchestrator creates a structured brief and hands it to the phase detector.

## 2. Phase Detection

**Phase Detector Output**:

- Phase: **Vision & Requirements** (high certainty because the user expressed outcomes, constraints, and audience)
- Recommended next step: Activate Product Planner agent for requirement elaboration

The orchestrator validates the phase and transitions to the planner.

## 3. Planner Agent Decomposition

**Planner Prompt (internal)**:

```
Inputs:
- Persona: Maya Chen, Senior Product Manager
- Goal: Recovery adherence mobile companion
- Constraints: FHIR API, six-week timeline, blue/teal branding
Outputs Required:
- Product requirements summary
- Breakdown into epics and stories
- Risk and mitigation assessment
```

**Planner Response**:

- Produces a concise PRD including user stories, metrics, and definition of done
- Generates three epics (Patient Engagement, Clinician Visibility, Infrastructure Integration)
- Annotates each story with acceptance criteria and dependencies (e.g., OAuth2 hooks into the existing identity provider)

**Orchestrator Action**:

- Displays the planner’s summary to Maya
- Asks for confirmation before moving to build support: "Ready to translate this into implementation guidance?"

**User**: "Yes, proceed."

## 4. Builder Agent Delivery

**Phase Detector** now signals a transition to **Solution Design**.

**Builder Prompt (internal)**:

```
Context: Mobile-first recovery adherence companion
Requirements: Daily nudges, surgeon dashboard, FHIR integration, six-week pilot
Deliverables:
- Recommended stack and architecture
- Key implementation milestones for a two-sprint plan
- API integration checklist
```

**Builder Response**:

- Stack: React Native app, Next.js admin portal, Node.js integration service bridging to FHIR API
- Sprint Outline:
  - **Sprint 1**: Authentication flow, patient daily checklist, notification service
  - **Sprint 2**: Surgeon dashboard, analytics ingestion, pilot instrumentation
- Integration Checklist: OAuth2 scopes, FHIR Observation and CarePlan mapping, sandbox test data preparation

**Verification Loop**:

- Orchestrator summarizes outputs and performs a consistency check against the planner stories (ensures every epic has at least one mapped milestone)
- Raises a clarification question: "Do you need multi-language support in the pilot?"
- **User**: "Not for the pilot."
- Orchestrator stores the decision and updates the requirements log.

## 5. Gemini Prompt for UI Generation

After technical alignment, Maya requests a UI exploration. The orchestrator assembles a high-fidelity prompt tailored for Gemini.

**Prompt Title**: "Recovery Companion App UI Concepts"

**Prompt Body**:

```
Design a mobile-first interface for a post-surgery recovery companion. The app must:
- Welcome patients with a calming blue/teal palette aligned with modern telehealth aesthetics
- Show today’s recovery checklist with completion toggles and pain-level slider
- Provide a medication reminder module with snooze options
- Display a subtle progress arc indicating adherence for the past 7 days
- Include an emergency contact button visible but not dominant
- Offer a clinician note section locked until a surgeon leaves feedback
Accessibility requirements:
- Minimum 16pt body text, 44px touch targets
- High contrast mode variation for low-vision patients
Output:
- Three distinct screen concepts (home, checklist detail, surgeon overview)
- UI component annotations for handoff to React Native
```

The prompt is delivered to Maya as a copy-ready block for Gemini, ensuring no internal metadata leaks.

## 6. Maquette and Validation

Using Gemini’s generated screens, the orchestrator guides Maya through creating a maquette brief for the design team.

**Maquette Outline**:

- **Screen 1: Patient Home**
  - Hero banner with progress arc, calm gradient background
  - "Today’s Focus" card listing top three tasks with toggle buttons
  - Medication module with snooze chip controls
- **Screen 2: Checklist Detail**
  - Timeline view of recovery milestones
  - Embedded pain-level slider with emoji scale
  - Notes section for patient reflections
- **Screen 3: Surgeon Overview (Web Dashboard)**
  - Patient roster table with adherence percentage badges
  - Drill-down panel showing recent observations synced from FHIR
  - Alert feed for patients below 60% adherence

**Validation Checklist**:

1. Requirements traceability confirmed (each epic has supporting UI touchpoints)
2. Accessibility guidelines addressed (contrast, touch targets)
3. Integration alignment verified with FHIR Observation and CarePlan data models
4. Timeline feasibility rechecked against six-week pilot plan

The orchestrator marks the workflow complete and archives the session.

## Outcome Summary

- Maya leaves with a vetted product plan, implementation roadmap, Gemini-ready UI prompt, and maquette outline.
- The process demonstrates seamless orchestration between ideation, planning, and design preparation without exposing internal agent complexity.
- All checkpoints confirm the experience works as intended for this persona.
