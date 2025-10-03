/**
 * BMAD Integration Bridge
 * Connects invisible orchestrator with BMAD core agents, tasks, and templates
 */

const fs = require('fs-extra');
const path = require('node:path');
const yaml = require('js-yaml');
const { LLMClient } = require('./llm-client');
const { V6ModuleLoader } = require('./v6-module-loader');

class BMADBridge {
  constructor(options = {}) {
    this.bmadCorePath = options.bmadCorePath || path.join(__dirname, '..', 'bmad-core');
    this.bmadV6Path = options.bmadV6Path || path.join(__dirname, '..', 'bmad');
    this.llmClient = options.llmClient || new LLMClient();
    this.coreConfig = null;

    this.environmentMode = 'legacy-core';
    this.environmentInfo = null;
    this.v6Loader = null;

  }

  /**
   * Initialize bridge and load core config
   */
  async initialize() {
    const legacyCoreExists = await fs.pathExists(this.bmadCorePath);

    if (legacyCoreExists) {
      const configPath = path.join(this.bmadCorePath, 'core-config.yaml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.coreConfig = yaml.load(configContent);
      this.environmentMode = 'legacy-core';
      this.environmentInfo = {
        mode: this.environmentMode,
        root: this.bmadCorePath,
      };
      return this.coreConfig;
    }

    const modulesRoot = path.join(this.bmadV6Path, 'src', 'modules');
    const hasV6Modules = await fs.pathExists(modulesRoot);

    if (!hasV6Modules) {
      throw new Error(
        `BMAD core not found at ${this.bmadCorePath} and no v6 modules located at ${modulesRoot}`,
      );
    }

    this.environmentMode = 'v6-modules';
    this.v6Loader = new V6ModuleLoader(modulesRoot);
    await this.v6Loader.initialize();

    const v6ConfigPath = path.join(this.bmadV6Path, 'src', 'core', 'core-config.yaml');

    if (await fs.pathExists(v6ConfigPath)) {
      const v6ConfigContent = await fs.readFile(v6ConfigPath, 'utf8');
      this.coreConfig = yaml.load(v6ConfigContent) || {};
    } else {
      this.coreConfig = { modules: this.v6Loader.getCatalogSummary() };
    }

    this.environmentInfo = {
      mode: this.environmentMode,
      root: this.bmadV6Path,
      modulesRoot,
      catalog: this.v6Loader.getCatalogSummary(),
    };

    return this.coreConfig;
  }

  /**
   * Load a BMAD agent definition
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

    const agentPath = path.join(this.bmadCorePath, 'agents', `${agentId}.md`);

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
    const systemPrompt = this.buildAgentSystemPrompt(agent);

    // Allow registered injectors to enrich the context before prompt assembly
    const enrichedContext = await this.applyContextInjectors(agentId, context, agent);

    // Build user message from context
    const userMessage = this.buildContextMessage(enrichedContext);

    // Call LLM with agent persona
    const response = await this.llmClient.chat([{ role: 'user', content: userMessage }], {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 8192,
    });

    return {
      agentId,
      response,
      context,
    };
  }

  /**
   * Build system prompt from agent definition
   */
  buildAgentSystemPrompt(agent) {
    const persona = agent.persona || {};
    const agentInfo = agent.agent || {};

    let prompt = `You are ${agentInfo.name || agentInfo.id}, a ${agentInfo.title || 'BMAD agent'}.\n\n`;

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

    // Add the full agent content for complete context
    prompt += `\n---\n\nFull Agent Definition:\n${agent.content}`;

    return prompt;
  }

  /**
   * Build context message for the agent
   */
  buildContextMessage(context) {
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

    if (Array.isArray(context.targetedSections) && context.targetedSections.length > 0) {
      message += '\nTargeted Context Injection:\n';
      for (const section of context.targetedSections) {
        const title = section.title || 'Context';
        const body = section.body || '';
        const priority = section.priority == null ? '' : ` (priority: ${section.priority})`;
        message += `\n### ${title}${priority}\n${body}\n`;
      }
      message += '\n';
    }

    return message || 'Please proceed with your role.';
  }

  /**
   * Register a context injector that can add targeted prompt sections
   * @param {Function} injector - async function ({ agentId, context, agent, bridge }) => ({ merge?, sections? })
   */
  registerContextInjector(injector) {
    if (typeof injector === 'function') {
      this.contextInjectors.push(injector);
    }
  }

  /**
   * Clear all registered context injectors
   */
  clearContextInjectors() {
    this.contextInjectors = [];
  }

  /**
   * Apply registered context injectors to enrich the base context
   */
  async applyContextInjectors(agentId, context = {}, agent = null) {
    if (this.contextInjectors.length === 0) {
      return context;
    }

    let workingContext = { ...context };
    const aggregatedSections = Array.isArray(workingContext.targetedSections)
      ? [...workingContext.targetedSections]
      : [];

    for (const injector of this.contextInjectors) {
      try {
        const result = await injector({
          agentId,
          context: workingContext,
          agent,
          bridge: this,
        });

        if (!result) {
          continue;
        }

        if (result.merge && typeof result.merge === 'object') {
          workingContext = {
            ...workingContext,
            ...result.merge,
          };
        }

        if (Array.isArray(result.sections)) {
          for (const section of result.sections) {
            if (section && typeof section === 'object') {
              aggregatedSections.push(section);
            }
          }
        }
      } catch (error) {
        // Swallow injector errors but surface a breadcrumb in the context for debugging
        aggregatedSections.push({
          title: 'Context Injector Warning',
          body: `Injector error for agent ${agentId}: ${error instanceof Error ? error.message : error}`,
          priority: 'low',
        });
      }
    }

    if (aggregatedSections.length > 0) {
      workingContext = {
        ...workingContext,
        targetedSections: aggregatedSections,
      };
    }

    return workingContext;
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

    const taskPath = path.join(this.bmadCorePath, 'tasks', `${taskName}.md`);

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
      const templatePath = path.join(this.bmadCorePath, 'templates', `${templateName}${ext}`);

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

    const checklistPath = path.join(this.bmadCorePath, 'checklists', `${checklistName}.md`);

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
   * Describe which BMAD environment was detected
   */
  getEnvironmentInfo() {
    return (
      this.environmentInfo || {
        mode: this.environmentMode,
        root: this.environmentMode === 'legacy-core' ? this.bmadCorePath : this.bmadV6Path,
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

    const agentsDir = path.join(this.bmadCorePath, 'agents');
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

    const tasksDir = path.join(this.bmadCorePath, 'tasks');
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

    const templatesDir = path.join(this.bmadCorePath, 'templates');
    const files = await fs.readdir(templatesDir);

    return files
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.md'))
      .map((file) => file.replace(/\.(yaml|md)$/, ''));
  }
}

module.exports = { BMADBridge };
