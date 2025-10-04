const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const os = require('node:os');

describe('MCP server bundle smoke test', () => {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const serverEntry = path.join(repoRoot, 'dist', 'mcp', 'mcp', 'server.js');

  test('server boots without missing auto-commands module', async () => {
    if (!fs.existsSync(serverEntry)) {
      throw new Error(
        'Expected dist/mcp/mcp/server.js to exist. Run the MCP build before executing tests.',
      );
    }

    const script = `require(${JSON.stringify(serverEntry)}); setTimeout(() => process.exit(0), 0);`;

    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', script], {
        cwd: repoRoot,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code, signal) => {
        if (code === 0) {
          resolve(undefined);
          return;
        }

        reject(
          new Error(
            `MCP server smoke test exited unexpectedly (code=${code}, signal=${signal}).\n${stderr}`,
          ),
        );
      });
    });
  });

  test('bundled MCP tools support search and install operations', async () => {
    if (!fs.existsSync(serverEntry)) {
      throw new Error(
        'Expected dist/mcp/mcp/server.js to exist. Run the MCP build before executing tests.',
      );
    }

    const smokeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agilai-mcp-smoke-test-'));

    try {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [serverEntry], {
          cwd: repoRoot,
          env: {
            ...process.env,
            AGILAI_MCP_SMOKE_TEST: '1',
            AGILAI_MCP_SMOKE_ROOT: smokeRoot,
            MCP_PROFILE: 'default',
            HOME: smokeRoot,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stderr = '';
        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        child.on('error', (error) => {
          reject(error);
        });

        child.on('exit', (code, signal) => {
          if (code === 0) {
            resolve(undefined);
            return;
          }

          reject(
            new Error(
              `Bundled MCP tools smoke test exited unexpectedly (code=${code}, signal=${signal}).\n${stderr}`,
            ),
          );
        });
      });

      const claudeConfigPath = path.join(smokeRoot, '.claude', 'mcp-config.json');
      const agilaiConfigPath = path.join(smokeRoot, 'mcp', 'agilai-config.json');

      expect(fs.existsSync(claudeConfigPath)).toBe(true);
      expect(fs.existsSync(agilaiConfigPath)).toBe(true);

      const claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
      const agilaiConfig = JSON.parse(fs.readFileSync(agilaiConfigPath, 'utf8'));

      const configKeys = Object.keys(claudeConfig.mcpServers || {});
      expect(configKeys.length).toBeGreaterThan(0);
      expect(Object.keys(agilaiConfig.mcpServers || {})).toEqual(configKeys);
    } finally {
      fs.rmSync(smokeRoot, { recursive: true, force: true });
    }
  });
});
