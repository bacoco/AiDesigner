import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';

import {
  ArchitectDependencyEdge,
  ArchitectDependencyKind,
  ArchitectTaskGraph,
  ArchitectTaskNode,
  FeatureRequest,
} from './types';

export interface CommandInvocationConfig {
  command?: string;
  args?: string[];
  appendCommandName?: boolean;
  env?: Record<string, string>;
}

export type EnvironmentMapping =
  | string
  | {
      source?: string;
      required?: boolean;
      default?: string;
    };

export interface CompoundingEngineeringConfig {
  repositoryPath: string;
  manifestPath: string;
  defaultCommand?: CommandInvocationConfig;
  commands?: Record<string, CommandInvocationConfig>;
  environment?: Record<string, EnvironmentMapping>;
}

interface ResolvedConfig extends CompoundingEngineeringConfig {
  repositoryAbsolutePath: string;
  manifestAbsolutePath: string;
}

interface PluginManifest {
  name: string;
  version?: string;
  commands?: PluginCommand[] | Record<string, PluginCommand>;
  [key: string]: unknown;
}

interface PluginCommand {
  name?: string;
  title?: string;
  description?: string;
  path?: string;
  command?: string | string[];
  args?: string[];
}

interface PluginTaskDependency {
  id?: string;
  from?: string;
  to?: string;
  kind?: string;
  type?: string;
  relationship?: string;
}

interface PluginTask {
  id?: string;
  taskId?: string;
  slug?: string;
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  mission?: string;
  details?: string;
  persona?: string;
  role?: string;
  owners?: string[];
  lane?: string;
  dependencies?: Array<string | PluginTaskDependency>;
  dependsOn?: string[];
  depends_on?: string[];
  blockedBy?: string[];
  blockers?: string[];
  metadata?: Record<string, unknown>;
  estimate?: unknown;
  tags?: unknown;
  outputs?: unknown;
}

interface PluginTaskResponse {
  tasks?: PluginTask[];
  data?: PluginTask[];
  result?: PluginTask[];
  edges?: PluginTaskDependency[];
  dependencies?: PluginTaskDependency[];
  [key: string]: unknown;
}

export interface AdapterOptions {
  /**
   * Allows overriding the default config path (used primarily for testing)
   */
  configPath?: string;
  /**
   * Override the detected project root (defaults to process.cwd())
   */
  projectRoot?: string;
  /**
   * Force repository location (useful when running in CI or tests)
   */
  repositoryOverride?: string;
  /**
   * Override command invocation (primarily for testing)
   */
  exec?: typeof execFile;
}

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_CONFIG_PATH = path.join(PACKAGE_ROOT, 'config', 'compounding-engineering.json');
const REPOSITORY_ENV_OVERRIDE = 'COMPOUNDING_ENGINEERING_ROOT';
const TASK_ID_PREFIX = 'comp-eng';
const SOURCE_NAME = 'compounding-engineering';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function loadJsonFile<T>(filePath: string): Promise<T> {
  return fs.readFile(filePath, 'utf8').then((raw) => JSON.parse(raw) as T);
}

function normalizeDependencyKind(value: string | undefined): ArchitectDependencyKind {
  if (!value) {
    return 'blocks';
  }

  const normalized = value.toLowerCase();
  if (normalized.includes('relate') || normalized.includes('support')) {
    return 'relates_to';
  }

  if (normalized.includes('unblock')) {
    return 'unblocks';
  }

  return 'blocks';
}

function resolveEnvironmentValue(alias: string, mapping: EnvironmentMapping | undefined): string | undefined {
  if (mapping === undefined) {
    return process.env[alias];
  }

  if (typeof mapping === 'string') {
    const value = process.env[mapping];
    return isNonEmptyString(value) ? value : undefined;
  }

  const sourceKey = mapping.source && mapping.source.trim().length > 0 ? mapping.source : alias;
  const resolved = process.env[sourceKey] ?? mapping.default;

  if (!isNonEmptyString(resolved) && mapping.required) {
    throw new Error(
      `Missing required environment variable for Compounding Engineering integration: ${sourceKey}`,
    );
  }

  return isNonEmptyString(resolved) ? resolved : undefined;
}

export class CompoundingEngineeringPlanningAdapter {
  private readonly options: AdapterOptions;
  private configPromise?: Promise<ResolvedConfig>;
  private manifestPromise?: Promise<PluginManifest>;
  private readonly execImplementation: typeof execFile;

  constructor(options: AdapterOptions = {}) {
    this.options = options;
    this.execImplementation = options.exec ?? execFile;
  }

  async decomposeFeature(request: FeatureRequest): Promise<ArchitectTaskGraph> {
    if (!request || !isNonEmptyString(request.title)) {
      throw new Error('Feature request must include a title for Compounding Engineering decomposition.');
    }

    const config = await this.loadConfig();
    const manifest = await this.loadManifest(config);

    const rawResponse = await this.invokeCreateTasks(config, manifest, request);
    const graph = this.normalizeTaskGraph(rawResponse, manifest, config);
    return graph;
  }

  private async loadConfig(): Promise<ResolvedConfig> {
    if (!this.configPromise) {
      this.configPromise = (async () => {
        const configPath = this.options.configPath ?? DEFAULT_CONFIG_PATH;
        const absoluteConfigPath = path.isAbsolute(configPath)
          ? configPath
          : path.resolve(this.options.projectRoot ?? PACKAGE_ROOT, configPath);

        const config = await loadJsonFile<CompoundingEngineeringConfig>(absoluteConfigPath);

        const repositoryOverride =
          this.options.repositoryOverride ?? process.env[REPOSITORY_ENV_OVERRIDE];
        const repositoryAbsolutePath = repositoryOverride
          ? path.resolve(repositoryOverride)
          : path.resolve(this.options.projectRoot ?? PACKAGE_ROOT, config.repositoryPath);

        const manifestAbsolutePath = path.isAbsolute(config.manifestPath)
          ? config.manifestPath
          : path.resolve(repositoryAbsolutePath, config.manifestPath);

        return {
          ...config,
          repositoryAbsolutePath,
          manifestAbsolutePath,
        } satisfies ResolvedConfig;
      })();
    }

    return this.configPromise;
  }

  private async loadManifest(config: ResolvedConfig): Promise<PluginManifest> {
    if (!this.manifestPromise) {
      this.manifestPromise = loadJsonFile<PluginManifest>(config.manifestAbsolutePath).catch((error) => {
        throw new Error(
          `Unable to read Compounding Engineering manifest at ${config.manifestAbsolutePath}: ${
            (error as Error).message
          }`,
        );
      });
    }

    return this.manifestPromise;
  }

  private async invokeCreateTasks(
    config: ResolvedConfig,
    manifest: PluginManifest,
    request: FeatureRequest,
  ): Promise<PluginTaskResponse> {
    const commandConfig = this.resolveCommandConfig('/create-tasks', config, manifest);

    if (!commandConfig.command && !manifest?.commands) {
      throw new Error('Compounding Engineering manifest is missing command information for /create-tasks.');
    }

    const executable = commandConfig.command ?? 'node';
    const appendCommandName = commandConfig.appendCommandName ?? true;
    const args = [...(commandConfig.args ?? [])];

    if (appendCommandName) {
      args.push('/create-tasks');
    }

    const env: NodeJS.ProcessEnv = { ...process.env };

    if (config.environment) {
      for (const [alias, mapping] of Object.entries(config.environment)) {
        const value = resolveEnvironmentValue(alias, mapping);
        if (isNonEmptyString(value)) {
          env[alias] = value;
        }
      }
    }

    if (commandConfig.env) {
      for (const [key, value] of Object.entries(commandConfig.env)) {
        if (isNonEmptyString(value)) {
          env[key] = value;
        }
      }
    }

    const payload = JSON.stringify({
      title: request.title,
      summary: request.summary,
      goals: request.goals,
      constraints: request.constraints,
      context: request.context,
    });

    const stdout = await new Promise<string>((resolve, reject) => {
      const child = this.execImplementation(
        executable,
        args,
        {
          cwd: config.repositoryAbsolutePath,
          env,
          maxBuffer: 25 * 1024 * 1024,
        },
        (error, stdOut, stdErr) => {
          if (error) {
            const details = stdErr?.toString().trim();
            reject(
              new Error(
                `Compounding Engineering command failed: ${error.message}${
                  details ? `\n${details}` : ''
                }`,
              ),
            );
            return;
          }

          resolve(stdOut ?? '');
        },
      );

      if (child.stdin) {
        child.stdin.write(payload);
        child.stdin.end();
      }
    });

    const trimmed = stdout.trim();
    if (!trimmed) {
      return { tasks: [] };
    }

    try {
      const parsed = JSON.parse(trimmed) as PluginTaskResponse;
      return parsed;
    } catch (error) {
      throw new Error(
        `Compounding Engineering command returned invalid JSON: ${(error as Error).message}. Raw output: ${trimmed}`,
      );
    }
  }

  private resolveCommandConfig(
    commandName: string,
    config: CompoundingEngineeringConfig,
    manifest: PluginManifest,
  ): CommandInvocationConfig {
    const override = config.commands?.[commandName];
    if (override) {
      return {
        ...config.defaultCommand,
        ...override,
        args: this.mergeArgs(config.defaultCommand?.args, override.args),
      };
    }

    const manifestCommand = this.findCommandInManifest(commandName, manifest);
    if (manifestCommand) {
      const manifestArgs = Array.isArray(manifestCommand.command)
        ? manifestCommand.command.slice(1)
        : manifestCommand.args;
      const manifestExecutable = Array.isArray(manifestCommand.command)
        ? manifestCommand.command[0]
        : manifestCommand.command;

      return {
        ...config.defaultCommand,
        command: manifestExecutable ?? config.defaultCommand?.command,
        args: this.mergeArgs(config.defaultCommand?.args, manifestArgs),
      };
    }

    if (config.defaultCommand) {
      return { ...config.defaultCommand };
    }

    return { command: 'node', args: [] };
  }

  private mergeArgs(primary: string[] | undefined, secondary: string[] | undefined): string[] | undefined {
    if (!primary && !secondary) {
      return undefined;
    }

    if (!primary) {
      return secondary ? [...secondary] : undefined;
    }

    if (!secondary) {
      return [...primary];
    }

    return [...primary, ...secondary];
  }

  private findCommandInManifest(commandName: string, manifest: PluginManifest): PluginCommand | undefined {
    if (!manifest?.commands) {
      return undefined;
    }

    if (Array.isArray(manifest.commands)) {
      return manifest.commands.find((entry) => entry?.name === commandName || entry?.path === commandName);
    }

    const direct = manifest.commands[commandName];
    if (direct) {
      return direct;
    }

    return Object.values(manifest.commands).find(
      (entry) => entry?.name === commandName || entry?.path === commandName,
    );
  }

  private normalizeTaskGraph(
    response: PluginTaskResponse,
    manifest: PluginManifest,
    config: ResolvedConfig,
  ): ArchitectTaskGraph {
    const tasks = this.extractTasks(response).map((task, index) => this.normalizeTask(task, index));
    const edges = this.buildEdges(tasks, response);

    return {
      tasks,
      edges,
      manifest: {
        name: isNonEmptyString(manifest.name) ? manifest.name : SOURCE_NAME,
        version: isNonEmptyString(manifest.version) ? manifest.version : undefined,
        path: config.manifestAbsolutePath,
        fetchedAt: new Date().toISOString(),
      },
      rawResponse: response,
    };
  }

  private extractTasks(response: PluginTaskResponse): PluginTask[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response.tasks)) {
      return response.tasks;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.result)) {
      return response.result;
    }

    return [];
  }

  private normalizeTask(task: PluginTask, index: number): ArchitectTaskNode {
    const id = this.resolveTaskId(task, index);
    const title = this.resolveTaskTitle(task, index);
    const mission = this.resolveTaskMission(task, title);
    const persona = this.resolveTaskPersona(task);
    const dependencies = this.resolveTaskDependencies(task);

    const metadata: Record<string, unknown> = {
      source: SOURCE_NAME,
    };

    if (task.metadata) {
      metadata.plugin = task.metadata;
    }

    if (task.estimate !== undefined) {
      metadata.estimate = task.estimate;
    }

    if (task.tags !== undefined) {
      metadata.tags = task.tags;
    }

    if (task.outputs !== undefined) {
      metadata.outputs = task.outputs;
    }

    return {
      id,
      title,
      mission,
      persona,
      lane: isNonEmptyString(task.lane) ? task.lane : undefined,
      dependencies,
      metadata,
    };
  }

  private resolveTaskId(task: PluginTask, index: number): string {
    const candidates = [task.id, task.taskId, task.slug];
    for (const candidate of candidates) {
      if (isNonEmptyString(candidate)) {
        return candidate;
      }
    }

    return `${TASK_ID_PREFIX}-${crypto.randomUUID()}-${index}`;
  }

  private resolveTaskTitle(task: PluginTask, index: number): string {
    const candidates = [task.title, task.name, task.summary];
    for (const candidate of candidates) {
      if (isNonEmptyString(candidate)) {
        return candidate;
      }
    }

    return `Task ${index + 1}`;
  }

  private resolveTaskMission(task: PluginTask, fallbackTitle: string): string {
    const candidates = [task.mission, task.summary, task.description, task.details];
    for (const candidate of candidates) {
      if (isNonEmptyString(candidate)) {
        return candidate;
      }
    }

    return `Deliver on: ${fallbackTitle}`;
  }

  private resolveTaskPersona(task: PluginTask): string {
    if (isNonEmptyString(task.persona)) {
      return task.persona;
    }

    if (isNonEmptyString(task.role)) {
      return task.role;
    }

    if (Array.isArray(task.owners) && task.owners.length > 0) {
      const owner = task.owners.find((candidate) => isNonEmptyString(candidate));
      if (owner) {
        return owner;
      }
    }

    return 'developer';
  }

  private resolveTaskDependencies(task: PluginTask): string[] {
    const dependencies = new Set<string>();

    const register = (value: unknown) => {
      if (isNonEmptyString(value)) {
        dependencies.add(value);
      }
    };

    const processArray = (items: unknown[]) => {
      for (const item of items) {
        if (typeof item === 'string') {
          register(item);
        } else if (typeof item === 'object' && item) {
          const candidate = (item as PluginTaskDependency).id ?? (item as PluginTaskDependency).to;
          register(candidate);
        }
      }
    };

    if (Array.isArray(task.dependencies)) {
      processArray(task.dependencies);
    }

    if (Array.isArray(task.dependsOn)) {
      processArray(task.dependsOn);
    }

    if (Array.isArray(task.depends_on)) {
      processArray(task.depends_on);
    }

    if (Array.isArray(task.blockedBy)) {
      processArray(task.blockedBy);
    }

    if (Array.isArray(task.blockers)) {
      processArray(task.blockers);
    }

    return [...dependencies];
  }

  private buildEdges(tasks: ArchitectTaskNode[], response: PluginTaskResponse): ArchitectDependencyEdge[] {
    const edges = new Map<string, ArchitectDependencyEdge>();
    const taskIndex = new Map(tasks.map((task) => [task.id, task] as const));

    const register = (edge: ArchitectDependencyEdge) => {
      const key = `${edge.from}->${edge.to}`;
      if (!edges.has(key)) {
        edges.set(key, edge);
      }
    };

    for (const task of tasks) {
      for (const dependency of task.dependencies) {
        register({ from: dependency, to: task.id, kind: 'blocks' });
      }
    }

    const pluginEdges = this.extractPluginEdges(response);
    for (const edge of pluginEdges) {
      const from = edge.from ?? edge.id;
      const to = edge.to;

      if (!isNonEmptyString(from) || !isNonEmptyString(to)) {
        continue;
      }

      const kind = normalizeDependencyKind(edge.kind ?? edge.type ?? edge.relationship);
      if (!taskIndex.has(to) || !taskIndex.has(from)) {
        continue;
      }

      register({ from, to, kind });
    }

    return [...edges.values()];
  }

  private extractPluginEdges(response: PluginTaskResponse): PluginTaskDependency[] {
    if (!response) {
      return [];
    }

    const result: PluginTaskDependency[] = [];
    const candidates: Array<PluginTaskDependency[] | undefined> = [
      response.edges,
      response.dependencies,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        result.push(...candidate);
      }
    }

    return result;
  }
}
