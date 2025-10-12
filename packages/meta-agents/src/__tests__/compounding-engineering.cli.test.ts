import path from 'node:path';
import { execFile } from 'node:child_process';

const runCli = (input: unknown) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const cliPath = path.resolve(__dirname, '..', '..', '..', 'compounding-engineering', 'cli.mjs');
    const child = execFile(
      'node',
      [cliPath, '/create-tasks', '--format', 'json'],
      { encoding: 'utf8' },
      (error, stdout, stderr) => {
        if (error) {
          reject(Object.assign(error, { stdout, stderr }));
          return;
        }

        resolve({ stdout, stderr });
      },
    );

    child.stdin?.end(JSON.stringify(input));
  });

describe('compounding-engineering CLI', () => {
  it('returns a deterministic four-step mission plan', async () => {
    const request = {
      title: 'Launch collaborative project hub',
      summary: 'Centralize planning, execution, and QA tasks for distributed teams.',
      goals: ['Align PM and engineering plans', 'Expose progress dashboards'],
      constraints: ['Roll out incrementally', 'Meet enterprise security requirements'],
    };

    const { stdout } = await runCli(request);
    const payload = JSON.parse(stdout.trim());

    expect(Array.isArray(payload.tasks)).toBe(true);
    expect(payload.tasks).toHaveLength(4);

    const [discovery, planning, execution, validation] = payload.tasks;
    expect(discovery.id).toMatch(/comp-eng-launch-collaborative-project-hub-discover/);
    expect(planning.dependencies).toEqual([discovery.id]);
    expect(execution.dependencies).toEqual([planning.id]);
    expect(validation.dependencies).toEqual([execution.id]);

    expect(payload.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: discovery.id, to: planning.id }),
        expect.objectContaining({ from: planning.id, to: execution.id }),
      ]),
    );
  });
});
