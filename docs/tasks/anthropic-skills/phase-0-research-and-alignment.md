# Phase 0 – Research & Alignment Tasks

**Master Plan Reference**: [Anthropic Skills Integration Plan](../../plans/anthropic-skills-integration.md)

## Objectives

- Establish a shared understanding of Anthropic Skill requirements.
- Identify which AiDesigner assets are best suited for conversion into Skills.

## Dependencies

- **Upstream**: None (foundation phase)
- **Downstream**: Phase 1 (domain modeling), Phase 6 (seed library selection)

## Task List

- [ ] Compile canonical references for Anthropic Skills, including folder structure, `SKILL.md` frontmatter schema, progressive disclosure guidelines, and executable asset constraints. Reference: [Anthropic Skills Documentation](https://docs.anthropic.com/en/docs/build-with-claude/skills)
- [ ] Map current AiDesigner asset types (agents in `aidesigner-core/agents/`, tasks in `aidesigner-core/tasks/`, templates in `aidesigner-core/templates/`, checklists in `aidesigner-core/checklists/`) to prospective Skill folder sections and note any gaps.
- [ ] Interview core maintainers to validate assumptions about high-value workflows and capture undocumented institutional knowledge.
- [ ] Produce a comparison matrix that highlights how existing tooling can feed the Skill pipeline and where new adapters are required.
- [ ] Prioritize candidate Skills (e.g., Discovery Journey, Architecture QA, UI Design System Adherence) with rough impact vs. effort scoring to inform Phase 6 seeding.

## Deliverables

- Research brief summarizing Anthropic requirements and implications for AiDesigner architecture (saved to `docs/research/anthropic-skills-requirements.md`).
- Candidate Skill catalog with prioritization notes and impact/effort matrix (saved to `docs/research/candidate-skills-catalog.md`).

## Key Questions to Answer

- Which AiDesigner workflows have the highest reuse potential as Skills?
- How do Anthropic's progressive disclosure guidelines map to AiDesigner's existing agent structures?
- What asset types (markdown, YAML, executables) are supported in Skills?
- How do Skills integrate with Claude CLI, Claude Code, and Claude desktop apps?
