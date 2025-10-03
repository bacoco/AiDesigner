const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { V6ModuleLoader } = require('../lib/v6-module-loader');

describe('V6ModuleLoader', () => {
  let tempRoot;
  const filePaths = {};

  /**
   * Writes a file to the temporary test directory.
   * @param {string} relativePath - Path relative to tempRoot
   * @param {string} content - File content to write
   * @returns {Promise<string>} Absolute path to the created file
   */
  const writeFile = async (relativePath, content) => {
    const absolutePath = path.join(tempRoot, relativePath);
    await fs.ensureDir(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, content);
    return absolutePath;
  };

  /**
   * Creates an agent file with YAML frontmatter.
   * @param {string} id - Agent ID
   * @param {string} name - Agent name
   * @param {string[]} [aliases=[]] - Agent aliases
   * @returns {string} Agent file content
   */
  const createAgentContent = (id, name, aliases = []) => {
    const lines = ['# ' + name, '', '```yaml', 'agent:', '  id: ' + id, '  name: ' + name];
    if (aliases.length > 0) {
      lines.push('  aliases:');
      for (const alias of aliases) {
        lines.push('    - ' + alias);
      }
    }
    lines.push('```', '', name + ' description.', '');
    return lines.join('\n');
  };

  /**
   * Creates a simple template file content.
   * @param {string} name - Template name
   * @param {string} [content=''] - Optional template content
   * @returns {string} Template file content
   */
  const createTemplateContent = (name, content = '') => {
    return content || ['greeting: "Welcome to ' + name + '"'].join('\n');
  };

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'v6-loader-test-'));

    filePaths.alphaAgent = await writeFile(
      path.join('ModuleOne', 'agents', 'alpha.md'),
      createAgentContent('Alpha-Agent', 'Alpha Agent', ['Shared Agent']),
    );

    filePaths.betaAgent = await writeFile(
      path.join('ModuleTwo', 'agents', 'beta.md'),
      createAgentContent('Beta-Agent', 'Beta Agent', ['shared agent']),
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

  test('loads agents lazily with proper config parsing', async () => {
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
    expect(agent.content).toContain('Alpha Agent description.');
  });

  test('resolves agents by alias case-insensitively', async () => {
    const loader = new V6ModuleLoader(tempRoot);

    const betaByAlias = await loader.loadAgent('moduletwo/shared-agent');
    expect(betaByAlias).not.toBeNull();
    expect(betaByAlias.filePath).toBe(filePaths.betaAgent);
  });

  test('loads templates with extension metadata', async () => {
    const loader = new V6ModuleLoader(tempRoot);

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
  });

  test('loads checklists and tasks by identifier', async () => {
    const loader = new V6ModuleLoader(tempRoot);

    const checklist = await loader.loadChecklist('moduleone/start-checklist');
    expect(checklist).not.toBeNull();
    expect(checklist.filePath).toBe(filePaths.moduleOneChecklist);

    const task = await loader.loadTask('init-task');
    expect(task).not.toBeNull();
    expect(task.filePath).toBe(filePaths.moduleOneTask);
  });

  test('loads data files with extension metadata', async () => {
    const loader = new V6ModuleLoader(tempRoot);

    const data = await loader.loadData('moduleone:config');
    expect(data).not.toBeNull();
    expect(data.filePath).toBe(filePaths.moduleOneData);
    expect(data.extension).toBe('.yaml');
  });

  test('tracks alias conflicts between modules', async () => {
    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

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

  test('initialize() is idempotent and does not double-index', async () => {
    const loader = new V6ModuleLoader(tempRoot);

    await loader.initialize();
    expect(loader.initialized).toBe(true);

    const firstAgentCount = loader.listAgents().length;
    const firstTemplateCount = loader.listTemplates().length;

    await loader.initialize();
    expect(loader.initialized).toBe(true);

    expect(loader.listAgents().length).toBe(firstAgentCount);
    expect(loader.listTemplates().length).toBe(firstTemplateCount);
  });

  test('getCatalogSummary() returns comprehensive statistics', async () => {
    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

    const summary = loader.getCatalogSummary();

    expect(summary).toEqual(
      expect.objectContaining({
        moduleCount: 2,
        agents: 2,
        templates: 2,
        checklists: 2,
        tasks: 2,
        data: 2,
      }),
    );

    expect(summary.conflicts).toBeDefined();
    expect(summary.conflicts.agents).toHaveLength(1);
  });

  test('returns null for non-existent resources', async () => {
    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

    const agent = await loader.loadAgent('non-existent-agent');
    expect(agent).toBeNull();

    const template = await loader.loadTemplate('non-existent-template');
    expect(template).toBeNull();

    const checklist = await loader.loadChecklist('non-existent-checklist');
    expect(checklist).toBeNull();

    const task = await loader.loadTask('non-existent-task');
    expect(task).toBeNull();

    const data = await loader.loadData('non-existent-data');
    expect(data).toBeNull();
  });

  test('handles malformed agent YAML gracefully', async () => {
    const malformedAgent = await writeFile(
      path.join('ModuleOne', 'agents', 'malformed.md'),
      [
        '# Malformed Agent',
        '',
        '```yaml',
        'agent:',
        '  id: Malformed-Agent',
        '  invalid yaml: [unclosed bracket',
        '```',
        '',
        'This agent has malformed YAML.',
      ].join('\n'),
    );

    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

    const agents = loader.listAgents();
    const malformedRecord = agents.find((a) => a.path === malformedAgent);

    expect(malformedRecord).toBeDefined();
    expect(malformedRecord.agentId).toBe('malformed');

    const loadedAgent = await loader.loadAgent('malformed');
    expect(loadedAgent).not.toBeNull();
    expect(loadedAgent.config).toEqual({});
  });

  test('indexes resources in nested subdirectories', async () => {
    const nestedTask = await writeFile(
      path.join('ModuleOne', 'tasks', 'nested', 'deep', 'nested-task.md'),
      ['# Nested Task', '', 'This task is in a nested directory.'].join('\n'),
    );

    const nestedTemplate = await writeFile(
      path.join('ModuleTwo', 'templates', 'subfolder', 'nested-template.yaml'),
      ['title: "Nested Template"'].join('\n'),
    );

    const loader = new V6ModuleLoader(tempRoot);
    await loader.initialize();

    const tasks = loader.listTasks();
    const nestedTaskRecord = tasks.find((t) => t.path === nestedTask);
    expect(nestedTaskRecord).toBeDefined();
    expect(nestedTaskRecord.name).toBe('nested-task');

    const templates = loader.listTemplates();
    const nestedTemplateRecord = templates.find((t) => t.path === nestedTemplate);
    expect(nestedTemplateRecord).toBeDefined();
    expect(nestedTemplateRecord.name).toBe('nested-template');

    const loadedTask = await loader.loadTask('nested-task');
    expect(loadedTask).not.toBeNull();
    expect(loadedTask.filePath).toBe(nestedTask);

    const loadedTemplate = await loader.loadTemplate('nested-template');
    expect(loadedTemplate).not.toBeNull();
    expect(loadedTemplate.filePath).toBe(nestedTemplate);
  });
});
