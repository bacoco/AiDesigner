# Quick Designer v4 - Acceptance Criteria

## Core Requirements

### 1. No External LLM Calls Constraint

- ✅ **MUST** work without any external LLM API calls by default
- ✅ **MUST** use pattern-remix approach for HTML generation
- ✅ **MUST** pass all tests with LLM calls disabled
- ✅ **MAY** optionally use LLM when explicitly enabled

### 2. Distinct Layout Variations

- ✅ **MUST** generate minimum 3 distinct variations per screen type
- ✅ **MUST** ensure each variation has unique layout structure
- ✅ **MUST NOT** produce identical templates with only color changes
- ✅ **MUST** support additional variation generation on demand

### 3. Live Design System Editor

- ✅ **MUST** provide real-time design system controls
- ✅ **MUST** update all variations when design tokens change
- ✅ **MUST** persist design system across pages
- ✅ **MUST** allow validation of specific variations

### 4. State Progression

- ✅ **MUST** maintain conversation context across tool invocations
- ✅ **MUST** persist design workflow state
- ✅ **MUST** support refinement of previously generated screens
- ✅ **MUST** track validated variations

## Command Surface Requirements

### Flash Agent Commands

All commands must be prefixed with `*` when used:

1. **`*instant`**
   - ✅ Generate screen instantly from user request
   - ✅ Extract screen type automatically
   - ✅ Generate 3 variations minimum
   - ✅ Create/update mockup HTML file
   - ✅ Support reference URL extraction

2. **`*refine`**
   - ✅ Refine last generated screen
   - ✅ Apply design adjustments
   - ✅ Generate additional variations
   - ✅ Update mockup with changes

3. **`*validate`**
   - ✅ Mark specific variation as validated
   - ✅ Update design system with validated specs
   - ✅ Persist validation state

4. **`*show-system`**
   - ✅ Display current design system
   - ✅ Show generation statistics
   - ✅ List all generated pages

5. **`*open-mockup`**
   - ✅ Return mockup file path
   - ✅ Trigger browser opening (when integrated)

## Technical Integration

### MCP Server Integration

- ✅ **MUST** register as `quick-designer-v4` MCP server
- ✅ **MUST** expose all Flash commands as MCP tools
- ✅ **MUST** integrate with existing aidesigner orchestrator
- ✅ **MUST** work with Chrome MCP for design extraction

### Build & Packaging

- ✅ **MUST** compile with `npm run build:mcp`
- ✅ **MUST** include all runtime dependencies
- ✅ **MUST** register in MCP configuration
- ✅ **MUST** support Claude CLI launcher

### Persistence & Storage

- ✅ **MUST** persist design system across sessions
- ✅ **MUST** save mockup to `docs/ui/mockup.html`
- ✅ **MUST** maintain session state
- ✅ **MUST** support workflow recovery

## Output Requirements

### Generated HTML

- ✅ **MUST** be self-contained (inline styles)
- ✅ **MUST** use CSS variables for theming
- ✅ **MUST** be responsive
- ✅ **MUST** include semantic HTML5
- ✅ **MUST** use French UI labels

### Interactive Mockup

- ✅ **MUST** include design system editor sidebar
- ✅ **MUST** support tab navigation between pages
- ✅ **MUST** show all variations in grid layout
- ✅ **MUST** update in real-time with design changes
- ✅ **MUST** highlight validated variations

### Export Formats

- ✅ **MUST** export HTML files
- ✅ **MUST** export design system JSON
- ✅ **MAY** export React components
- ✅ **MAY** export token definitions

## Quality Gates

### Testing

- ✅ **MUST** pass pattern-remix test without LLM
- ✅ **MUST** generate valid HTML
- ✅ **MUST** maintain design consistency
- ✅ **MUST** handle error cases gracefully

### Performance

- ✅ **MUST** generate variations in < 2 seconds
- ✅ **MUST** update mockup in < 1 second
- ✅ **MUST** handle 10+ pages without degradation

### Documentation

- ✅ **MUST** document architecture
- ✅ **MUST** provide integration guide
- ✅ **MUST** include usage examples
- ✅ **MUST** maintain changelog

## Success Metrics

### User Experience

- Zero-friction generation process
- Minimal questions (0-2 max)
- Instant visual feedback
- Coherent multi-page design system

### Technical Excellence

- 100% pattern-based generation success
- Zero external dependencies for core features
- Full Claude CLI integration
- Seamless Chrome MCP integration

## Validation Checklist

### Phase 1 - Runtime Foundation

- [ ] Pattern library implemented
- [ ] Design system persistence working
- [ ] Multi-variation generation functional
- [ ] Chrome MCP adapters ready

### Phase 2 - Integration

- [ ] Flash commands operational
- [ ] Session management working
- [ ] Mockup generation functional
- [ ] Design refinement working

### Phase 3 - Packaging

- [ ] MCP server registered
- [ ] Build process updated
- [ ] Test harness passing
- [ ] Dependencies bundled

### Phase 4 - Launch

- [ ] Claude CLI integration complete
- [ ] Orchestrator updated
- [ ] Commands accessible
- [ ] Help documentation ready

### Phase 5 - Quality

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Release notes written
- [ ] User guide published

---

## Definition of Done

Quick Designer v4 is considered complete when:

1. All Flash commands (`*instant`, `*refine`, `*validate`, `*show-system`, `*open-mockup`) work via Claude CLI
2. Pattern-based generation produces 3+ distinct variations without LLM calls
3. Design system persists across pages and sessions
4. Interactive mockup updates in real-time
5. Chrome MCP integration extracts design tokens from URLs
6. All acceptance criteria marked with ✅ are met
7. Test harness passes without external API calls
8. Documentation and user guides are complete

---

_Last Updated: Phase 0 Completion_
_Status: Ready for Phase 1 Implementation_
