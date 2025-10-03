const path = require('node:path');
const fs = require('node:fs');

describe('probeInvisibleModule', () => {
  const moduleUnderTestPath = path.resolve(__dirname, '../src/v6-poc/modules/invisible/module.ts');

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('reports warnings and notes when legacy assets can be probed successfully', async () => {
    const workspaceRoot = '/tmp/workspace-success';
    const legacyRoot = '/tmp/legacy-success';
    const expectedModuleDir = path.join(workspaceRoot, 'src', 'modules', 'invisible');
    const personaPath = path.join(legacyRoot, 'agents', 'invisible-orchestrator.md');
    const agentsDir = path.join(workspaceRoot, 'src', 'modules', 'invisible', 'agents');
    const runtimeModulePath = path.join(legacyRoot, 'src', 'mcp-server', 'runtime.ts');
    const legacyBridgePath = path.join(legacyRoot, 'lib', 'bmad-bridge.js');

    jest.resetModules();

    const requireMock = jest.fn();
    jest.doMock('node:module', () => ({
      createRequire: jest.fn(() => requireMock),
    }));

    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((requestedPath) => {
      if (requestedPath === expectedModuleDir) {
        return true;
      }
      if (requestedPath === personaPath) {
        return true;
      }
      if (requestedPath === agentsDir) {
        return true;
      }
      return false;
    });

    const { probeInvisibleModule } = require(moduleUnderTestPath);

    const initializeMock = jest.fn();
    requireMock.mockImplementation((requestedPath) => {
      if (requestedPath === legacyBridgePath) {
        class MockBridge {
          initialize() {
            return initializeMock();
          }
        }
        return { BMADBridge: MockBridge };
      }
      throw new Error(`Unexpected require path: ${requestedPath}`);
    });

    // Mock the dynamic import for the runtime module
    const originalImport = globalThis.import;
    const importSpy = jest.fn();
    // @ts-expect-error - Mocking global import (not in Node.js types)
    globalThis.import = jest.fn((modulePath) => {
      importSpy(modulePath);
      if (modulePath === runtimeModulePath) {
        return Promise.resolve({ runOrchestratorServer: jest.fn() });
      }
      return originalImport?.(modulePath);
    });

    const result = await probeInvisibleModule({ workspaceRoot, legacyRoot });

    // Restore original import
    // @ts-expect-error - Restoring global import (not in Node.js types)
    globalThis.import = originalImport;

    expect(existsSpy).toHaveBeenCalled();
    expect(requireMock).toHaveBeenCalledWith(legacyBridgePath);
    expect(requireMock).toHaveBeenCalledTimes(1);
    expect(importSpy).toHaveBeenCalledWith(runtimeModulePath);
    expect(importSpy).toHaveBeenCalledTimes(1);
    expect(initializeMock).not.toHaveBeenCalled();
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([
      'BMADBridge loads via CommonJS require(); V6 default ESM bundler will need a compatibility shim or rewrite.',
      'Legacy MCP runtime imports CommonJS hooks at execution time; V6 build graph may break lazy requires without loader hooks.',
    ]);
    expect(result.notes).toEqual([
      `Found candidate module directory at ${expectedModuleDir}.`,
      'Persona document located but requires relocation and renaming conventions for V6.',
    ]);
  });

  test('surfaces blockers when V6 workspace cannot access legacy assets', async () => {
    const workspaceRoot = '/tmp/workspace-failure';
    const legacyRoot = '/tmp/legacy-failure';
    const expectedModuleDir = path.join(workspaceRoot, 'src', 'modules', 'invisible');
    const personaPath = path.join(legacyRoot, 'agents', 'invisible-orchestrator.md');
    const runtimeModulePath = path.join(legacyRoot, 'src', 'mcp-server', 'runtime.ts');
    const legacyBridgePath = path.join(legacyRoot, 'lib', 'bmad-bridge.js');

    jest.resetModules();

    const requireMock = jest.fn((requestedPath) => {
      if (requestedPath === legacyBridgePath) {
        throw new Error('CommonJS module rejection');
      }
      throw new Error(`Unexpected require path: ${requestedPath}`);
    });
    jest.doMock('node:module', () => ({
      createRequire: jest.fn(() => requireMock),
    }));

    jest.spyOn(fs, 'existsSync').mockImplementation((requestedPath) => {
      if (requestedPath === expectedModuleDir) {
        return false;
      }
      if (requestedPath === personaPath) {
        return false;
      }
      return false;
    });

    const { probeInvisibleModule } = require(moduleUnderTestPath);

    // Mock the dynamic import for the runtime module to fail
    const originalImport = globalThis.import;
    const importSpy = jest.fn();
    // @ts-expect-error - Mocking global import (not in Node.js types)
    globalThis.import = jest.fn((modulePath) => {
      importSpy(modulePath);
      if (modulePath === runtimeModulePath) {
        return Promise.reject(new Error('Cannot import runtime'));
      }
      return originalImport?.(modulePath);
    });

    const result = await probeInvisibleModule({ workspaceRoot, legacyRoot });

    // Restore original import
    // @ts-expect-error - Restoring global import (not in Node.js types)
    globalThis.import = originalImport;

    expect(requireMock).toHaveBeenCalledWith(legacyBridgePath);
    expect(requireMock).toHaveBeenCalledTimes(1);
    expect(importSpy).toHaveBeenCalledWith(runtimeModulePath);
    expect(importSpy).toHaveBeenCalledTimes(1);
    expect(result.blockers).toEqual([
      `Missing module slot: expected directory at ${expectedModuleDir}. V6 alpha currently ships only BMM/BMB/CIS modules, so invisible orchestration needs a new module registration point.`,
      'Failed to require legacy BMAD bridge: CommonJS module rejection. V6 loaders refuse CommonJS modules without explicit compatibility wrappers.',
      'Failed to import MCP runtime as ESM: Cannot import runtime. TypeScript compilation currently targets CommonJS paths, incompatible with V6\'s native ES build.',
      `Invisible orchestrator persona missing at ${personaPath}.`,
    ]);
    expect(result.warnings).toEqual([]);
    expect(result.notes).toEqual([]);
  });
});
