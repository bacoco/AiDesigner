const os = require('node:os');
const path = require('node:path');
const fs = require('fs-extra');
const { BrownfieldAnalyzer } = require('../lib/brownfield-analyzer');

describe('BrownfieldAnalyzer.detectTechStack', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-brownfield-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  it.each([
    [
      'without a dependencies block',
      {
        name: 'no-deps',
        version: '1.0.0',
        devDependencies: {
          jest: '^29.0.0',
        },
      },
    ],
    [
      'without a devDependencies block',
      {
        name: 'no-dev-deps',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
        },
      },
    ],
  ])('resolves %s', async (_, packageJson) => {
    await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);
    const analyzer = new BrownfieldAnalyzer(tempDir);

    await expect(analyzer.detectTechStack()).resolves.toMatchObject({
      language: 'JavaScript/TypeScript',
    });
  });
});
