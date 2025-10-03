const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { V6ModuleLoader } = require('../lib/v6-module-loader');

describe('V6ModuleLoader', () => {
  let tempRoot;
  const filePaths = {};

  const writeFile = async (relativePath, content) => {
    const absolutePath = path.join(tempRoot, relativePath);
    await fs.ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, content);
    return absolutePath;
  };

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'v6-loader-test-'));

    filePaths.alphaAgent = await writeFile(
      path.join('ModuleOne', 'agents', 'alpha.md'),
      [
        '# Alpha Agent',
        '',
        '```yaml',
        'agent:',
        '  id: Alpha-Agent',
        '  name: Alpha Agent',
        '  aliases:',
        '    - Shared Agent',
        '```',
        '',
        'Alpha agent description.',
        '',
      ].join('\n'),
    );

    filePaths.betaAgent = await writeFile(
      path.join('ModuleTwo', 'agents', 'beta.md'),
      [
        '# Beta Agent',
        '',
        '```yaml',
        'agent:',
        '  id: Beta-Agent',
        '  name: Beta Agent',
        '  aliases:',
        '    - shared agent',
        '```',
        '',
        'Beta agent description.',
        '',
      ].join('\n'),
    );

    filePaths.moduleOneTemplate = await writeFile(
      path.join('ModuleOne', 'templates', 'Welcome Template.yaml'),
      ['greeting: "Welcome"'].join('\n'),
    );

    filePaths.moduleTwoTemplate = await writeFile(
      path.join('ModuleTwo', 'templates', 'Summary Template.md'),
      ['# Summary Template', '', 'Content goes here.'].join('\n'),
    );

    filePaths.moduleOneChecklist = await writeFile(
      path.join('ModuleOne', 'checklists', 'Start Checklist.md'),
      ['- [ ] Step one', '- [ ] Step two'].join('\n'),
    );

    filePaths.moduleTwoChecklist = await writeFile(
      path.join('ModuleTwo', 'checklists', 'Finish Checklist.md'),
      ['- [ ] Finalize items', '- [ ] Celebrate'].join('\n'),
    );

    filePaths.moduleOneTask = await writeFile(
      path.join('ModuleOne', 'tasks', 'Init Task.md'),
      ['# Initialize project'].join('\n'),
    );

    filePaths.moduleTwoTask = await writeFile(
      path.join('ModuleTwo', 'tasks', 'Review Task.md'),
      ['# Review progress'].join('\n'),
    );

    filePaths.moduleOneData = await writeFile(
      path.join('ModuleOne', 'data', 'config.yaml'),
      ['setting: true'].join('\n'),
    );

    filePaths.moduleTwoData = await writeFile(
      path.join('ModuleTwo', 'data', 'note.md'),
      ['# Note', '', 'Remember to sync updates.'].join('\n'),
    );
  });

  afterEach(async () => {
    if (tempRoot && (await fs.pathExists(tempRoot))) {
      await fs.remove(tempRoot);
    }
  });

  test('initialize indexes modules and lists resources', async () => {
    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

    expect(loader.initialized).toBe(true);

    const agents = loader.listAgents();
    expect(agents).toHaveLength(2);
    expect(agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: 'moduleone',
          agentId: 'alpha-agent',
          path: filePaths.alphaAgent,
        }),
        expect.objectContaining({
          moduleId: 'moduletwo',
          agentId: 'beta-agent',
          path: filePaths.betaAgent,
        }),
      ]),
    );

    const templates = loader.listTemplates();
    expect(templates).toHaveLength(2);
    expect(templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: 'moduleone',
          name: 'welcome-template',
          path: filePaths.moduleOneTemplate,
        }),
        expect.objectContaining({
          moduleId: 'moduletwo',
          name: 'summary-template',
          path: filePaths.moduleTwoTemplate,
        }),
      ]),
    );

    const checklists = loader.listChecklists();
    expect(checklists).toHaveLength(2);
    expect(checklists).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: 'moduleone',
          name: 'start-checklist',
          path: filePaths.moduleOneChecklist,
        }),
        expect.objectContaining({
          moduleId: 'moduletwo',
          name: 'finish-checklist',
          path: filePaths.moduleTwoChecklist,
        }),
      ]),
    );

    const tasks = loader.listTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: 'moduleone',
          name: 'init-task',
          path: filePaths.moduleOneTask,
        }),
        expect.objectContaining({
          moduleId: 'moduletwo',
          name: 'review-task',
          path: filePaths.moduleTwoTask,
        }),
      ]),
    );

    const data = loader.listData();
    expect(data).toHaveLength(2);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: 'moduleone',
          name: 'config',
          path: filePaths.moduleOneData,
        }),
        expect.objectContaining({
          moduleId: 'moduletwo',
          name: 'note',
          path: filePaths.moduleTwoData,
        }),
      ]),
    );
  });

  test('loads resources lazily and tracks conflicts', async () => {
    const loader = new V6ModuleLoader(tempRoot);

    const agent = await loader.loadAgent('moduleone/alpha-agent');
    expect(agent).not.toBeNull();
    expect(agent).toEqual(
      expect.objectContaining({
        moduleId: 'moduleone',
        agentId: 'alpha-agent',
        filePath: filePaths.alphaAgent,
        config: expect.objectContaining({
          agent: expect.objectContaining({
            id: 'Alpha-Agent',
            aliases: expect.arrayContaining(['Shared Agent']),
          }),
        }),
      }),
    );
    expect(agent.content).toContain('Alpha agent description.');

    const betaByAlias = await loader.loadAgent('moduletwo/shared-agent');
    expect(betaByAlias).not.toBeNull();
    expect(betaByAlias.filePath).toBe(filePaths.betaAgent);

    const template = await loader.loadTemplate('summary-template');
    expect(template).not.toBeNull();
    expect(template).toEqual(
      expect.objectContaining({
        moduleId: 'moduletwo',
        name: 'summary-template',
        filePath: filePaths.moduleTwoTemplate,
        extension: '.md',
      }),
    );
    expect(template.content).toContain('# Summary Template');

    const checklist = await loader.loadChecklist('moduleone/start-checklist');
    expect(checklist).not.toBeNull();
    expect(checklist.filePath).toBe(filePaths.moduleOneChecklist);

    const task = await loader.loadTask('init-task');
    expect(task).not.toBeNull();
    expect(task.filePath).toBe(filePaths.moduleOneTask);

    const data = await loader.loadData('moduleone:config');
    expect(data).not.toBeNull();
    expect(data.filePath).toBe(filePaths.moduleOneData);
    expect(data.extension).toBe('.yaml');

    const conflicts = loader.conflicts.agents;
    expect(conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'shared-agent',
          existing: expect.objectContaining({ filePath: filePaths.alphaAgent }),
          incoming: expect.objectContaining({ filePath: filePaths.betaAgent }),
        }),
      ]),
    );
  });
});
