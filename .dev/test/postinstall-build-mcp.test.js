const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

describe('postinstall-build-mcp script', () => {
  const rootDir = path.resolve(__dirname, '..', '..');
  const distMcpDir = path.join(rootDir, 'dist', 'mcp');
  const postinstallScript = path.join(rootDir, '.dev', 'tools', 'postinstall-build-mcp.js');
  const serverEntry = path.join(distMcpDir, 'mcp', 'server.js');

  // Helper to run the postinstall script
  const runPostinstall = (args = []) => {
    return spawnSync(process.execPath, [postinstallScript, ...args], {
      cwd: rootDir,
      env: { ...process.env },
      encoding: 'utf8',
    });
  };

  describe('prebuilt server check', () => {
    let distMcpBackup;

    beforeEach(() => {
      // Back up existing dist/mcp if it exists
      distMcpBackup = distMcpDir + '.test-backup';
      if (fs.existsSync(distMcpDir)) {
        if (fs.existsSync(distMcpBackup)) {
          fs.rmSync(distMcpBackup, { recursive: true, force: true });
        }
        fs.renameSync(distMcpDir, distMcpBackup);
      }
    });

    afterEach(() => {
      // Restore original state
      if (fs.existsSync(distMcpDir)) {
        fs.rmSync(distMcpDir, { recursive: true, force: true });
      }
      if (fs.existsSync(distMcpBackup)) {
        fs.renameSync(distMcpBackup, distMcpDir);
      }
    });

    test('exits early with helpful message when no prebuilt server is found', () => {
      const result = runPostinstall();

      expect(result.status).toBe(0);
      expect(result.stderr).toContain('Prebuilt MCP server not found');
      expect(result.stderr).toContain('npm run build:mcp');
      expect(result.stderr).toContain('Skipping MCP asset sync');
    });
  });

  describe('asset synchronization', () => {
    let distMcpBackup;

    beforeEach(() => {
      // Back up and recreate with prebuilt server
      distMcpBackup = distMcpDir + '.test-backup';
      if (fs.existsSync(distMcpDir)) {
        if (fs.existsSync(distMcpBackup)) {
          fs.rmSync(distMcpBackup, { recursive: true, force: true });
        }
        fs.renameSync(distMcpDir, distMcpBackup);
      }

      // Create a mock prebuilt server
      const mcpServerDir = path.join(distMcpDir, 'mcp');
      fs.mkdirSync(mcpServerDir, { recursive: true });
      fs.writeFileSync(serverEntry, '// Mock prebuilt server.js for testing');
    });

    afterEach(() => {
      // Restore original state
      if (fs.existsSync(distMcpDir)) {
        fs.rmSync(distMcpDir, { recursive: true, force: true });
      }
      if (fs.existsSync(distMcpBackup)) {
        fs.renameSync(distMcpBackup, distMcpDir);
      }
    });

    test('copies lib, hooks, and tools when prebuilt server exists', () => {
      const result = runPostinstall();

      expect(result.status).toBe(0);

      // Verify directories were copied
      const libDir = path.join(distMcpDir, 'lib');
      const hooksDir = path.join(distMcpDir, 'hooks');
      const toolsDir = path.join(distMcpDir, 'tools');
      const agentsDir = path.join(distMcpDir, 'agents');

      // Only check if source directories exist in the repo
      if (fs.existsSync(path.join(rootDir, '.dev', 'lib'))) {
        expect(fs.existsSync(libDir)).toBe(true);
      }

      if (fs.existsSync(path.join(rootDir, 'hooks'))) {
        expect(fs.existsSync(hooksDir)).toBe(true);
      }

      if (fs.existsSync(path.join(rootDir, 'agents'))) {
        expect(fs.existsSync(agentsDir)).toBe(true);
      }

      expect(fs.existsSync(toolsDir)).toBe(true);
    });

    test('copies specific tool module files', () => {
      const result = runPostinstall();

      expect(result.status).toBe(0);

      const toolsDir = path.join(distMcpDir, 'tools');
      const expectedFiles = [
        'mcp-registry.js',
        'mcp-manager.js',
        'mcp-profiles.js',
        'mcp-security.js',
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(toolsDir, file);
        if (fs.existsSync(path.join(rootDir, '.dev', 'tools', file))) {
          expect(fs.existsSync(filePath)).toBe(true);
        }
      }
    });

    test('handles missing source directories gracefully', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf8');

      // Verify the script checks for directory existence
      expect(scriptContent).toContain('existsSync(source)');
      expect(scriptContent).toContain('Source directory not found');
    });

    test('skips symbolic links during copy', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf8');

      // Verify the script intentionally skips symlinks
      expect(scriptContent).toContain('isSymbolicLink');
      expect(scriptContent).toContain('Skipping symbolic link');
    });

    test('warns about missing tool modules during copy', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf8');

      // Verify the script checks for missing tool modules
      expect(scriptContent).toContain('Missing MCP tool module during copy');
    });
  });

  describe('no TypeScript compilation', () => {
    test('does not compile TypeScript in postinstall', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf8');

      // Verify TypeScript compilation code is NOT present
      expect(scriptContent).not.toContain('Running TypeScript compiler');
      expect(scriptContent).not.toContain('tsc');
    });

    test('script focuses on asset synchronization only', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf8');

      // Verify the script header describes synchronization, not compilation
      expect(scriptContent).toContain('synchronise MCP');
      expect(scriptContent).toContain('prepack');
    });
  });
});
