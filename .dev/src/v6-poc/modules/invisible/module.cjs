const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');

/**
 * Proof-of-concept adapter that tries to mount the aidesigner orchestrator inside
 * the emerging V6 module registry. The goal is to probe where the current
 * implementation breaks when forced into the new directory conventions.
 */
async function probeInvisibleModule(context) {
  const url = require('url');
  const moduleRequire = createRequire(url.pathToFileURL(__filename).href);
  const blockers = [];
  const warnings = [];
  const notes = [];

  // 1. Validate that V6 exposes a module slot for invisible orchestrator assets.
  const expectedModuleDir = path.join(context.workspaceRoot, 'src', 'modules', 'invisible');
  if (!fs.existsSync(expectedModuleDir)) {
    blockers.push(
      `Missing module slot: expected directory at ${expectedModuleDir}. ` +
        'V6 alpha currently ships only BMM/BMB/CIS modules, so invisible orchestration needs a new module registration point.',
    );
  } else {
    notes.push(`Found candidate module directory at ${expectedModuleDir}.`);
  }

  // 2. Attempt to reuse the CommonJS aidesigner bridge inside an ESM-oriented runtime.
  try {
    const { AidesignerBridge } = moduleRequire(
      path.join(context.legacyRoot, 'lib', 'aidesigner-bridge.js'),
    );
    const bridge = new AidesignerBridge();
    if (typeof bridge.initialize !== 'function') {
      blockers.push('AidesignerBridge.initialize is not available after require() shim.');
    } else {
      warnings.push(
        'AidesignerBridge loads via CommonJS require(); V6 default ESM bundler will need a compatibility shim or rewrite.',
      );
    }
  } catch (error) {
    blockers.push(
      `Failed to require legacy AidesignerBridge: ${error.message}. ` +
        'V6 loaders refuse CommonJS modules without explicit compatibility wrappers.',
    );
  }

  // 3. Probe MCP runtime bootstrapping inside V6 lifecycle expectations.
  try {
    const runtimeModule = await import(
      path.join(context.legacyRoot, 'src', 'mcp-server', 'runtime.ts')
    );
    if (!runtimeModule.runOrchestratorServer) {
      blockers.push(
        'Legacy MCP runtime missing runOrchestratorServer export when imported as ESM.',
      );
    } else {
      warnings.push(
        'Legacy MCP runtime imports CommonJS hooks at execution time; V6 build graph may break lazy requires without loader hooks.',
      );
    }
  } catch (error) {
    blockers.push(
      `Failed to import MCP runtime as ESM: ${error.message}. ` +
        "TypeScript compilation currently targets CommonJS paths, incompatible with V6's native ES build.",
    );
  }

  // 4. Check persona asset availability under the new layout.
  const personaPath = path.join(context.legacyRoot, 'agents', 'invisible-orchestrator.md');
  if (!fs.existsSync(personaPath)) {
    blockers.push(`aidesigner orchestrator persona missing at ${personaPath}.`);
  } else {
    const newPersonaPath = path.join(
      context.workspaceRoot,
      'src',
      'modules',
      'invisible',
      'agents',
      'orchestrator.md',
    );
    if (!fs.existsSync(path.dirname(newPersonaPath))) {
      warnings.push(
        'V6 modules do not yet have an `agents/` folder for invisible personas; need to extend the module manifest to accept it.',
      );
    }
    notes.push('Persona document located but requires relocation and renaming conventions for V6.');
  }

  return { blockers, warnings, notes };
}

module.exports = { probeInvisibleModule };
