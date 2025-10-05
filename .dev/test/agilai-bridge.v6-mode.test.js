const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

jest.mock('../hooks/context-enrichment', () => ({}), { virtual: true });

const { aidesignerBridge } = require('../lib/aidesigner-bridge.js');

async function createV6Workspace() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aidesigner-v6-workspace-'));
  const moduleRoot = path.join(tempRoot, 'src', 'modules', 'alpha');

  await fs.ensureDir(path.join(moduleRoot, 'agents'));
  await fs.ensureDir(path.join(moduleRoot, 'templates'));

  const agentContent = `# Alpha Agent\n\n\`\`\`yaml\nagent:\n  id: alpha-agent\n  name: Alpha Agent\n  persona: { role: "Planner" }\n\`\`\`\n\nSample agent body.`;
  await fs.writeFile(path.join(moduleRoot, 'agents', 'alpha-agent.md'), agentContent, 'utf8');

  const templateContent = 'Hello {{name}}!\nRemember to pursue {{goal}}.';
  await fs.writeFile(
    path.join(moduleRoot, 'templates', 'alpha-template.md'),
    templateContent,
    'utf8',
  );

  return tempRoot;
}

describe('aidesignerBridge V6 module detection', () => {
  let tempRoot;
  let pathExistsSpy;
  let readFileSpy;
  let realPathExists;
  let realReadFile;

  afterEach(async () => {
    if (pathExistsSpy) {
      pathExistsSpy.mockRestore();
      pathExistsSpy = undefined;
    }

    if (readFileSpy) {
      readFileSpy.mockRestore();
      readFileSpy = undefined;
    }

    if (tempRoot && (await fs.pathExists(tempRoot))) {
      await fs.remove(tempRoot);
      tempRoot = undefined;
    }
  });

  test('initializes in V6 mode and delegates to V6ModuleLoader', async () => {
    tempRoot = await createV6Workspace();

    realPathExists = fs.pathExists;
    realReadFile = fs.readFile;

    pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(async (targetPath) => {
      if (targetPath.startsWith(tempRoot)) {
        return realPathExists.call(fs, targetPath);
      }

      return false;
    });

    readFileSpy = jest.spyOn(fs, 'readFile').mockImplementation(async (targetPath, ...args) => {
      if (targetPath.startsWith(tempRoot)) {
        return realReadFile.call(fs, targetPath, ...args);
      }

      throw new Error(`Unexpected readFile access during test: ${targetPath}`);
    });

    const bridge = new aidesignerBridge({
      aidesignerCorePath: path.join(tempRoot, 'missing-core'),
      aidesignerV6Path: tempRoot,
      llmClient: { chat: jest.fn() },
    });

    const config = await bridge.initialize();

    expect(bridge.getEnvironmentInfo().mode).toBe('v6-modules');

    const envInfo = bridge.getEnvironmentInfo();
    expect(envInfo.root).toBe(tempRoot);
    expect(envInfo.modulesRoot).toBe(path.join(tempRoot, 'src', 'modules'));
    expect(envInfo.catalog).toMatchObject({
      moduleCount: 1,
      agents: 1,
      templates: 1,
      tasks: 0,
      checklists: 0,
      data: 0,
    });

    expect(config.modules).toMatchObject(envInfo.catalog);

    const agent = await bridge.loadAgent('alpha/alpha-agent');
    expect(agent).toMatchObject({
      moduleId: 'alpha',
      id: 'alpha-agent',
    });
    expect(agent.content).toContain('Sample agent body');

    const template = await bridge.loadTemplate('alpha/alpha-template');
    expect(template).toContain('Hello {{name}}!');

    expect(pathExistsSpy).toHaveBeenCalledWith(path.join(tempRoot, 'missing-core'));
  });
});
