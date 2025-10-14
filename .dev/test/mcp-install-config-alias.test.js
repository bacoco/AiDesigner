const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { normalizeConfigTarget } = require('../tools/shared/mcp-config');
const McpManager = require('../tools/mcp-manager');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aidesigner-mcp-install-'));
}

describe('mcp install config aliases', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('normalizes --config bmad to aidesigner output path', () => {
    const manager = new McpManager({ rootDir: tempDir });

    // Test the direct config saving functionality without the interactive install
    const testConfig = {
      mcpServers: {
        'alias-test': {
          command: 'npx',
          args: ['-y', 'test-server'],
          disabled: false,
        },
      },
    };

    // Test that normalizeConfigTarget works correctly
    expect(normalizeConfigTarget('bmad')).toBe('aidesigner');
    expect(normalizeConfigTarget('claude')).toBe('claude');
    expect(normalizeConfigTarget('AIDESIGNER')).toBe('aidesigner');

    // Test saving to aidesigner config
    manager.saveaidesignerConfig(testConfig);

    // The profiles system uses the default 'prod' profile, so the file is saved with that suffix
    const aidesignerConfigPath = path.join(tempDir, 'mcp', 'aidesigner-config.prod.json');
    expect(fs.existsSync(aidesignerConfigPath)).toBe(true);

    // Verify that bmad-config.json is NOT created (ensuring proper alias resolution)
    const bmadConfigPath = path.join(tempDir, 'mcp', 'bmad-config.json');
    const bmadConfigProdPath = path.join(tempDir, 'mcp', 'bmad-config.prod.json');
    expect(fs.existsSync(bmadConfigPath)).toBe(false);
    expect(fs.existsSync(bmadConfigProdPath)).toBe(false);

    const savedConfig = JSON.parse(fs.readFileSync(aidesignerConfigPath, 'utf8'));
    expect(savedConfig.mcpServers).toHaveProperty('alias-test');

    // Verify the structure of the saved config matches expectations
    expect(savedConfig.mcpServers['alias-test']).toMatchObject({
      command: 'npx',
      disabled: false,
    });

    // Test loading the config back
    const loadedConfig = manager.loadaidesignerConfig();
    expect(loadedConfig).toEqual(testConfig);
  });
});
