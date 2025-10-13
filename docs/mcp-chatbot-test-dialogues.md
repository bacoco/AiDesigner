# MCP Chatbot Test Dialogues (AiDesigner Edition)

**Version**: 1.0.0
**Compatible with**: AiDesigner v1.3.x+
**Last Updated**: 2025-01-13

These scripts simulate how a non-technical product owner chats with AiDesigner to co-create a high-quality UI. Every user prompt
is written in plain language so a complete beginner can paste it straight into the chat UI. Behind the scenes, the assistant must
still exercise AiDesigner’s full MCP toolchain—personas, guardrails, documentation, workflow runs, quality gates, and integration
checks—while narrating its plan back to the user before each action.

After each dialogue, confirm the assistant produced the narrated MCP traces listed under **Expected MCP Usage**. Run the scripts in
order to cover the full end-to-end process from context refresh through polished HTML concepts.

## Prerequisites

Before running these test dialogues:
1. AiDesigner must be installed: `npx aidesigner install`
2. MCP server must be running: `npm run mcp`
3. Project must be initialized with AiDesigner
4. Verify MCP health: `npm run mcp:doctor`

## 1. Wake Up the Project Memory

- **Objective:** Make sure the assistant refreshes AiDesigner’s knowledge about the current UI project before suggesting anything.
- **User Prompts:**
  1. "Hey, I’m lost. In simple words, explain how you’ll catch up on our existing UI project before you touch anything."
  2. "That sounds reassuring—go ahead and do your catch-up now, then double-check our design frameworks so we’re on the same page."
- **Expected MCP Usage:** `get_project_context` followed by `scan_codebase`.

## 2. Bring in the Friendly Design Specialist

- **Objective:** Verify the assistant consults the architecture/design specialist agent while narrating the switch in human terms.
- **User Prompts:**
  1. "Before you call any expert, can you tell me in plain language which design specialist you’ll invite and why they’re right for me?"
  2. "Cool, invite that specialist now and afterwards let me know when you’re back in the usual builder mode so I’m not confused."
- **Expected MCP Usage:** `load_agent_persona` (`phase = "architect"`) then `transition_phase` (`toPhase = "dev"`).

## 3. Switch On the Training Wheels

- **Objective:** Ensure the assistant configures developer guardrails so no unsafe design stories slip through.
- **User Prompts:**
  1. "I don’t know tech stuff—tell me how you’ll turn on your safety checks for the stories we’ll talk about, and wait for me to agree."
  2. "Green light. Flip those safety checks on and immediately run them so I can hear what they find."
- **Expected MCP Usage:** `configure_developer_lane` followed by `run_story_context_validation`.

## 4. Log What We Just Decided

- **Objective:** Confirm that conversations about the UI are logged and summarized for future phases without confusing the user.
- **User Prompts:**
  1. "Can you explain, like I’m five, how you’ll note that we want a fresh onboarding screen for mobile shoppers?"
  2. "Great, jot that down now and then give me a quick, friendly recap of the project so far so I know you stored it."
- **Expected MCP Usage:** `add_conversation_message` followed by `get_project_summary`.

## 5. Gather References and Write the Plan

- **Objective:** Validate that AiDesigner generates the planning documents needed for UI exploration while describing the steps simply.
- **User Prompts:**
  1. "Talk me through, in normal words, how you’ll collect inspirations and write the plan before touching any pixels."
  2. "Okay, do that now: first draft the plan for our Quick Designer onboarding screen, then make the matching architecture notes."
- **Expected MCP Usage:** `generate_deliverable` (`type = "prd"`) then `generate_deliverable` (`type = "architecture"`).

## 6. Choose the Build Lane and Run It

- **Objective:** Check that the assistant selects the right development lane and executes the end-to-end workflow that produces HTML options.
- **User Prompts:**
  1. "Please describe how you’ll pick the right build path to get three UI mockups for our onboarding flow, using words I can grasp."
  2. "Sounds good—go choose that path now, tell me which one you grabbed, and run your full build so we get those mockups to review."
- **Expected MCP Usage:** `select_development_lane` followed by `execute_workflow`.

## 7. Double-Check the Quality Gate

- **Objective:** Ensure the assistant runs quality checks on the generated UI concepts and explains any reruns in friendly language.
- **User Prompts:**
  1. "Before you check quality, explain how that review works in plain speech so I know what you’re about to judge."
  2. "Go ahead and run it. If the check complains, run it again after telling me what was missing so I don’t freak out."
- **Expected MCP Usage:** `run_review_checkpoint` (initial pass) then `run_review_checkpoint` again with notes if issues arise.

## 8. Confirm the Tech Behind the Curtain

- **Objective:** Finish by confirming all MCP integrations are healthy, reassuring the user that nothing broke before presenting the three HTML options.
- **User Prompts:**
  1. "Last thing: can you explain how you’ll make sure all your behind-the-scenes helpers are awake before you show me the final choices?"
  2. "Great, run that check now, tell me which helpers need love, and then summarize the three HTML options so I can pick one."
- **Expected MCP Usage:** `list_mcp_servers` followed by `get_mcp_health`.

Use each dialogue sequentially within the chatbot UI. A successful test will show narrated MCP tool calls that align with the expected usage while guiding even the most non-technical user toward choosing a polished UI concept.

## Troubleshooting

### MCP Tool Not Found
If the assistant reports a tool is unavailable:
1. Check MCP server status: `npm run mcp:doctor`
2. Verify aidesigner version: `npx aidesigner --version`
3. Restart the MCP server: `npm run mcp`

### Unexpected Responses
If dialogue responses don't match expectations:
1. Review the MCP trace logs
2. Ensure project has required documentation
3. Check for configuration issues in `.aidesigner/config.json`

### Quality Check Failures
If Dialogue 7 repeatedly fails quality checks:
1. Verify all planning documents are generated (PRD, architecture)
2. Check that the selected development lane matches project requirements
3. Review workflow execution logs for errors
