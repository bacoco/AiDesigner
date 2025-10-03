const path = require('node:path');
const os = require('node:os');
const fs = require('fs-extra');
const cjson = require('comment-json');
const ideSetup = require('../tools/installer/lib/ide-setup');

// These default values must match tools/installer/lib/ide-setup.js defaultModelSettings
const DEFAULT_MODEL = 'openai/gpt-4.1';
const DEFAULT_FALLBACKS = ['openai/gpt-4.1-mini', 'anthropic/claude-3.5-sonnet'];

const preconfiguredSettings = {
  opencode: { useAgentPrefix: false, useCommandPrefix: false },
  selectedPackages: { includeCore: false, packs: [] },
};

async function setupFixture(projectName) {
  const source = path.join(__dirname, 'fixtures', 'opencode', projectName);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `bmad-opencode-${projectName}-`));
  await fs.copy(source, tmpDir);
  return tmpDir;
}

describe('setupOpenCode model defaults', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates opencode.jsonc with default model entries for a fresh project', async () => {
    const projectDir = await setupFixture('base');

    try {
      await ideSetup.setupOpenCode(projectDir, null, null, preconfiguredSettings);

      const configPath = path.join(projectDir, 'opencode.jsonc');
      expect(await fs.pathExists(configPath)).toBe(true);

      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = cjson.parse(raw);

      expect(parsed.model).toBe(DEFAULT_MODEL);
      expect(parsed.fallbackModels).toEqual(DEFAULT_FALLBACKS);
    } finally {
      await fs.remove(projectDir);
    }
  });

  it('merges default model settings into an existing configuration without overriding custom entries', async () => {
    const projectDir = await setupFixture('existing');

    try {
      await ideSetup.setupOpenCode(projectDir, null, null, preconfiguredSettings);

      const configPath = path.join(projectDir, 'opencode.jsonc');
      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = cjson.parse(raw);

      expect(parsed.model).toBe(DEFAULT_MODEL);
      const instructions = [...(parsed.instructions || [])];
      expect(instructions).toEqual(
        expect.arrayContaining(['./custom/instructions.yaml', '.bmad-core/core-config.yaml']),
      );
      expect(parsed.fallbackModels).toEqual(['custom/provider-model', ...DEFAULT_FALLBACKS]);
    } finally {
      await fs.remove(projectDir);
    }
  });

  it('handles empty strings and case variations in existing fallbackModels', async () => {
    const projectDir = await setupFixture('base');

    try {
      // Create a config with empty strings and case variations
      const configPath = path.join(projectDir, 'opencode.jsonc');
      const testConfig = {
        fallbackModels: ['', 'Anthropic/CLAUDE-3.5-sonnet', 'custom/model', '   '],
      };
      await fs.writeFile(configPath, cjson.stringify(testConfig, null, 2));

      await ideSetup.setupOpenCode(projectDir, null, null, preconfiguredSettings);

      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = cjson.parse(raw);

      // Should have model added
      expect(parsed.model).toBe(DEFAULT_MODEL);

      // Should preserve the original entries including empty strings (not filtered from original array)
      // Should not duplicate 'anthropic/claude-3.5-sonnet' due to case-insensitive matching
      // Should add 'openai/gpt-4.1-mini' which wasn't present
      expect(parsed.fallbackModels).toContain('Anthropic/CLAUDE-3.5-sonnet');
      expect(parsed.fallbackModels).toContain('custom/model');
      expect(parsed.fallbackModels).toContain('openai/gpt-4.1-mini');
      expect(parsed.fallbackModels).toHaveLength(5); // '', 'Anthropic/CLAUDE...', 'custom/model', '   ', 'openai/gpt-4.1-mini'
    } finally {
      await fs.remove(projectDir);
    }
  });

  it('handles empty model field by setting default', async () => {
    const projectDir = await setupFixture('base');

    try {
      // Create a config with empty model
      const configPath = path.join(projectDir, 'opencode.jsonc');
      const testConfig = {
        model: '   ',
        fallbackModels: ['custom/fallback'],
      };
      await fs.writeFile(configPath, cjson.stringify(testConfig, null, 2));

      await ideSetup.setupOpenCode(projectDir, null, null, preconfiguredSettings);

      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = cjson.parse(raw);

      // Empty/whitespace model should be replaced with default
      expect(parsed.model).toBe(DEFAULT_MODEL);
      expect(parsed.fallbackModels).toEqual(['custom/fallback', ...DEFAULT_FALLBACKS]);
    } finally {
      await fs.remove(projectDir);
    }
  });
});
