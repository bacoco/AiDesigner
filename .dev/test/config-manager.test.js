const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { ensureCodexConfig } = require('../lib/codex/config-manager.js');

const DEFAULT_SERVER_NAMES = ['bmad-mcp', 'chrome-devtools', 'shadcn'];

function normaliseServerName(server) {
  const value = server?.name ?? server?.id ?? '';
  return String(value).toLowerCase();
}

describe('ensureCodexConfig MCP server defaults', () => {
  let tmpHome;
  let homeSpy;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-config-test-'));
    homeSpy = jest.spyOn(os, 'homedir').mockReturnValue(tmpHome);
  });

  afterEach(async () => {
    if (homeSpy) {
      homeSpy.mockRestore();
    }
    if (tmpHome) {
      await fs.remove(tmpHome);
    }
  });

  it('adds missing default servers exactly once and preserves manual approval flags', async () => {
    const configDir = path.join(tmpHome, '.codex');
    const configPath = path.join(configDir, 'config.toml');

    const initialToml = `
[mcp]
require_manual_approval = true
auto_approve = false

[[mcp.servers]]
name = "bmad-mcp"
command = "/custom/path/to/npx"
args = ["bmad-invisible", "mcp"]
autoStart = false
autoApprove = false

[[mcp.servers]]
name = "custom-server"
command = "custom"
args = ["--flag"]
`;

    await fs.outputFile(configPath, initialToml);

    const result = await ensureCodexConfig({ nonInteractive: true });

    expect(result.config.mcp.require_manual_approval).toBe(true);
    expect(result.config.mcp.auto_approve).toBe(false);

    const servers = result.config.mcp.servers ?? [];
    const nameCounts = new Map();
    for (const server of servers) {
      const name = normaliseServerName(server);
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }

    for (const expectedName of DEFAULT_SERVER_NAMES) {
      expect(nameCounts.get(expectedName)).toBe(1);
    }

    const orchestrator = servers.find((server) => normaliseServerName(server) === 'bmad-mcp');
    expect(orchestrator).toBeDefined();
    expect(orchestrator.autoStart).toBe(false);
    expect(orchestrator.autoApprove).toBe(false);
    expect(orchestrator.command).toBe('/custom/path/to/npx');

    const chrome = servers.find((server) => normaliseServerName(server) === 'chrome-devtools');
    expect(chrome).toBeDefined();
    expect(chrome.command).toBe('npx');
    expect(chrome.args).toEqual(['-y', '@modelcontextprotocol/server-chrome-devtools']);

    const shadcn = servers.find((server) => normaliseServerName(server) === 'shadcn');
    expect(shadcn).toBeDefined();
    expect(shadcn.command).toBe('npx');
    expect(shadcn.args).toEqual(['-y', '@modelcontextprotocol/server-shadcn']);
  });

  it('writes default servers once when generating a fresh config', async () => {
    const first = await ensureCodexConfig({ nonInteractive: true });
    const firstNames = [];
    for (const server of first.config.mcp.servers ?? []) {
      firstNames.push(normaliseServerName(server));
    }

    expect(firstNames).toEqual(DEFAULT_SERVER_NAMES);

    const second = await ensureCodexConfig({ nonInteractive: true });
    const secondNames = [];
    for (const server of second.config.mcp.servers ?? []) {
      secondNames.push(normaliseServerName(server));
    }

    expect(secondNames).toEqual(DEFAULT_SERVER_NAMES);
  });
});
