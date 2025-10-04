const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

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
      const child = spawn(
        process.execPath,
        ['-e', script],
        {
          cwd: repoRoot,
          env: { ...process.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

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
});
