# Invisible Module V6 Proof-of-Concept

This folder mirrors the V6 module layout (`src/modules/<module-id>`) and contains a small compatibility probe that attempts to
mount the existing invisible orchestrator components inside the alpha architecture.

Run the probe with a script (for example via `node --loader ts-node/esm`) and provide:

```ts
import { probeInvisibleModule } from './module.js';

const result = await probeInvisibleModule({
  workspaceRoot: '/path/to/v6-alpha', // checkout of upstream v6
  legacyRoot: process.cwd(), // current BMAD-Invisible repo
});

console.log(result);
```

The probe intentionally fails in several places to highlight blockers that must be addressed before migration:

1. **Module slot missing** – V6 alpha ships BMM/BMB/CIS only, so we must introduce a dedicated `invisible` module.
2. **CommonJS bridge** – `lib/bmad-bridge.js` requires compatibility work because V6 assumes ESM modules.
3. **MCP runtime imports** – The orchestrator relies on lazy CommonJS requires (hooks, auto commands) that break under V6 bundling.
4. **Persona packaging** – Persona markdown lives in `agents/` today; V6 modules need an equivalent asset pipeline.

Use these findings to drive design discussions with the upstream V6 team.
