---

# commands/auto-stories.md

command:
name: auto-stories
description: Break work into epics and user stories with acceptance criteria, invisibly
usage: Triggered after a technical direction exists or when the user asks “what exactly should we build next?”

inputs_expected:

- Problem summary
- Goals and success metrics
- Constraints and chosen approach (if any)

execution:

- Produce a compact backlog:
  - Epics (2–7)
  - User stories under each epic using the “As a / I want / So that” format
  - Acceptance criteria per story (bullet points)
- Prioritize (MoSCoW or RICE)
- Define an initial sprint slice (1–2 weeks worth)
- Identify dependencies and risks
- Keep all methodology terms invisible to the user in the final message

output_to_user:

- Plain-language “next steps” and a short prioritized list of stories
- Offer to export the backlog (CSV/JSON) if asked
