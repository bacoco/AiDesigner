# Drawbridge Visual Feedback Mapping

Generated artifacts will appear here when `tools/drawbridge-context-pack.mjs` processes a Drawbridge export.

## Current Status

_No Drawbridge annotations ingested yet. Run the context pack utility to populate selector routes and screenshots._

## How to Update

1. Capture feedback in Drawbridge and export the task bundle.
2. Run `node tools/drawbridge-context-pack.mjs --input <export-path> --mode batch` (or preferred mode).
3. Re-run as feedback evolves; the script rewrites this file with fresh tables and annotation details.
4. Use `bin/aidesigner review` to inspect the queue before addressing items.
