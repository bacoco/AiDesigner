const path = require('node:path');
const os = require('node:os');
const fs = require('fs-extra');
const cjson = require('comment-json');
const ideSetup = require('../tools/installer/lib/ide-setup');

const DEFAULT_MODEL = 'codex/gpt-4.1';
const DEFAULT_FALLBACKS = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini'];

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
});
