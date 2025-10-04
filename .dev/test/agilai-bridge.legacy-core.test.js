const fs = require('fs-extra');
const path = require('node:path');
const yaml = require('js-yaml');
const os = require('node:os');

jest.mock('../hooks/context-enrichment', () => ({}), { virtual: true });

const { AgilaiBridge } = require('../lib/agilai-bridge.js');

describe('AgilaiBridge legacy core detection', () => {
  test('initializes from package root using default paths', async () => {
    const bridge = new AgilaiBridge({ llmClient: { chat: jest.fn() } });

    const config = await bridge.initialize();

    const packageRoot = path.resolve(__dirname, '..', '..');
    const expectedConfigPath = path.join(packageRoot, 'agilai-core', 'core-config.yaml');
    const expectedConfig = yaml.load(await fs.readFile(expectedConfigPath, 'utf8'));

    expect(config).toEqual(expectedConfig);
    expect(bridge.getCoreConfig()).toEqual(expectedConfig);
    expect(bridge.getEnvironmentInfo()).toMatchObject({
      mode: 'legacy-core',
      root: path.join(packageRoot, 'agilai-core'),
    });
  });

  test('uses custom agilaiCorePath when provided', async () => {
    const packageRoot = path.resolve(__dirname, '..', '..');
    const customPath = path.join(packageRoot, 'agilai-core');

    const bridge = new AgilaiBridge({
      agilaiCorePath: customPath,
      llmClient: { chat: jest.fn() },
    });

    const config = await bridge.initialize();

    expect(bridge.getEnvironmentInfo()).toMatchObject({
      mode: 'legacy-core',
      root: customPath,
    });
    expect(config).toBeTruthy();
  });

  test('falls back to V6 when legacy core not found', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agilai-v6-test-'));

    try {
      // Create a minimal V6 structure
      const modulesRoot = path.join(tempRoot, 'bmad', 'src', 'modules', 'test-module');
      await fs.ensureDir(path.join(modulesRoot, 'agents'));

      const agentContent = `# Test Agent\n\n\`\`\`yaml\nagent:\n  id: test-agent\n  name: Test Agent\n\`\`\`\n\nTest content.`;
      await fs.writeFile(path.join(modulesRoot, 'agents', 'test-agent.md'), agentContent, 'utf8');

      const bridge = new AgilaiBridge({
        agilaiCorePath: path.join(tempRoot, 'missing-core'),
        agilaiV6Path: path.join(tempRoot, 'bmad'),
        llmClient: { chat: jest.fn() },
      });

      const config = await bridge.initialize();

      expect(bridge.getEnvironmentInfo().mode).toBe('v6-modules');
      expect(config).toBeTruthy();
    } finally {
      await fs.remove(tempRoot);
    }
  });

  test('throws error when neither legacy core nor V6 modules found', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agilai-empty-test-'));

    try {
      const bridge = new AgilaiBridge({
        agilaiCorePath: path.join(tempRoot, 'missing-core'),
        agilaiV6Path: path.join(tempRoot, 'missing-v6'),
        llmClient: { chat: jest.fn() },
      });

      await expect(bridge.initialize()).rejects.toThrow(/Agilai core not found/);
    } finally {
      await fs.remove(tempRoot);
    }
  });
});
