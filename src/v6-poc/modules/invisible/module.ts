import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

export interface V6ModuleContext {
  /** Root of the V6 workspace that mirrors `src/` in upstream alpha */
  workspaceRoot: string;
  /** Directory where legacy BMAD-Invisible assets currently live */
  legacyRoot: string;
}

export interface CompatibilityResult {
  blockers: string[];
  warnings: string[];
  notes: string[];
}

/**
 * Proof-of-concept adapter that tries to mount the invisible orchestrator inside
 * the emerging V6 module registry. The goal is to probe where the current
 * implementation breaks when forced into the new directory conventions.
 */
export async function probeInvisibleModule(context: V6ModuleContext): Promise<CompatibilityResult> {
  const require = createRequire(import.meta.url);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  // 1. Validate that V6 exposes a module slot for invisible orchestrator assets.
  const expectedModuleDir = path.join(context.workspaceRoot, "src", "modules", "invisible");
  if (!fs.existsSync(expectedModuleDir)) {
    blockers.push(
      `Missing module slot: expected directory at ${expectedModuleDir}. ` +
        "V6 alpha currently ships only BMM/BMB/CIS modules, so invisible orchestration needs a new module registration point."
    );
  } else {
    notes.push(`Found candidate module directory at ${expectedModuleDir}.`);
  }

  // 2. Attempt to reuse the CommonJS BMAD bridge inside an ESM-oriented runtime.
  try {
    const { BMADBridge } = require(path.join(context.legacyRoot, "lib", "bmad-bridge.js"));
    const bridge = new BMADBridge();
    if (typeof bridge.initialize !== "function") {
      blockers.push("BMADBridge.initialize is not available after require() shim.");
    } else {
      warnings.push(
        "BMADBridge loads via CommonJS require(); V6 default ESM bundler will need a compatibility shim or rewrite."
      );
    }
  } catch (error) {
    blockers.push(
      `Failed to require legacy BMAD bridge: ${(error as Error).message}. ` +
        "V6 loaders refuse CommonJS modules without explicit compatibility wrappers."
    );
  }

  // 3. Probe MCP runtime bootstrapping inside V6 lifecycle expectations.
  try {
    const runtimeModule = await import(path.join(context.legacyRoot, "src", "mcp-server", "runtime.ts"));
    if (!runtimeModule.runOrchestratorServer) {
      blockers.push("Legacy MCP runtime missing runOrchestratorServer export when imported as ESM.");
    } else {
      warnings.push(
        "Legacy MCP runtime imports CommonJS hooks at execution time; V6 build graph may break lazy requires without loader hooks."
      );
    }
  } catch (error) {
    blockers.push(
      `Failed to import MCP runtime as ESM: ${(error as Error).message}. ` +
        "TypeScript compilation currently targets CommonJS paths, incompatible with V6's native ES build."
    );
  }

  // 4. Check persona asset availability under the new layout.
  const personaPath = path.join(context.legacyRoot, "agents", "invisible-orchestrator.md");
  if (!fs.existsSync(personaPath)) {
    blockers.push(`Invisible orchestrator persona missing at ${personaPath}.`);
  } else {
    const newPersonaPath = path.join(context.workspaceRoot, "src", "modules", "invisible", "agents", "orchestrator.md");
    if (!fs.existsSync(path.dirname(newPersonaPath))) {
      warnings.push(
        "V6 modules do not yet have an `agents/` folder for invisible personas; need to extend the module manifest to accept it."
      );
    }
    notes.push("Persona document located but requires relocation and renaming conventions for V6.");
  }

  return { blockers, warnings, notes };
}
