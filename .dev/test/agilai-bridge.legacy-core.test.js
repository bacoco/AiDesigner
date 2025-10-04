const fs = require('fs-extra');
const path = require('node:path');
const yaml = require('js-yaml');

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
});
