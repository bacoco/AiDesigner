import path from 'node:path';
import * as childProcess from 'node:child_process';
import { PassThrough } from 'node:stream';

import { CompoundingEngineeringPlanningAdapter } from '../../packages/meta-agents/src/planning/compounding-engineering';
import {
  orchestrateArchitectStepOne,
  mergeDeveloperSubAgents,
} from '../../packages/meta-agents/src/orchestration/architect';

const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'compounding-engineering');

describe('Compounding Engineering integration', () => {
  let cwdSpy: jest.SpyInstance<string, []> | undefined;
  let previousRepoRoot: string | undefined;

  beforeEach(() => {
    previousRepoRoot = process.env.COMPOUNDING_ENGINEERING_ROOT;
    process.env.COMPOUNDING_ENGINEERING_ROOT = FIXTURE_ROOT;
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(path.join(__dirname, '..', '..'));
  });

  afterEach(() => {
    if (previousRepoRoot) {
      process.env.COMPOUNDING_ENGINEERING_ROOT = previousRepoRoot;
    } else {
      delete process.env.COMPOUNDING_ENGINEERING_ROOT;
    }
    previousRepoRoot = undefined;

    if (cwdSpy) {
      cwdSpy.mockRestore();
      cwdSpy = undefined;
    }
    jest.restoreAllMocks();
  });

  it('normalizes plugin tasks and merges them into developer missions', async () => {
    const fakeResponse = {
      tasks: [
        {
          id: 'task-auth',
          title: 'Implement authentication middleware',
          mission: 'Add a reusable guard that enforces customer entitlements.',
          persona: 'backend-developer',
          outputs: ['src/guards/entitlements.guard.ts'],
        },
        {
          id: 'task-api',
          name: 'Expose compounding endpoint',
          description: 'Wire the planner output into the REST layer.',
          depends_on: ['task-auth'],
          owners: ['backend-developer'],
        },
      ],
      dependencies: [
        { from: 'task-auth', to: 'task-api', kind: 'blocks' },
      ],
    };

    const execSpy = jest.fn<typeof childProcess.execFile>((file, args, options, callback) => {
        const cb =
          typeof options === 'function'
            ? options
            : (callback as ((err: Error | null, stdout?: string, stderr?: string) => void) | undefined);

        const child = {
          stdin: new PassThrough(),
          stdout: new PassThrough(),
          stderr: new PassThrough(),
          on: jest.fn(),
          kill: jest.fn(),
        } as unknown as childProcess.ChildProcess;

        setImmediate(() => {
          cb?.(null, JSON.stringify(fakeResponse), '');
        });

        return child;
      });

    const adapter = new CompoundingEngineeringPlanningAdapter({ exec: execSpy });
    const graph = await adapter.decomposeFeature({
      title: 'Compute compound growth',
      summary: 'Add backend support for compounding engineering experiments.',
    });

    expect(execSpy).toHaveBeenCalled();
    const firstCall = execSpy.mock.calls[0];
    expect(Array.isArray(firstCall[1]) ? firstCall[1] : []).toContain('/create-tasks');
    const callOptions = firstCall[2] as childProcess.ExecFileOptions;
    expect(callOptions.cwd).toContain('compounding-engineering');

    expect(graph.tasks).toHaveLength(2);
    expect(graph.tasks[0]).toMatchObject({
      id: 'task-auth',
      persona: 'backend-developer',
      mission: expect.stringContaining('guard'),
      dependencies: [],
    });
    expect(graph.edges).toContainEqual({ from: 'task-auth', to: 'task-api', kind: 'blocks' });

    const existingAgents = [
      {
        id: 'docs-sync',
        agent: 'developer',
        mission: 'Keep docs synchronized with planner output.',
        dependencies: [],
      },
    ];

    const orchestration = await orchestrateArchitectStepOne(
      { title: 'Compute compound growth' },
      existingAgents,
      { exec: execSpy },
    );

    expect(orchestration.mergedSubAgents).toHaveLength(3);
    const plannerAgents = orchestration.mergedSubAgents.filter((agent) => agent.id.startsWith('task-'));
    expect(plannerAgents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'task-auth', agent: 'backend-developer' }),
        expect.objectContaining({ id: 'task-api', dependencies: expect.arrayContaining(['task-auth']) }),
      ]),
    );

    const merged = mergeDeveloperSubAgents(existingAgents, orchestration.developerSubAgents);
    expect(merged).toHaveLength(3);
  });
});
