import type { MarkdownTreeParser } from '@kayvan/markdown-tree-parser';
import {
  ArchitectExecutionResult,
  ArchitectHandoff,
  ArchitectSubAgentTaskConfig,
  ArchitectTaskExecutor,
  ArchitectTaskOutput,
  ArchitectTaskState,
  MetaAgentDirective,
} from './types';
import { findDirectiveSection, parseDirective } from './utils/markdown';

interface ArchitectInternalTask {
  config: ArchitectSubAgentTaskConfig;
  state: ArchitectTaskState;
}

export interface ArchitectOrchestratorOptions {
  directive: MetaAgentDirective;
  featureRequest: string;
}

export interface ArchitectFactoryOptions {
  directiveMarkdown: string;
  featureRequest: string;
  parser?: MarkdownTreeParser;
}

export class ArchitectOrchestrator {
  private readonly directive: MetaAgentDirective;
  private readonly featureRequest: string;
  private readonly tasks: Map<string, ArchitectInternalTask> = new Map();

  constructor(options: ArchitectOrchestratorOptions) {
    this.directive = options.directive;
    this.featureRequest = options.featureRequest;
  }

  static async fromMarkdown(options: ArchitectFactoryOptions): Promise<ArchitectOrchestrator> {
    const directive = await parseDirective(options.directiveMarkdown, { parser: options.parser });
    return new ArchitectOrchestrator({ directive, featureRequest: options.featureRequest });
  }

  getDirective(): MetaAgentDirective {
    return this.directive;
  }

  getFeatureRequest(): string {
    return this.featureRequest;
  }

  getTaskStates(): ArchitectTaskState[] {
    return Array.from(this.tasks.values()).map((task) => ({
      ...task.state,
      dependencies: [...task.state.dependencies],
      output: task.state.output ? { ...task.state.output } : undefined,
    }));
  }

  registerTask(config: ArchitectSubAgentTaskConfig): void {
    if (this.tasks.has(config.id)) {
      throw new Error(`Task with id "${config.id}" is already registered.`);
    }

    this.ensureExecutor(config.executor);

    const dependencies = Array.from(new Set(config.dependencies ?? []));
    if (dependencies.includes(config.id)) {
      throw new Error(`Task "${config.id}" cannot depend on itself.`);
    }
    const state: ArchitectTaskState = {
      id: config.id,
      title: config.title,
      mission: config.mission,
      dependencies,
      status: 'pending',
    };

    this.tasks.set(config.id, {
      config: {
        ...config,
        dependencies,
      },
      state,
    });
  }

  async execute(): Promise<ArchitectExecutionResult> {
    if (this.tasks.size === 0) {
      throw new Error('No sub-agent tasks have been registered.');
    }

    for (const task of this.tasks.values()) {
      for (const dependencyId of task.state.dependencies) {
        if (!this.tasks.has(dependencyId)) {
          throw new Error(
            `Task "${task.state.id}" has an unknown dependency "${dependencyId}". Register the dependency before executing.`,
          );
        }
      }
    }

    let progress = true;
    while (progress) {
      progress = false;
      const readyTasks = this.getReadyTasks();

      if (readyTasks.length > 0) {
        progress = true;
        await Promise.all(readyTasks.map((task) => this.runTask(task)));
      } else {
        const pending = this.getPendingTasks();
        if (pending.length === 0) {
          break;
        }

        const blockedTasks = pending.filter((task) =>
          task.state.dependencies.some((dependencyId) => {
            const dependency = this.tasks.get(dependencyId);
            return dependency?.state.status === 'failed' || dependency?.state.status === 'blocked';
          }),
        );

        if (blockedTasks.length > 0) {
          for (const task of blockedTasks) {
            this.markBlocked(task);
          }
          progress = true;
        } else {
          throw new Error(
            'Unable to progress architect execution. Check for circular dependencies in the registered tasks.',
          );
        }
      }
    }

    const snapshots = this.getTaskStates();
    const filesTouched = this.collectFiles(snapshots);
    const handoffDocument = this.createHandoffDocument(snapshots, filesTouched);

    return {
      featureRequest: this.featureRequest,
      directiveTitle: this.directive.title,
      tasks: snapshots,
      filesTouched,
      handoffDocument,
    } satisfies ArchitectHandoff;
  }

  private async runTask(task: ArchitectInternalTask): Promise<void> {
    task.state.status = 'running';
    task.state.startedAt = new Date().toISOString();

    try {
      const output = await task.config.executor();
      this.assertTaskOutput(output, task.config.id);
      task.state.output = normalizeTaskOutput(output);
      task.state.status = 'completed';
    } catch (error) {
      task.state.status = 'failed';
      task.state.error = error instanceof Error ? error.message : String(error);
    } finally {
      task.state.finishedAt = new Date().toISOString();
    }
  }

  private getReadyTasks(): ArchitectInternalTask[] {
    return Array.from(this.tasks.values()).filter((task) => {
      if (task.state.status !== 'pending') {
        return false;
      }

      return task.state.dependencies.every((dependencyId) => {
        const dependency = this.tasks.get(dependencyId);
        return dependency && dependency.state.status === 'completed';
      });
    });
  }

  private getPendingTasks(): ArchitectInternalTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.state.status === 'pending');
  }

  private markBlocked(task: ArchitectInternalTask): void {
    task.state.status = 'blocked';
    const failedDependency = task.state.dependencies.find((dependencyId) => {
      const dependency = this.tasks.get(dependencyId);
      return dependency?.state.status === 'failed' || dependency?.state.status === 'blocked';
    });
    if (failedDependency) {
      task.state.error = `Blocked by dependency "${failedDependency}"`;
    }
    task.state.finishedAt = new Date().toISOString();
  }

  private collectFiles(states: ArchitectTaskState[]): string[] {
    const files = new Set<string>();
    for (const state of states) {
      for (const file of state.output?.filesTouched ?? []) {
        files.add(file);
      }
    }
    return Array.from(files);
  }

  private createHandoffDocument(tasks: ArchitectTaskState[], files: string[]): string {
    const lines: string[] = [];
    lines.push('# Development Summary & Handoff');
    lines.push('');
    lines.push(`**Feature Request:** ${this.featureRequest}`);
    lines.push(`**Architect Directive:** ${this.directive.title}`);
    lines.push('');

    lines.push('## Sub-Agent Missions');
    for (const task of tasks) {
      lines.push(`- **${task.title}** (\`${task.id}\`): ${task.mission}`);
    }
    lines.push('');

    lines.push('## Execution Results');
    for (const task of tasks) {
      lines.push(`### ${task.title} (\`${task.id}\`)`);
      lines.push(`- Status: ${task.status.toUpperCase()}`);
      if (task.output?.summary) {
        lines.push(`- Summary: ${task.output.summary}`);
      }
      if (task.output?.details) {
        lines.push(`- Details: ${task.output.details}`);
      }
      if (task.output?.filesTouched && task.output.filesTouched.length > 0) {
        lines.push(`- Files: ${task.output.filesTouched.join(', ')}`);
      }
      if (task.output?.artifacts && Object.keys(task.output.artifacts).length > 0) {
        lines.push('- Artifacts:');
        for (const [artifact, description] of Object.entries(task.output.artifacts)) {
          lines.push(`  - ${artifact}: ${description}`);
        }
      }
      if (task.output?.notes) {
        lines.push(`- Notes: ${task.output.notes}`);
      }
      if (task.error) {
        lines.push(`- Error: ${task.error}`);
      }
      lines.push('');
    }

    lines.push('## Files Modified');
    if (files.length > 0) {
      for (const file of files) {
        lines.push(`- ${file}`);
      }
    } else {
      lines.push('- (none reported)');
    }
    lines.push('');

    const outputSection = findDirectiveSection(this.directive, 'Output & Handoff');
    if (outputSection) {
      lines.push('## Directive Reference: Output & Handoff');
      lines.push('');
      lines.push(outputSection.content);
      lines.push('');
    }

    lines.push('---');
    lines.push('Generated by the Architect meta-agent orchestration engine.');

    return lines.join('\n');
  }

  private ensureExecutor(executor: ArchitectTaskExecutor): void {
    if (typeof executor !== 'function') {
      throw new Error('Architect sub-agent tasks require an executor function.');
    }
  }

  private assertTaskOutput(output: ArchitectTaskOutput, id: string): void {
    if (!output || typeof output.summary !== 'string' || output.summary.trim() === '') {
      throw new Error(`Task "${id}" returned an invalid output. A summary is required.`);
    }
  }
}

const normalizeTaskOutput = (output: ArchitectTaskOutput): ArchitectTaskOutput => ({
  ...output,
  filesTouched: output.filesTouched ? Array.from(new Set(output.filesTouched)) : undefined,
  artifacts: output.artifacts ? { ...output.artifacts } : undefined,
});

export const createArchitectOrchestrator = async (
  options: ArchitectFactoryOptions,
): Promise<ArchitectOrchestrator> => ArchitectOrchestrator.fromMarkdown(options);
