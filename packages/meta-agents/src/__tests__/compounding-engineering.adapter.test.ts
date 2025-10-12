import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { describe, expect, it, afterEach } from '@jest/globals';
import type { ChildProcess } from 'node:child_process';
import { CompoundingEngineeringPlanningAdapter } from '../planning/compounding-engineering';
import type { FeatureRequest } from '../planning/types';

interface TestManifest {
  name?: string;
  version?: string;
  commands?: unknown;
  [key: string]: unknown;
}

interface TestConfig {
  repositoryPath?: string;
  manifestPath?: string;
  defaultCommand?: {
    command?: string;
    args?: string[];
    appendCommandName?: boolean;
  };
  commands?: Record<string, { command?: string; args?: string[]; appendCommandName?: boolean }>;
  environment?: Record<string, unknown>;
}

interface ExecInvocation {
  command: string;
  args: string[];
  options: Record<string, unknown>;
  payload: string;
}

const createFixture = async (manifest: TestManifest, configOverrides: TestConfig = {}) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'comp-eng-adapter-'));
  const repositoryDir = path.join(tempRoot, 'repo');
  await mkdir(repositoryDir, { recursive: true });

  const manifestPath = path.join(repositoryDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  const defaultConfig = {
    repositoryPath: 'repo',
    manifestPath: 'manifest.json',
    defaultCommand: {
      command: 'node',
      args: ['packages/compounding-engineering/cli.mjs'],
      appendCommandName: true,
    },
  };

  const config = {
    ...defaultConfig,
    ...configOverrides,
    defaultCommand: {
      ...defaultConfig.defaultCommand,
      ...configOverrides.defaultCommand,
    },
  };

  const configPath = path.join(tempRoot, 'config.json');
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

  return { tempRoot, configPath, repositoryDir };
};

const createExecMock = (
  response: unknown,
  invocations: ExecInvocation[],
): typeof import('node:child_process')['execFile'] => {
  const execImplementation = (
    command: string,
    args: string[] = [],
    options: Record<string, unknown> = {},
    callback?: (error: Error | null, stdout?: string, stderr?: string) => void,
  ) => {
    const stdin = new PassThrough();
    const invocation: ExecInvocation = {
      command,
      args: Array.isArray(args) ? [...args] : [],
      options: { ...options },
      payload: '',
    };
    const buffers: Buffer[] = [];
    stdin.on('data', (chunk) => {
      buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    const finalizePayload = () => {
      if (invocation.payload.length === 0) {
        invocation.payload = Buffer.concat(buffers).toString('utf8');
      }
    };
    stdin.on('end', finalizePayload);
    stdin.on('finish', finalizePayload);
    invocations.push(invocation);

    setImmediate(() => {
      finalizePayload();
      callback?.(null, JSON.stringify(response), '');
    });

    return { stdin } as unknown as ChildProcess;
  };

  return execImplementation as unknown as typeof import('node:child_process')['execFile'];
};

const createdTempRoots: string[] = [];
afterEach(async () => {
  await Promise.all(
    createdTempRoots.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('CompoundingEngineeringPlanningAdapter', () => {
  const request: FeatureRequest = {
    title: 'Craft a developer onboarding workflow',
    summary: 'Ensure new engineers receive structured tasks and context.',
  };

  it('normalizes tasks and manifest metadata from plugin responses', async () => {
    const manifest = {
      name: 'comp-eng-plugin',
      version: '2.0.0',
      commands: {
        '/create-tasks': {
          command: ['node', 'packages/compounding-engineering/cli.mjs'],
          args: ['--format', 'json'],
        },
      },
    } satisfies TestManifest;

    const { tempRoot, configPath } = await createFixture(manifest);
    createdTempRoots.push(tempRoot);

    const response = {
      tasks: [
        {
          id: 'research',
          title: 'Research reference missions',
          mission: 'Collect prior mission artifacts relevant to onboarding.',
          persona: 'researcher',
          metadata: { confidence: 0.92 },
        },
        {
          id: 'plan',
          title: 'Plan engineering milestones',
          mission: 'Draft actionable steps for the onboarding workflow.',
          persona: 'architect',
          dependencies: ['research'],
          metadata: { alignment: 'high' },
          tags: ['planning'],
        },
      ],
      edges: [
        { from: 'plan', to: 'research', kind: 'supports' },
      ],
    };

    const invocations: ExecInvocation[] = [];
    const adapter = new CompoundingEngineeringPlanningAdapter({
      configPath,
      projectRoot: tempRoot,
      exec: createExecMock(response, invocations),
    });

    const graph = await adapter.decomposeFeature(request);

    expect(invocations).toHaveLength(1);
    expect(invocations[0].command).toBe('node');

    expect(graph.manifest.name).toBe('comp-eng-plugin');
    expect(graph.manifest.version).toBe('2.0.0');
    expect(graph.tasks).toHaveLength(2);

    const [research, plan] = graph.tasks;
    expect(research).toMatchObject({
      id: 'research',
      title: 'Research reference missions',
      mission: 'Collect prior mission artifacts relevant to onboarding.',
      persona: 'researcher',
      metadata: {
        source: 'compounding-engineering',
        plugin: { confidence: 0.92 },
      },
    });

    expect(plan).toMatchObject({
      id: 'plan',
      dependencies: ['research'],
      metadata: expect.objectContaining({
        source: 'compounding-engineering',
        plugin: { alignment: 'high' },
        tags: ['planning'],
      }),
    });

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { from: 'research', to: 'plan', kind: 'blocks' },
        { from: 'plan', to: 'research', kind: 'relates_to' },
      ]),
    );
  });

  it('falls back to the configured default command when manifest commands are missing', async () => {
    const manifest = {
      name: 'comp-eng-plugin',
      version: '1.0.0',
    } satisfies TestManifest;

    const configOverrides: TestConfig = {
      defaultCommand: {
        command: 'node',
        args: ['packages/compounding-engineering/cli.mjs'],
        appendCommandName: true,
      },
      commands: {
        '/create-tasks': {
          args: ['--format', 'json'],
        },
      },
    };

    const { tempRoot, configPath, repositoryDir } = await createFixture(manifest, configOverrides);
    createdTempRoots.push(tempRoot);

    const response = { tasks: [] };
    const invocations: ExecInvocation[] = [];

    const adapter = new CompoundingEngineeringPlanningAdapter({
      configPath,
      projectRoot: tempRoot,
      exec: createExecMock(response, invocations),
    });

    await adapter.decomposeFeature(request);

    expect(invocations).toHaveLength(1);
    const invocation = invocations[0];
    expect(invocation.command).toBe('node');
    expect(invocation.args).toEqual([
      'packages/compounding-engineering/cli.mjs',
      '--format',
      'json',
      '/create-tasks',
    ]);
    expect(invocation.options).toMatchObject({ cwd: repositoryDir });
    expect(invocation.payload).toContain('Craft a developer onboarding workflow');
  });
});
