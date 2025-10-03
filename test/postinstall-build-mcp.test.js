const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

describe('postinstall-build-mcp script', () => {
  const rootDir = path.resolve(__dirname, '..');
  const distMcpDir = path.join(rootDir, 'dist', 'mcp');
  const postinstallScript = path.join(rootDir, 'tools', 'postinstall-build-mcp.js');

  // Helper to run the postinstall script
  const runPostinstall = (args = []) => {
    return spawnSync(process.execPath, [postinstallScript, ...args], {
      cwd: rootDir,
      env: { ...process.env },
      encoding: 'utf-8',
    });
  };

  describe('early exit behavior', () => {
    test('exits early when dist/mcp exists and is complete without --force', () => {
      // Ensure dist/mcp exists with complete build structure
      const mcpServerDir = path.join(distMcpDir, 'mcp');
      const libDir = path.join(distMcpDir, 'lib');
      const hooksDir = path.join(distMcpDir, 'hooks');

      if (!fs.existsSync(mcpServerDir)) {
        fs.mkdirSync(mcpServerDir, { recursive: true });
      }
      if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
      }
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      // Create the key server.js file
      const serverJsPath = path.join(mcpServerDir, 'server.js');
      if (!fs.existsSync(serverJsPath)) {
        fs.writeFileSync(serverJsPath, '// Placeholder server.js for testing');
      }

      const result = runPostinstall();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('MCP assets already exist');
      expect(result.stdout).toContain('Use --force to rebuild');
    });

    test('rebuilds when dist/mcp exists but is incomplete', () => {
      // Create incomplete build (missing server.js)
      const libDir = path.join(distMcpDir, 'lib');
      const hooksDir = path.join(distMcpDir, 'hooks');

      if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
      }
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      // Explicitly remove server.js if it exists to simulate incomplete build
      const mcpServerDir = path.join(distMcpDir, 'mcp');
      const serverJsPath = path.join(mcpServerDir, 'server.js');
      if (fs.existsSync(serverJsPath)) {
        fs.unlinkSync(serverJsPath);
      }

      const result = runPostinstall();

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Incomplete MCP build detected');
      // Should see TypeScript compilation output or warning
      expect(
        result.stdout.includes('Running TypeScript compiler') ||
          result.stdout.includes('TypeScript is not installed'),
      ).toBe(true);
    });

    test('rebuilds when --force flag is provided', () => {
      // Ensure dist/mcp exists
      if (!fs.existsSync(distMcpDir)) {
        fs.mkdirSync(distMcpDir, { recursive: true });
      }

      const result = runPostinstall(['--force']);

      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain('skipping postinstall build');
      // Should see TypeScript compilation output or warning
      expect(
        result.stdout.includes('Running TypeScript compiler') ||
          result.stdout.includes('TypeScript is not installed'),
      ).toBe(true);
    });
  });

  describe('TypeScript compilation', () => {
    test('continues when TypeScript is not installed', () => {
      // Temporarily remove dist/mcp to trigger rebuild
      const distMcpBackup = distMcpDir + '.backup';
      if (fs.existsSync(distMcpDir)) {
        fs.renameSync(distMcpDir, distMcpBackup);
      }

      try {
        // Run with modified NODE_PATH to hide TypeScript
        const result = spawnSync(
          process.execPath,
          [postinstallScript],
          {
            cwd: rootDir,
            env: {
              ...process.env,
              NODE_PATH: '/nonexistent', // Force TypeScript lookup to fail
            },
            encoding: 'utf-8',
          },
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('TypeScript is not installed');
        expect(result.stdout).toContain('skipping MCP TypeScript build');
      } finally {
        // Restore backup
        if (fs.existsSync(distMcpBackup)) {
          if (fs.existsSync(distMcpDir)) {
            fs.rmSync(distMcpDir, { recursive: true });
          }
          fs.renameSync(distMcpBackup, distMcpDir);
        }
      }
    });

    test('script handles TypeScript compilation failures gracefully', () => {
      // This test verifies the script continues even if TypeScript compilation fails
      // In practice, TypeScript should compile successfully, but we verify
      // that the script is designed to handle failures gracefully

      const scriptContent = fs.readFileSync(postinstallScript, 'utf-8');

      // Verify the script has warning messages instead of throwing errors
      expect(scriptContent).toContain('console.warn');
      expect(scriptContent).toContain('Continuing with postinstall despite');
      expect(scriptContent).not.toContain('throw new Error');
    });
  });

  describe('directory copying', () => {
    let originalDistMcpState;
    let distMcpBackup;

    beforeAll(() => {
      // Save the original state
      originalDistMcpState = fs.existsSync(distMcpDir);
      distMcpBackup = distMcpDir + '.test-backup';

      // Back up existing dist/mcp if it exists
      if (originalDistMcpState && fs.existsSync(distMcpDir)) {
        if (fs.existsSync(distMcpBackup)) {
          fs.rmSync(distMcpBackup, { recursive: true, force: true });
        }
        fs.renameSync(distMcpDir, distMcpBackup);
      }
    });

    afterAll(() => {
      // Restore original state
      if (fs.existsSync(distMcpDir)) {
        fs.rmSync(distMcpDir, { recursive: true, force: true });
      }
      if (originalDistMcpState && fs.existsSync(distMcpBackup)) {
        fs.renameSync(distMcpBackup, distMcpDir);
      }
    });

    test('copies lib and hooks directories to dist/mcp', () => {
      // Run the script to build
      const result = runPostinstall(['--force']);
      expect(result.status).toBe(0);

      // Verify directories were copied
      const libDir = path.join(distMcpDir, 'lib');
      const hooksDir = path.join(distMcpDir, 'hooks');

      expect(fs.existsSync(libDir)).toBe(true);
      expect(fs.existsSync(hooksDir)).toBe(true);
    });

    test('handles missing source directories gracefully', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf-8');

      // Verify the script checks for directory existence
      expect(scriptContent).toContain('existsSync(source)');
      expect(scriptContent).toContain('Source directory not found');
    });
  });

  describe('force flag', () => {
    test('recognizes --force flag in process arguments', () => {
      const scriptContent = fs.readFileSync(postinstallScript, 'utf-8');

      // Verify --force flag is checked
      expect(scriptContent).toContain('--force');
      expect(scriptContent).toContain('forceRebuild');
    });
  });
});
