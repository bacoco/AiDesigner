# CLI Security Hardening Plan

This plan addresses the three path validation vulnerabilities identified during the
code review of the CLI utilities. The objective is to eliminate directory traversal
risks when generating reports, fetching MCP evidence, and loading codemod tokens.

## Phase 1 – Establish shared validation helpers

1. Introduce a `safePathWithinCwd(targetPath: string, baseDir = process.cwd())`
   helper in the CLI utilities that uses `path.resolve`, `path.relative`, and
   defensive checks to ensure the resolved path is inside the base directory and
   not the base directory itself when a file is required. **Critical: This helper
   must use `fs.realpathSync()` (or async equivalent) to resolve symbolic links
   before performing containment checks.** Without canonicalization, an attacker
   can create a symlink inside the project (e.g., `reports/sneaky -> ../`) that
   bypasses `path.relative` checks but writes outside the project when followed
   by the filesystem. The helper should reject paths that resolve outside the
   base directory after symlink resolution.

   Example implementation:
   ```typescript
   import * as path from 'path';
   import * as fs from 'fs';

   export function safePathWithinCwd(targetPath: string, baseDir = process.cwd()): string {
     const resolved = path.resolve(baseDir, targetPath);

     // Check before fs access to fail fast on obvious traversal
     const relative = path.relative(baseDir, resolved);
     if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
       throw new Error(`Path traversal detected: ${targetPath}`);
     }

     // Canonicalize to detect symlink breakout
     let canonical: string;
     try {
       canonical = fs.realpathSync(resolved);
     } catch (err) {
       // Path doesn't exist yet - verify parent is safe
       const parent = path.dirname(resolved);
       if (fs.existsSync(parent)) {
         canonical = path.join(fs.realpathSync(parent), path.basename(resolved));
       } else {
         canonical = resolved; // Will be created, use logical path
       }
     }

     const canonicalBase = fs.realpathSync(baseDir);
     const canonicalRelative = path.relative(canonicalBase, canonical);

     if (!canonicalRelative || canonicalRelative.startsWith('..') || path.isAbsolute(canonicalRelative)) {
       throw new Error(`Path traversal detected (after symlink resolution): ${targetPath}`);
     }

     return resolved;
   }
   ```

2. Add a companion helper `assertSafeChildName(name: string)` for validating
   state or file identifiers returned by remote services. **This helper must
   first normalize/decode the input string before applying validation checks**
   to prevent bypasses via URL encoding (e.g., `%2e%2e` decoding to `..`) or
   other encoding schemes. After normalization, enforce an allow-list such as
   `/^[a-z0-9_-]+$/i` and reject any value that equals `.` or `..`.

   Example implementation:
   ```typescript
   export function assertSafeChildName(name: string): void {
     // Normalize: decode common encodings that could hide traversal sequences
     let normalized = name;
     try {
       // URL decode (may need multiple passes for double-encoding)
       normalized = decodeURIComponent(name);
     } catch {
       throw new Error(`Invalid identifier (encoding error): ${name}`);
     }

     // Additional normalization: strip null bytes, normalize unicode, etc.
     normalized = normalized.replace(/\0/g, '');

     // Reject special directory names
     if (normalized === '.' || normalized === '..') {
       throw new Error(`Unsafe identifier: ${name}`);
     }

     // Enforce strict allow-list
     const SAFE_PATTERN = /^[a-z0-9_-]+$/i;
     if (!SAFE_PATTERN.test(normalized)) {
       throw new Error(`Unsafe identifier: ${name}`);
     }
   }
   ```

3. Create unit tests that cover legitimate paths, empty strings, traversal
   attempts, absolute paths, symlink attacks, URL-encoded traversal sequences,
   null bytes, and unicode edge cases to lock in the behavior. Specific test
   cases should include:
   - Symlinks pointing outside the project
   - Double-encoded paths like `%252e%252e`
   - Mixed separators (`../` vs `..\`)
   - Unicode normalization attacks (e.g., `\u002e\u002e`)
   - Long paths exceeding system limits

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
