/**
 * Agilai Integration Bridge
 * Connects invisible orchestrator with Agilai core agents, tasks, and templates
 */

const fs = require('fs-extra');
const path = require('node:path');
const yaml = require('js-yaml');
const { LLMClient } = require('./llm-client');
const { V6ModuleLoader } = require('./v6-module-loader');
const contextEnrichment = require('../hooks/context-enrichment');

/**
 * Searches upward from the current directory to find the nearest package.json.
 * This function traverses parent directories until it finds a package.json file,
 * which indicates the package root.
 *
 * @returns {string} Absolute path to the package root directory
 * @throws {Error} If no package.json is found in any parent directory
 */
function resolvePackageRoot() {
  let currentDir = __dirname;
  const parsed = path.parse(currentDir);

  while (currentDir && currentDir !== parsed.root) {
    if (fs.pathExistsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  // Fallback: assume package root is two levels up from __dirname
  const fallbackPath = path.resolve(__dirname, '..', '..');
  console.warn(
    `[AgilaiBridge] Warning: No package.json found in directory tree. Falling back to ${fallbackPath}`,
  );
  return fallbackPath;
}

/**
 * Resolves the default V6 modules path by checking candidate directories.
 * Searches for valid V6 module structures in priority order:
 * 1. {root}/bmad/src/modules (development structure)
 * 2. {root}/dist/mcp/src/modules (built/distributed structure)
 *
 * @param {string} rootDirectory - The package root directory to search from
 * @returns {string|null} Absolute path to the V6 directory if found, null otherwise
 */
function resolveDefaultV6Path(rootDirectory) {
  const candidates = [path.join(rootDirectory, 'bmad'), path.join(rootDirectory, 'dist', 'mcp')];

  for (const candidate of candidates) {
    const modulesPath = path.join(candidate, 'src', 'modules');

    if (fs.pathExistsSync(modulesPath)) {
      return candidate;
    }
  }

  console.warn(
    `[AgilaiBridge] Warning: No V6 modules found in candidates: ${candidates.join(', ')}`,
  );
  return null;
}

const PACKAGE_ROOT = resolvePackageRoot();
const DEFAULT_CORE_PATH = path.join(PACKAGE_ROOT, 'agilai-core');
const DEFAULT_V6_PATH = resolveDefaultV6Path(PACKAGE_ROOT);

function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...target, ...source];
  }

  if (
    target &&
    typeof target === 'object' &&
    source &&
    typeof source === 'object' &&
    !Array.isArray(target) &&
    !Array.isArray(source)
  ) {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (key in result) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return source ?? target;
}

function arrayify(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

class AgilaiBridge {
  constructor(options = {}) {
    this.agilaiCorePath = options.agilaiCorePath || DEFAULT_CORE_PATH;
    this.agilaiV6Path = options.agilaiV6Path || DEFAULT_V6_PATH || path.join(PACKAGE_ROOT, 'bmad');
    this.llmClient = options.llmClient || new LLMClient();
    this.coreConfig = null;
    this.contextEnrichment = options.contextEnrichment || contextEnrichment;
    this.contextEnrichers = Array.isArray(options.contextEnrichers)
      ? [...options.contextEnrichers]
      : [];
  }

  /**
   * Initialize bridge and load core config
   */
  async initialize() {
    const legacyCoreExists = await fs.pathExists(this.agilaiCorePath);

    if (legacyCoreExists) {
      const configPath = path.join(this.agilaiCorePath, 'core-config.yaml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.coreConfig = yaml.load(configContent);
      this.environmentMode = 'legacy-core';
      this.environmentInfo = {
        mode: this.environmentMode,
        root: this.agilaiCorePath,
      };
      return this.coreConfig;
    }

    const modulesRoot = path.join(this.agilaiV6Path, 'src', 'modules');
    const hasV6Modules = await fs.pathExists(modulesRoot);

    if (!hasV6Modules) {
      throw new Error(
        `Agilai core not found at ${this.agilaiCorePath} and no v6 modules located at ${modulesRoot}`,
      );
    }

    this.environmentMode = 'v6-modules';
    this.v6Loader = new V6ModuleLoader(modulesRoot);
    await this.v6Loader.initialize();

    const v6ConfigPath = path.join(this.agilaiV6Path, 'src', 'core', 'core-config.yaml');

    if (await fs.pathExists(v6ConfigPath)) {
      const v6ConfigContent = await fs.readFile(v6ConfigPath, 'utf8');
      this.coreConfig = yaml.load(v6ConfigContent) || {};
    } else {
      this.coreConfig = { modules: this.v6Loader.getCatalogSummary() };
    }

    this.environmentInfo = {
      mode: this.environmentMode,
      root: this.agilaiV6Path,
      modulesRoot,
      catalog: this.v6Loader.getCatalogSummary(),
    };

    return this.coreConfig;
  }

  /**
   * Load an Agilai agent definition
   */
  async loadAgent(agentId) {
    if (this.environmentMode === 'v6-modules') {
      const record = await this.v6Loader.loadAgent(agentId);

      if (!record) {
        throw new Error(`Agent not found in v6 modules: ${agentId}`);
      }

      const agentConfig = record.config || {};

      return {
        id: record.agentId || agentId,
        path: record.filePath,
        content: record.content,
        config: agentConfig,
        persona: agentConfig.persona || {},
        agent: agentConfig.agent || {},
        dependencies: agentConfig.dependencies || {},
        moduleId: record.moduleId,
      };
    }

    const agentPath = path.join(this.agilaiCorePath, 'agents', `${agentId}.md`);

    if (!(await fs.pathExists(agentPath))) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const content = await fs.readFile(agentPath, 'utf8');

    // Parse YAML frontmatter/embedded config
    const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
    let agentConfig = {};

    if (yamlMatch) {
      agentConfig = yaml.load(yamlMatch[1]);
    }

    return {
      id: agentId,
      path: agentPath,
      content,
      config: agentConfig,
      persona: agentConfig.persona || {},
      agent: agentConfig.agent || {},
      dependencies: agentConfig.dependencies || {},
    };
  }

  /**
   * Execute an agent with given context
   */
  async runAgent(agentId, context = {}) {
    const agent = await this.loadAgent(agentId);

    // Build system prompt from agent persona
    const enrichment = await this.applyContextEnrichers(agent, context);

    const systemPrompt = this.buildAgentSystemPrompt(agent, enrichment);

    // Build user message from enriched context
    const userMessage = this.buildContextMessage(enrichment.context, enrichment);

    // Call LLM with agent persona
    const response = await this.llmClient.chat([{ role: 'user', content: userMessage }], {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 8192,
    });

    return {
      agentId,
      response,
      context: enrichment.context,
      enrichment,
    };
  }

  /**
   * Build system prompt from agent definition
   */
  buildAgentSystemPrompt(agent, enrichment = {}) {
    const persona = agent.persona || {};
    const agentInfo = agent.agent || {};

    let prompt = `You are ${agentInfo.name || agentInfo.id}, a ${agentInfo.title || 'Agilai agent'}.\n\n`;

    if (persona.role) {
      prompt += `**Role**: ${persona.role}\n`;
    }

    if (persona.identity) {
      prompt += `**Identity**: ${persona.identity}\n`;
    }

    if (persona.style) {
      prompt += `**Style**: ${persona.style}\n`;
    }

    if (persona.focus) {
      prompt += `**Focus**: ${persona.focus}\n\n`;
    }

    if (persona.core_principles && Array.isArray(persona.core_principles)) {
      prompt += `**Core Principles**:\n`;
      for (const principle of persona.core_principles) {
        prompt += `- ${principle}\n`;
      }
      prompt += '\n';
    }

    const personaFragments = arrayify(enrichment.personaFragments).filter(Boolean);

    if (personaFragments.length > 0) {
      prompt += `\n---\n\nAdditional Persona Signals:\n`;
      for (const fragment of personaFragments) {
        const formatted =
          typeof fragment === 'string' ? fragment : JSON.stringify(fragment, null, 2);
        prompt += `- ${formatted}\n`;
      }
      prompt += '\n';
    }

    // Add the full agent content for complete context
    prompt += `\n---\n\nFull Agent Definition:\n${agent.content}`;

    return prompt;
  }

  /**
   * Build context message for the agent
   */
  buildContextMessage(context, enrichment = {}) {
    let message = '';

    if (context.task) {
      message += `Task: ${context.task}\n\n`;
    }

    if (context.conversation && Array.isArray(context.conversation)) {
      message += `Conversation History:\n`;
      for (const msg of context.conversation.slice(-5)) {
        message += `- ${msg.role}: ${msg.content}\n`;
      }
      message += '\n';
    }

    if (context.requirements) {
      message += `Requirements:\n${JSON.stringify(context.requirements, null, 2)}\n\n`;
    }

    if (context.userInput) {
      message += `User Input:\n${context.userInput}\n\n`;
    }

    if (context.additionalContext) {
      message += `Additional Context:\n${context.additionalContext}\n`;
    }

    const sections = arrayify(enrichment.contextSections).filter(Boolean);

    for (const section of sections) {
      const title = section.title || 'Context';
      let body = section.body;

      if (body && typeof body === 'object') {
        body = JSON.stringify(body, null, 2);
      }

      if (typeof body === 'string') {
        message += `\n${title}:\n${body.trim()}\n`;
      }
    }

    return message || 'Please proceed with your role.';
  }

  /**
   * Register an additional context enricher
   */
  registerContextEnricher(enricher) {
    if (typeof enricher !== 'function') {
      throw new TypeError('Context enricher must be a function');
    }

    this.contextEnrichers.push(enricher);
  }

  /**
   * Apply context enrichment hooks prior to agent execution
   */
  async applyContextEnrichers(agent, context = {}) {
    const allEnrichers = [
      ...this.contextEnrichers,
      ...(this.contextEnrichment?.getContextEnrichers
        ? this.contextEnrichment.getContextEnrichers()
        : []),
    ];

    if (allEnrichers.length === 0) {
      return {
        context,
        personaFragments: [],
        contextSections: [],
      };
    }

    let workingContext = { ...context };
    const personaFragments = [];
    const contextSections = [];

    for (const enricher of allEnrichers) {
      if (typeof enricher !== 'function') {
        continue;
      }

      try {
        const result = await enricher({ agent, context: workingContext, bridge: this });

        if (!result) {
          continue;
        }

        if (result.contextUpdates) {
          workingContext = deepMerge(workingContext, result.contextUpdates);
        }

        if (result.persona) {
          personaFragments.push(
            ...arrayify(result.persona)
              .map((fragment) => (typeof fragment === 'string' ? fragment.trim() : fragment))
              .filter(Boolean),
          );
        }

        if (result.sections) {
          contextSections.push(...arrayify(result.sections));
        }
      } catch (error) {
        console.warn(
          `Context enricher failed for agent ${agent.id || agent.agent?.id || 'unknown'}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    return {
      context: workingContext,
      personaFragments,
      contextSections,
    };
  }

  /**
   * Load a task definition
   */
  async loadTask(taskName) {
    if (this.environmentMode === 'v6-modules') {
      const record = await this.v6Loader.loadTask(taskName);

      if (!record) {
        throw new Error(`Task not found in v6 modules: ${taskName}`);
      }

      return record.content;
    }

    const taskPath = path.join(this.agilaiCorePath, 'tasks', `${taskName}.md`);

    if (!(await fs.pathExists(taskPath))) {
      throw new Error(`Task not found: ${taskName}`);
    }

    return await fs.readFile(taskPath, 'utf8');
  }

  /**
   * Load a template
   */
  async loadTemplate(templateName) {
    // Try both .md and .yaml extensions
    if (this.environmentMode === 'v6-modules') {
      const record = await this.v6Loader.loadTemplate(templateName);

      if (!record) {
        throw new Error(`Template not found in v6 modules: ${templateName}`);
      }

      if (record.extension === '.yaml' || record.extension === '.yml') {
        return yaml.load(record.content);
      }

      return record.content;
    }

    for (const ext of ['.yaml', '.md']) {
      const templatePath = path.join(this.agilaiCorePath, 'templates', `${templateName}${ext}`);

      if (await fs.pathExists(templatePath)) {
        const content = await fs.readFile(templatePath, 'utf8');

        if (ext === '.yaml') {
          return yaml.load(content);
        }
        return content;
      }
    }

    throw new Error(`Template not found: ${templateName}`);
  }

  /**
   * Load a checklist
   */
  async loadChecklist(checklistName) {
    if (this.environmentMode === 'v6-modules') {
      const record = await this.v6Loader.loadChecklist(checklistName);

      if (!record) {
        throw new Error(`Checklist not found in v6 modules: ${checklistName}`);
      }

      return record.content;
    }

    const checklistPath = path.join(this.agilaiCorePath, 'checklists', `${checklistName}.md`);

    if (!(await fs.pathExists(checklistPath))) {
      throw new Error(`Checklist not found: ${checklistName}`);
    }

    return await fs.readFile(checklistPath, 'utf8');
  }

  /**
   * Get phase-specific agent mapping
   */
  getPhaseAgent(phase) {
    const phaseAgentMap = {
      analyst: 'analyst',
      pm: 'pm',
      architect: 'architect',
      sm: 'sm',
      dev: 'dev',
      qa: 'qa',
      ux: 'ux-expert',
      po: 'po',
    };

    return phaseAgentMap[phase] || 'analyst';
  }

  /**
   * Execute phase-specific workflow
   */
  async executePhaseWorkflow(phase, context = {}) {
    const agentId = this.getPhaseAgent(phase);
    const agent = await this.loadAgent(agentId);

    // Load phase-specific dependencies
    const dependencies = await this.loadAgentDependencies(agent);

    // Execute agent with full context
    const result = await this.runAgent(agentId, {
      ...context,
      phase,
      dependencies,
    });

    return result;
  }

  /**
   * Load all dependencies for an agent
   */
  async loadAgentDependencies(agent) {
    const dependencies = {
      tasks: {},
      templates: {},
      checklists: {},
      data: {},
    };

    const deps = agent.dependencies || {};

    // Load tasks
    if (deps.tasks && Array.isArray(deps.tasks)) {
      for (const taskName of deps.tasks) {
        try {
          dependencies.tasks[taskName] = await this.loadTask(taskName);
        } catch (error) {
          console.warn(`Failed to load task ${taskName}:`, error.message);
        }
      }
    }

    // Load templates
    if (deps.templates && Array.isArray(deps.templates)) {
      for (const templateName of deps.templates) {
        try {
          dependencies.templates[templateName] = await this.loadTemplate(templateName);
        } catch (error) {
          console.warn(`Failed to load template ${templateName}:`, error.message);
        }
      }
    }

    // Load checklists
    if (deps.checklists && Array.isArray(deps.checklists)) {
      for (const checklistName of deps.checklists) {
        try {
          dependencies.checklists[checklistName] = await this.loadChecklist(checklistName);
        } catch (error) {
          console.warn(`Failed to load checklist ${checklistName}:`, error.message);
        }
      }
    }

    return dependencies;
  }

  /**
   * Generate a document using a template
   */
  async generateDocument(templateName, context) {
    const template = await this.loadTemplate(templateName);

    // If template is YAML, extract structure
    if (typeof template === 'object') {
      return this.fillTemplate(template, context);
    }

    // If template is markdown, do simple substitution
    let content = template;
    for (const [key, value] of Object.entries(context)) {
      content = content.replaceAll(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return content;
  }

  /**
   * Fill a template object with context values
   */
  fillTemplate(template, context) {
    if (typeof template === 'string') {
      // Simple string substitution
      return template.replaceAll(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
    }

    if (Array.isArray(template)) {
      return template.map((item) => this.fillTemplate(item, context));
    }

    if (typeof template === 'object' && template !== null) {
      const result = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.fillTemplate(value, context);
      }
      return result;
    }

    return template;
  }

  /**
   * Get core configuration
   */
  getCoreConfig() {
    return this.coreConfig;
  }

  /**
   * Describe which Agilai environment was detected
   */
  getEnvironmentInfo() {
    return (
      this.environmentInfo || {
        mode: this.environmentMode,
        root: this.environmentMode === 'legacy-core' ? this.agilaiCorePath : this.agilaiV6Path,
      }
    );
  }

  /**
   * List available agents
   */
  async listAgents() {
    if (this.environmentMode === 'v6-modules') {
      return this.v6Loader.listAgents().map((agent) => `${agent.moduleId}/${agent.agentId}`);
    }

    const agentsDir = path.join(this.agilaiCorePath, 'agents');
    const files = await fs.readdir(agentsDir);

    return files.filter((file) => file.endsWith('.md')).map((file) => file.replace('.md', ''));
  }

  /**
   * List available tasks
   */
  async listTasks() {
    if (this.environmentMode === 'v6-modules') {
      return this.v6Loader.listTasks().map((task) => `${task.moduleId}/${task.name}`);
    }

    const tasksDir = path.join(this.agilaiCorePath, 'tasks');
    const files = await fs.readdir(tasksDir);

    return files.filter((file) => file.endsWith('.md')).map((file) => file.replace('.md', ''));
  }

  /**
   * List available templates
   */
  async listTemplates() {
    if (this.environmentMode === 'v6-modules') {
      return this.v6Loader
        .listTemplates()
        .map((template) => `${template.moduleId}/${template.name}`);
    }

    const templatesDir = path.join(this.agilaiCorePath, 'templates');
    const files = await fs.readdir(templatesDir);

    return files
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.md'))
      .map((file) => file.replace(/\.(yaml|md)$/, ''));
  }
}

module.exports = { AgilaiBridge };
