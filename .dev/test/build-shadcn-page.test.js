const fs = require('node:fs/promises');
const path = require('node:path');
const { buildShadcnPage } = require('../../packages/codegen/src/react-shadcn');

describe('buildShadcnPage', () => {
  const projectRoot = process.cwd();
  const relativeTempDir = path.join('tmp-shadcn-tests');
  const absoluteTempDir = path.join(projectRoot, relativeTempDir);

  const tokens = {
    meta: { source: 'url', url: 'https://example.com', capturedAt: '2024-01-01T00:00:00.000Z' },
    primitives: {
      color: { 'base/fg': '#111111', 'base/bg': '#ffffff' },
      font: { sans: { family: 'Inter', weights: [400, 600] } },
      space: {},
    },
    semantic: {},
  };

  beforeEach(async () => {
    await fs.rm(absoluteTempDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.rm(absoluteTempDir, { recursive: true, force: true });
  });

  it('writes generated files within the project directory', async () => {
    const outputDir = path.join(relativeTempDir, 'valid-output');

    await buildShadcnPage(tokens, {}, outputDir);

    const pagePath = path.join(absoluteTempDir, 'valid-output', 'page.tsx');
    const stylesPath = path.join(absoluteTempDir, 'valid-output', 'globals.css');

    const pageContent = await fs.readFile(pagePath, 'utf-8');
    const stylesContent = await fs.readFile(stylesPath, 'utf-8');

    expect(pageContent).toContain('AiDesigner POC');
    expect(pageContent).toContain('<main');
    expect(stylesContent).toContain(`--fg:${tokens.primitives.color['base/fg']}`);
    expect(stylesContent).toContain(`font-family:${tokens.primitives.font.sans.family}`);
  });

  it('rejects attempts to escape the project root', async () => {
    await expect(buildShadcnPage(tokens, {}, path.join('..', 'outside-output'))).rejects.toThrow(
      'Invalid output directory: path traversal detected',
    );
  });
});
