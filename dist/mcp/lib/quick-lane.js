/**
 * Quick Lane Engine
 * Uses Spec Kit templates with LLM for rapid specification generation
 * Outputs to standard BMAD docs/ structure
 */

const fs = require('fs-extra');
const path = require('node:path');

class QuickLane {
  constructor(projectPath = process.cwd(), options = {}) {
    this.projectPath = projectPath;
    this.docsDir = path.join(projectPath, 'docs');
    this.storiesDir = path.join(this.docsDir, 'stories');
    this.templatesDir = path.join(__dirname, 'spec-kit-templates');
    this.llmClient = options.llmClient;

    // Templates
    this.templates = {
      spec: null,
      plan: null,
      tasks: null,
    };
  }

  /**
   * Initialize and load templates
   */
  async initialize() {
    await fs.ensureDir(this.docsDir);
    await fs.ensureDir(this.storiesDir);

    // Load templates
    this.templates.spec = await fs.readFile(
      path.join(this.templatesDir, 'spec-template.md'),
      'utf8',
    );
    this.templates.plan = await fs.readFile(
      path.join(this.templatesDir, 'plan-template.md'),
      'utf8',
    );
    this.templates.tasks = await fs.readFile(
      path.join(this.templatesDir, 'tasks-template.md'),
      'utf8',
    );
  }

  /**
   * Execute quick lane workflow
   * Generates spec → plan → tasks using templates
   */
  async execute(userRequest, context = {}) {
    if (!this.llmClient) {
      throw new Error('LLM client not configured. Pass llmClient in options.');
    }

    const result = {
      userRequest,
      files: [],
      artifacts: {},
    };

    // Step 1: Generate specification (PRD)
    console.error('[Quick Lane] Generating specification...');
    const spec = await this.generateSpec(userRequest, context);
    const prdPath = path.join(this.docsDir, 'prd.md');
    await fs.writeFile(prdPath, spec);
    result.files.push('docs/prd.md');
    result.artifacts.prd = spec;

    // Step 2: Generate implementation plan (Architecture)
    console.error('[Quick Lane] Generating implementation plan...');
    const plan = await this.generatePlan(spec, context);
    const archPath = path.join(this.docsDir, 'architecture.md');
    await fs.writeFile(archPath, plan);
    result.files.push('docs/architecture.md');
    result.artifacts.architecture = plan;

    // Step 3: Generate tasks (Stories)
    console.error('[Quick Lane] Generating task breakdown...');
    const tasks = await this.generateTasks(plan, context);
    const storyFiles = await this.writeTasks(tasks);
    result.files.push(...storyFiles);
    result.artifacts.stories = tasks;

    return result;
  }

  /**
   * Generate specification from template
   */
  async generateSpec(userRequest, context = {}) {
    const prompt = this.templates.spec.replace('{{USER_REQUEST}}', userRequest);

    const systemPrompt = `You are a technical specification writer. Generate a clear, concise specification based on the template provided. Fill in all sections with specific, actionable details. Focus on WHAT and WHY, not implementation details.`;

    const response = await this.llmClient.chat(
      [
        {
          role: 'user',
          content: `${prompt}\n\nAdditional context: ${JSON.stringify(context, null, 2)}`,
        },
      ],
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
      },
    );

    return this.cleanLLMResponse(response);
  }

  /**
   * Generate implementation plan from spec
   */
  async generatePlan(specification, context = {}) {
    const prompt = this.templates.plan.replace('{{SPECIFICATION}}', specification);

    const systemPrompt = `You are a technical architect. Create a detailed implementation plan based on the specification. Be specific about architecture, file changes, and implementation approach. Focus on HOW to build it.`;

    const response = await this.llmClient.chat(
      [
        {
          role: 'user',
          content: `${prompt}\n\nAdditional context: ${JSON.stringify(context, null, 2)}`,
        },
      ],
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
      },
    );

    return this.cleanLLMResponse(response);
  }

  /**
   * Generate tasks from implementation plan
   */
  async generateTasks(plan, context = {}) {
    const prompt = this.templates.tasks.replace('{{IMPLEMENTATION_PLAN}}', plan);

    const systemPrompt = `You are a project manager breaking down work into actionable tasks. Generate specific, ordered tasks with clear dependencies. Each task should be completable in one sitting. Include file paths and code guidance.`;

    const response = await this.llmClient.chat(
      [
        {
          role: 'user',
          content: `${prompt}\n\nAdditional context: ${JSON.stringify(context, null, 2)}`,
        },
      ],
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
      },
    );

    return this.cleanLLMResponse(response);
  }

  /**
   * Write tasks to individual story files
   */
  async writeTasks(tasksContent) {
    const files = [];

    // Parse tasks - look for task headers (### Task X: or - [ ] Task X:)
    const taskPattern = /(?:###\s+Task\s+\d+:|^-\s+\[\s*\]\s+\*\*Task\s+\d+:)/gim;
    const matches = tasksContent.match(taskPattern);

    if (!matches || matches.length === 0) {
      // If no individual tasks found, write as single story
      const storyPath = path.join(this.storiesDir, 'story-1-implementation.md');
      await fs.writeFile(storyPath, tasksContent);
      files.push('docs/stories/story-1-implementation.md');
      return files;
    }

    // Split into individual task files
    const tasks = tasksContent.split(taskPattern);

    // First element is content before first task (header/intro)
    const header = tasks[0];

    // Write each task as a separate story
    for (let i = 1; i < tasks.length; i++) {
      const taskContent = `# Story ${i}\n\n${header}\n\n${matches[i - 1]}\n${tasks[i]}`;
      const storyPath = path.join(this.storiesDir, `story-${i}.md`);
      await fs.writeFile(storyPath, taskContent);
      files.push(`docs/stories/story-${i}.md`);
    }

    return files;
  }

  /**
   * Clean LLM response
   */
  cleanLLMResponse(response) {
    if (typeof response === 'string') {
      return response.trim();
    }

    if (response && typeof response === 'object') {
      // Handle different response formats
      if (response.content) {
        return response.content.trim();
      }
      if (response.text) {
        return response.text.trim();
      }
      if (response.message && response.message.content) {
        return response.message.content.trim();
      }
    }

    return String(response).trim();
  }

  /**
   * Get status of quick lane execution
   */
  async getStatus() {
    const prdExists = await fs.pathExists(path.join(this.docsDir, 'prd.md'));
    const archExists = await fs.pathExists(path.join(this.docsDir, 'architecture.md'));

    let stories = [];
    if (await fs.pathExists(this.storiesDir)) {
      const files = await fs.readdir(this.storiesDir);
      stories = files.filter((f) => f.endsWith('.md'));
    }

    return {
      executed: prdExists && archExists,
      files: {
        prd: prdExists,
        architecture: archExists,
        storiesCount: stories.length,
      },
      location: 'docs/',
    };
  }
}

module.exports = { QuickLane };
