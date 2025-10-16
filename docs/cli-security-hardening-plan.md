# CLI Security Hardening Plan

This plan addresses the three path validation vulnerabilities identified during the
code review of the CLI utilities. The objective is to eliminate directory traversal
risks when generating reports, fetching MCP evidence, and loading codemod tokens.

## Phase 1 – Establish shared validation helpers

1. Introduce a `safePathWithinCwd(targetPath: string, baseDir = process.cwd())`
   helper in the CLI utilities that uses `path.resolve`, `path.relative`, and
   defensive checks to ensure the resolved path is inside the base directory and
   not the base directory itself when a file is required.
2. Add a companion helper `assertSafeChildName(name: string)` for validating
   state or file identifiers returned by remote services. This helper will
   enforce an allow-list such as `/^[a-z0-9_-]+$/i` and reject any value that
   expands to `.` or `..`.
3. Create unit tests that cover legitimate paths, empty strings, traversal
   attempts, absolute paths, and unicode edge cases to lock in the behavior.

## Phase 2 – Harden report generation paths

1. Update `generateDriftReport` to resolve the output directory and pass it
   through `safePathWithinCwd`. Reject invalid input before attempting to create
   directories or write files.
2. Adjust call sites (CLI flags, configuration loaders, and tests) to surface
   meaningful error messages when validation fails.
3. Expand integration tests for the report flow to include negative cases where
   the user supplies a sibling or parent directory and confirm the command aborts
   without writing anything.

## Phase 3 – Sanitize MCP evidence directories

1. When `runUrlAnalysis` processes capture-state names from the MCP server,
   validate each state with `assertSafeChildName` before joining it with the
   evidence directory.
2. Fail fast with a descriptive error if a malicious state name is encountered,
   ensuring no directories are created and no evidence files are written.
3. Add regression tests simulating a hostile MCP server response to verify that
   traversal attempts are rejected and the user is informed.

## Phase 4 – Protect codemod token loading

1. Apply `safePathWithinCwd` to both codemod entry points before reading the
   token JSON file specified by the user.
2. Ensure error handling is consistent across the entry points so that invalid
   paths produce actionable CLI output and exit with a non-zero status.
3. Backfill tests (unit or end-to-end) for the codemod workflows to confirm that
   only files under the project root can be accessed.

## Phase 5 – Verification and documentation

1. Run the complete lint, format, and test suite (`npm run lint`, `npm test`,
   relevant CLI smoke tests) to confirm the changes do not regress other
   functionality.
2. Document the new helpers and validation expectations in the CLI developer
   guide so future contributors reuse them instead of rolling custom checks.
3. Update the security changelog or release notes summarizing the mitigations and
   advising users to upgrade.
