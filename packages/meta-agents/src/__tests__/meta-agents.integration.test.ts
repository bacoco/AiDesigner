import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from '@jest/globals';
import {
  ArchitectOrchestrator,
  createArchitectOrchestrator,
  createQuasarOrchestrator,
  QuasarOrchestrator,
  QuasarTesterReport,
} from '../index';

const repositoryRoot = path.resolve(__dirname, '../../../../');

const loadDirective = async (relativePath: string): Promise<string> => {
  const fullPath = path.join(repositoryRoot, relativePath);
  return readFile(fullPath, 'utf8');
};

describe('Architect and Quasar orchestration', () => {
  it('executes the dependency graph and produces a QA plan', async () => {
    const architectMarkdown = await loadDirective('agents/meta-agent-developer.md');
    const quasarMarkdown = await loadDirective('agents/meta-agent-orchestrator.md');

    const architect = await createArchitectOrchestrator({
      directiveMarkdown: architectMarkdown,
      featureRequest: 'Build a guided onboarding flow for new users',
    });

    expect(architect).toBeInstanceOf(ArchitectOrchestrator);

    const executionOrder: string[] = [];

    architect.registerTask({
      id: 'research',
      title: 'Research Experience',
      mission: 'Map onboarding narrative and instrumentation expectations.',
      executor: async () => {
        executionOrder.push('research');
        return {
          summary: 'User journey outline with telemetry checkpoints.',
          details: 'Drafted storyboards with analytics triggers.',
          filesTouched: ['docs/onboarding-journey.md'],
        };
      },
    });

    architect.registerTask({
      id: 'ui',
      title: 'UI Implementation',
      mission: 'Deliver React components for the onboarding wizard.',
      dependencies: ['research'],
      executor: async () => {
        executionOrder.push('ui');
        return {
          summary: 'Wizard screens implemented with validation hooks.',
          filesTouched: ['web/src/features/onboarding/Wizard.tsx'],
          artifacts: {
            'web/src/features/onboarding/Wizard.tsx': 'Core component implementation',
          },
        };
      },
    });

    architect.registerTask({
      id: 'api',
      title: 'API Support',
      mission: 'Expose onboarding progress persistence endpoints.',
      dependencies: ['research'],
      executor: async () => {
        executionOrder.push('api');
        return {
          summary: 'REST endpoints and Supabase migration ready.',
          filesTouched: ['api/routes/onboarding.ts', 'db/migrations/20240214_onboarding.sql'],
        };
      },
    });

    architect.registerTask({
      id: 'integration',
      title: 'End-to-end Integration',
      mission: 'Wire UI and API, ensuring analytics hooks fire.',
      dependencies: ['ui', 'api'],
      executor: async () => {
        executionOrder.push('integration');
        return {
          summary: 'Data pipeline verified and analytics recorded.',
          filesTouched: ['web/src/app/App.tsx'],
          notes: 'Added smoke-test harness for onboarding flow.',
        };
      },
    });

    const handoff = await architect.execute();

    expect(handoff.tasks).toHaveLength(4);
    expect(handoff.tasks.every((task) => task.status === 'completed')).toBe(true);
    expect(new Set(handoff.filesTouched)).toEqual(
      new Set([
        'docs/onboarding-journey.md',
        'web/src/features/onboarding/Wizard.tsx',
        'api/routes/onboarding.ts',
        'db/migrations/20240214_onboarding.sql',
        'web/src/app/App.tsx',
      ]),
    );
    expect(handoff.handoffDocument).toContain('# Development Summary & Handoff');
    expect(handoff.handoffDocument).toContain('End-to-end Integration');
    expect(executionOrder.indexOf('integration')).toBeGreaterThan(executionOrder.indexOf('ui'));
    expect(executionOrder.indexOf('integration')).toBeGreaterThan(executionOrder.indexOf('api'));

    const quasar = await createQuasarOrchestrator({
      directiveMarkdown: quasarMarkdown,
      handoff,
    });

    expect(quasar).toBeInstanceOf(QuasarOrchestrator);
    const plan = quasar.getTestPlan();
    expect(plan.items).toHaveLength(4);

    const failingItemId = 'qa-integration';
    const reportLookup: Record<string, QuasarTesterReport> = {
      'qa-research': {
        status: 'pass',
        findings: 'Narrative aligns with personas.',
      },
      'qa-ui': {
        status: 'pass',
        findings: 'Wizard renders with expected validation states.',
      },
      'qa-api': {
        status: 'pass',
        findings: 'Endpoints respond with 200 and persist progress.',
      },
      [failingItemId]: {
        status: 'fail',
        findings: 'Analytics events missing for step completion.',
        defects: ['Add analytics event for onboarding step completion.'],
      },
    };

    const globalReport = await quasar.executeTests(async (item) => reportLookup[item.id]);

    expect(globalReport.overallStatus).toBe('FAILURE');
    expect(globalReport.summary).toContain('FAILURE');
    expect(globalReport.markdown).toContain('# Global Quality Report');
    expect(globalReport.markdown).toContain('Analytics events missing');
    expect(globalReport.markdown).toContain('Add analytics event for onboarding step completion.');
    expect(globalReport.reports.find((report) => report.planItemId === failingItemId)?.status).toBe('fail');
    expect(globalReport.plan.items.map((item) => item.id)).toContain(failingItemId);
  });
});
