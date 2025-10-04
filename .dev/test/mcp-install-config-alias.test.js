const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

const { normalizeConfigTarget } = require('../tools/shared/mcp-config');
const McpManager = require('../tools/mcp-manager');
const inquirer = require('inquirer');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agilai-mcp-install-'));
}

describe('mcp install config aliases', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    inquirer.prompt.mockReset();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('normalizes --config bmad to agilai output path', async () => {
    const manager = new McpManager({ rootDir: tempDir });

    manager.registry.getServer = jest.fn().mockResolvedValue({
      id: 'test-server',
      name: 'Test Server',
      description: 'Test description',
      installType: 'npx',
      envVars: [],
    });

    inquirer.prompt.mockImplementation((questions) => {
      const question = Array.isArray(questions) ? questions[0] : questions;

      if (question.name === 'name') {
        return Promise.resolve({ name: 'alias-test' });
      }

      if (question.name === 'config') {
        return Promise.resolve({ config: question.default });
      }

      return Promise.resolve({});
    });

    await manager.install('test-server', {
      config: normalizeConfigTarget('bmad'),
    });

    const agilaiConfigPath = path.join(tempDir, 'mcp', 'agilai-config.json');
    expect(fs.existsSync(agilaiConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(agilaiConfigPath, 'utf8'));
    expect(config.mcpServers).toHaveProperty('alias-test');
  });
});
