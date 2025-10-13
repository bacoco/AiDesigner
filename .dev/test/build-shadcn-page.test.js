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
    constraints: { spacingStep: 8, borderRadiusStep: 4 },
  };

  beforeEach(async () => {
    await fs.rm(absoluteTempDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await fs.rm(absoluteTempDir, { recursive: true, force: true });
  });

  it('writes generated files within the project directory using detected components', async () => {
    const outputDir = path.join(relativeTempDir, 'valid-output');
    const componentMap = {
      Button: {
        detect: { role: ['button'], classesLike: ['btn-primary', 'cta'] },
        variants: { intent: ['primary', 'secondary'], size: ['sm', 'lg'] },
        states: ['hover', 'focus'],
        mappings: { shadcn: '<Button variant="{intent}" size="{size}">{slot}</Button>' },
      },
      Card: {
        detect: { classesLike: ['card', 'rounded'] },
        mappings: {
          shadcn:
            '<Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{content}</CardContent></Card>',
        },
      },
      Input: {
        detect: { role: ['textbox'], classesLike: ['form-input'] },
        states: ['focus'],
        mappings: { shadcn: '<Input placeholder="{placeholder}" />' },
      },
    };

    await buildShadcnPage(tokens, componentMap, outputDir);

    const pagePath = path.join(absoluteTempDir, 'valid-output', 'page.tsx');
    const stylesPath = path.join(absoluteTempDir, 'valid-output', 'globals.css');

    const pageContent = await fs.readFile(pagePath, 'utf-8');
    const stylesContent = await fs.readFile(stylesPath, 'utf-8');

    expect(pageContent).toContain('AiDesigner Preview');
    expect(pageContent).toContain('Button variant="default"');
    expect(pageContent).toContain('Variants → intent: primary, secondary • size: sm, lg');
    expect(pageContent).toContain('Input placeholder="Enter value"');
    expect(pageContent).toContain('Theme snapshot');
    expect(pageContent).toContain('Roles: button');
    expect(stylesContent).toContain('--fg: #111111');
    expect(stylesContent).toContain('font-family: Inter, sans-serif');
    expect(pageContent).toContain('Spacing step: 8px');
    expect(pageContent).toContain('Radius step: 4px');
  });

  it('rejects attempts to escape the project root', async () => {
    await expect(buildShadcnPage(tokens, {}, path.join('..', 'outside-output'))).rejects.toThrow(
      'Invalid output directory: path traversal detected',
    );
  });
});
