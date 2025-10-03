# Task Breakdown Template

_This template is adapted from GitHub Spec Kit for rapid task generation._
_Source: https://github.com/github/spec-kit (MIT License)_

---

## Context

Based on this implementation plan:

```
{{IMPLEMENTATION_PLAN}}
```

Break down into specific, actionable tasks.

## Task List

### Setup & Preparation

- [ ] **Task 1: Environment Setup**
  - Description: What needs to be configured
  - Files: Which files to create/modify
  - Estimated time: X minutes
  - Dependencies: None

- [ ] **Task 2: Install Dependencies**
  - Description: What packages/libraries needed
  - Command: `npm install package-name`
  - Estimated time: X minutes
  - Dependencies: Task 1

### Core Implementation

- [ ] **Task 3: [Core Feature Name]**
  - Description: Detailed description of what to implement
  - Files to create:
    - `src/new-file.js` - Purpose and key functions
  - Files to modify:
    - `src/existing-file.js` - Changes needed (specific lines/functions)
  - Code snippets:
    ```javascript
    // Example of key logic
    function exampleFunction() {
      // Implementation guidance
    }
    ```
  - Estimated time: X hours
  - Dependencies: Task 2

- [ ] **Task 4: [Integration]**
  - Description: How to connect components
  - Files to modify:
    - `src/integration-point.js` - Specific changes
  - Testing: How to verify it works
  - Estimated time: X hours
  - Dependencies: Task 3

### Testing & Validation

- [ ] **Task 5: Unit Tests**
  - Description: What to test
  - Files to create:
    - `test/feature.test.js` - Test cases to write
  - Test scenarios:
    1. Scenario 1
    2. Scenario 2
    3. Scenario 3
  - Estimated time: X hours
  - Dependencies: Task 3, Task 4

- [ ] **Task 6: Integration Tests**
  - Description: End-to-end testing
  - Test plan: Step-by-step testing instructions
  - Expected results: What success looks like
  - Estimated time: X minutes
  - Dependencies: Task 5

### Documentation & Cleanup

- [ ] **Task 7: Documentation**
  - Description: What needs documenting
  - Files to update:
    - `README.md` - Section to add/update
    - `docs/api.md` - New API documentation
  - Estimated time: X minutes
  - Dependencies: Task 6

- [ ] **Task 8: Code Review & Refactor**
  - Description: Review and cleanup
  - Checklist:
    - [ ] Remove console.logs
    - [ ] Add error handling
    - [ ] Optimize performance
    - [ ] Follow code style
  - Estimated time: X minutes
  - Dependencies: Task 7

## Summary

**Total estimated time:** X hours/days
**Critical path:** Task 1 → Task 2 → Task 3 → Task 4
**Parallel tasks:** Task 5 and Task 7 can be done concurrently

## Acceptance Checklist

Before marking this complete:

- [ ] All tasks above completed
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Follows project conventions

---

**Instructions to LLM:**
Replace {{IMPLEMENTATION_PLAN}} with the actual plan content, then generate specific, actionable tasks. Each task should be small enough to complete in one sitting. Include file paths, code snippets, and clear acceptance criteria. Order tasks by dependencies.
