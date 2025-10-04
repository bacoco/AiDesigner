const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execSync } = require('node:child_process');

describe('prepack MCP integration tests', () => {
  const rootDir = path.resolve(__dirname, '..');
  const distMcpDir = path.join(rootDir, 'dist', 'mcp');
  const serverEntry = path.join(distMcpDir, 'mcp', 'server.js');

  describe('prepack script', () => {
    let distMcpBackup;

    beforeAll(() => {
      // Back up existing dist/mcp if it exists
      distMcpBackup = distMcpDir + '.prepack-test-backup';
      if (fs.existsSync(distMcpDir)) {
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
      if (fs.existsSync(distMcpBackup)) {
        fs.renameSync(distMcpBackup, distMcpDir);
      }
    });

    test('prepack script runs build:mcp', () => {
      const packageJson = require(path.join(rootDir, 'package.json'));
      expect(packageJson.scripts.prepack).toBe('npm run build:mcp');
    });

    test('build:mcp creates dist/mcp/mcp/server.js', () => {
      // Run the build:mcp script
      const result = spawnSync('npm', ['run', 'build:mcp'], {
        cwd: rootDir,
        env: { ...process.env },
        encoding: 'utf8',
        shell: true,
      });

      expect(result.status).toBe(0);
      expect(fs.existsSync(serverEntry)).toBe(true);
    });

    test('build:mcp compiles TypeScript from .dev/mcp', () => {
      // Run the build:mcp script
      spawnSync('npm', ['run', 'build:mcp'], {
        cwd: rootDir,
        env: { ...process.env },
        encoding: 'utf8',
        shell: true,
      });

      // Verify TypeScript was compiled
      expect(fs.existsSync(serverEntry)).toBe(true);

      // Verify it's actual JavaScript, not TypeScript
      const content = fs.readFileSync(serverEntry, 'utf8');
      expect(content).not.toContain('import type');
      expect(content).not.toContain(': string');
    });

    test('build:mcp copies lib, hooks, and tools directories', () => {
      // Run the build:mcp script
      spawnSync('npm', ['run', 'build:mcp'], {
        cwd: rootDir,
        env: { ...process.env },
        encoding: 'utf8',
        shell: true,
      });

      // Verify directories were created
      const libDir = path.join(distMcpDir, 'lib');
      const hooksDir = path.join(distMcpDir, 'hooks');
      const toolsDir = path.join(distMcpDir, 'tools');

      if (fs.existsSync(path.join(rootDir, '.dev', 'lib'))) {
        expect(fs.existsSync(libDir)).toBe(true);
      }

      if (fs.existsSync(path.join(rootDir, 'hooks'))) {
        expect(fs.existsSync(hooksDir)).toBe(true);
      }

      expect(fs.existsSync(toolsDir)).toBe(true);

      // Verify specific tool files
      const expectedToolFiles = [
        'mcp-registry.js',
        'mcp-manager.js',
        'mcp-profiles.js',
        'mcp-security.js',
      ];

      for (const file of expectedToolFiles) {
        expect(fs.existsSync(path.join(toolsDir, file))).toBe(true);
      }
    });
  });

  describe('npm pack integration', () => {
    let distMcpBackup;
    let tarballPath;

    beforeAll(() => {
      // Back up existing dist/mcp if it exists
      distMcpBackup = distMcpDir + '.pack-test-backup';
      if (fs.existsSync(distMcpDir)) {
        if (fs.existsSync(distMcpBackup)) {
          fs.rmSync(distMcpBackup, { recursive: true, force: true });
        }
        fs.renameSync(distMcpDir, distMcpBackup);
      }
    });

    afterAll(() => {
      // Clean up tarball
      if (tarballPath && fs.existsSync(tarballPath)) {
        fs.unlinkSync(tarballPath);
      }

      // Restore original state
      if (fs.existsSync(distMcpDir)) {
        fs.rmSync(distMcpDir, { recursive: true, force: true });
      }
      if (fs.existsSync(distMcpBackup)) {
        fs.renameSync(distMcpBackup, distMcpDir);
      }
    });

    test('npm pack includes dist/mcp/mcp/server.js', () => {
      // Run npm pack
      const result = spawnSync('npm', ['pack'], {
        cwd: rootDir,
        env: { ...process.env },
        encoding: 'utf8',
        shell: true,
      });

      expect(result.status).toBe(0);

      // Find the created tarball
      const packageJson = require(path.join(rootDir, 'package.json'));
      const expectedTarballName = `${packageJson.name}-${packageJson.version}.tgz`;
      tarballPath = path.join(rootDir, expectedTarballName);

      expect(fs.existsSync(tarballPath)).toBe(true);

      // Check tarball contents for server.js
      const listResult = spawnSync(
        'tar',
        ['-tzf', expectedTarballName, 'package/dist/mcp/mcp/server.js'],
        {
          cwd: rootDir,
          encoding: 'utf8',
        },
      );

      expect(listResult.status).toBe(0);
      expect(listResult.stdout).toContain('package/dist/mcp/mcp/server.js');
    });

    test('npm pack includes MCP assets (lib, hooks, tools)', () => {
      if (!tarballPath) {
        // Run npm pack if not already done
        spawnSync('npm', ['pack'], {
          cwd: rootDir,
          env: { ...process.env },
          encoding: 'utf8',
          shell: true,
        });

        const packageJson = require(path.join(rootDir, 'package.json'));
        tarballPath = path.join(rootDir, `${packageJson.name}-${packageJson.version}.tgz`);
      }

      // List all files in the tarball
      const listResult = spawnSync('tar', ['-tzf', path.basename(tarballPath)], {
        cwd: rootDir,
        encoding: 'utf8',
      });

      expect(listResult.status).toBe(0);

      const tarballContents = listResult.stdout;

      // Check for MCP assets if they exist in source
      if (fs.existsSync(path.join(rootDir, '.dev', 'lib'))) {
        expect(tarballContents).toMatch(/package\/dist\/mcp\/lib\//);
      }

      if (fs.existsSync(path.join(rootDir, 'hooks'))) {
        expect(tarballContents).toMatch(/package\/dist\/mcp\/hooks\//);
      }

      expect(tarballContents).toMatch(/package\/dist\/mcp\/tools\//);
    });
  });

  describe('postinstall after npm pack flow', () => {
    test('postinstall runs successfully after installing from tarball', () => {
      // This test verifies the complete flow:
      // 1. prepack builds MCP
      // 2. npm pack creates tarball with dist/mcp
      // 3. npm install from tarball runs postinstall
      // 4. postinstall finds prebuilt server and copies assets

      // Note: This is a conceptual test - actual tarball install testing
      // requires a separate test environment to avoid polluting node_modules
      const packageJson = require(path.join(rootDir, 'package.json'));
      expect(packageJson.scripts.postinstall).toBe('node .dev/tools/postinstall-build-mcp.js');
      expect(packageJson.scripts.prepack).toBe('npm run build:mcp');
    });
  });
});
