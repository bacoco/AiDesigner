import type { MarkdownTreeParser } from '@kayvan/markdown-tree-parser';
import {
  ArchitectHandoff,
  GlobalQualityReport,
  MetaAgentDirective,
  QuasarAggregatedReport,
  QuasarTestPlan,
  QuasarTestPlanItem,
  QuasarTesterExecutor,
  QuasarTesterReport,
} from './types';
import { findDirectiveSection, parseDirective } from './utils/markdown';

export interface QuasarOrchestratorOptions {
  directive: MetaAgentDirective;
  handoff: ArchitectHandoff;
}

export interface QuasarFactoryOptions {
  directiveMarkdown: string;
  handoff: ArchitectHandoff;
  parser?: MarkdownTreeParser;
}

export class QuasarOrchestrator {
  private readonly directive: MetaAgentDirective;
  private readonly handoff: ArchitectHandoff;
  private readonly testPlan: QuasarTestPlan;

  constructor(options: QuasarOrchestratorOptions) {
    this.directive = options.directive;
    this.handoff = options.handoff;
    this.testPlan = this.generateTestPlan();
  }

  static async fromMarkdown(options: QuasarFactoryOptions): Promise<QuasarOrchestrator> {
    const directive = await parseDirective(options.directiveMarkdown, { parser: options.parser });
    return new QuasarOrchestrator({ directive, handoff: options.handoff });
  }

  getDirective(): MetaAgentDirective {
    return this.directive;
  }

  getHandoff(): ArchitectHandoff {
    return this.handoff;
  }

  getTestPlan(): QuasarTestPlan {
    return this.testPlan;
  }

  async executeTests(executor: QuasarTesterExecutor): Promise<GlobalQualityReport> {
    const reports: QuasarAggregatedReport[] = [];
    for (const item of this.testPlan.items) {
      const testerReport = await executor(item);
      const normalized = this.normalizeTesterReport(item, testerReport);
      reports.push(normalized);
    }

    const overallStatus = this.resolveOverallStatus(reports);
    const summary = this.composeSummary(overallStatus, reports);
    const markdown = this.buildGlobalQualityReport(overallStatus, summary, reports);

    return {
      overallStatus,
      summary,
      featureRequest: this.handoff.featureRequest,
      plan: this.testPlan,
      reports,
      markdown,
    };
  }

  private generateTestPlan(): QuasarTestPlan {
    const items: QuasarTestPlanItem[] = [];

    for (const task of this.handoff.tasks) {
      const relatedFiles = task.output?.filesTouched ?? [];
      const artifactKeys = Object.keys(task.output?.artifacts ?? {});
      const focusAreas = Array.from(new Set([...relatedFiles, ...artifactKeys]));
      const missionComponents = [
        `Validate the deliverables produced by developer task "${task.title}" (mission: ${task.mission}).`,
      ];

      if (focusAreas.length > 0) {
        missionComponents.push(`Focus on artifacts/files: ${focusAreas.join(', ')}`);
      }

      missionComponents.push(`Architect reported status: ${task.status.toUpperCase()}.`);

      const id = `qa-${task.id}`;
      items.push({
        id,
        title: `${task.title} QA`,
        mission: missionComponents.join(' '),
        targetTaskId: task.id,
        relatedFiles,
        focusAreas,
      });
    }

    return {
      featureRequest: this.handoff.featureRequest,
      directiveTitle: this.directive.title,
      items,
    };
  }

  private normalizeTesterReport(
    item: QuasarTestPlanItem,
    report: QuasarTesterReport,
  ): QuasarAggregatedReport {
    if (!report || !report.status) {
      throw new Error(`Tester report for ${item.id} is invalid. A status is required.`);
    }

    return {
      planItemId: item.id,
      title: item.title,
      mission: item.mission,
      status: report.status,
      findings: report.findings ?? '',
      defects: report.defects ? [...report.defects] : [],
      evidence: report.evidence,
    };
  }

  private resolveOverallStatus(reports: QuasarAggregatedReport[]): GlobalQualityReport['overallStatus'] {
    if (reports.some((report) => report.status === 'fail')) {
      return 'FAILURE';
    }

    if (reports.some((report) => report.status === 'skipped')) {
      return 'PARTIAL';
    }

    return 'SUCCESS';
  }

  private composeSummary(
    overallStatus: GlobalQualityReport['overallStatus'],
    reports: QuasarAggregatedReport[],
  ): string {
    const failures = reports.filter((report) => report.status === 'fail');
    const skipped = reports.filter((report) => report.status === 'skipped');

    switch (overallStatus) {
      case 'FAILURE':
        return `FAILURE: ${failures.length} tester${failures.length === 1 ? '' : 's'} reported blocking issues.`;
      case 'PARTIAL':
        return `PARTIAL: ${skipped.length} tester${skipped.length === 1 ? '' : 's'} skipped. Review findings before release.`;
      default:
        return 'SUCCESS: All tests passed.';
    }
  }

  private buildGlobalQualityReport(
    overallStatus: GlobalQualityReport['overallStatus'],
    summary: string,
    reports: QuasarAggregatedReport[],
  ): string {
    const lines: string[] = [];
    lines.push('# Global Quality Report');
    lines.push('');
    lines.push(`**Overall Summary:** ${summary}`);
    lines.push(`**Status:** ${overallStatus}`);
    lines.push('');

    lines.push('## Development Context');
    lines.push(`- Feature Request: ${this.handoff.featureRequest}`);
    lines.push(`- Architect Directive: ${this.handoff.directiveTitle}`);
    lines.push('');

    lines.push('## Test Plan Overview');
    for (const item of this.testPlan.items) {
      lines.push(`- ${item.title} (focus: ${item.focusAreas.length > 0 ? item.focusAreas.join(', ') : 'general quality'})`);
    }
    lines.push('');

    lines.push('## Tester Findings');
    for (const report of reports) {
      lines.push(`### ${report.title}`);
      lines.push(`- Mission: ${report.mission}`);
      lines.push(`- Status: ${report.status.toUpperCase()}`);
      lines.push(`- Findings: ${report.findings || 'No findings recorded.'}`);
      if (report.defects.length > 0) {
        lines.push('- Defects:');
        for (const defect of report.defects) {
          lines.push(`  - ${defect}`);
        }
      }
      if (report.evidence) {
        lines.push(`- Evidence: ${report.evidence}`);
      }
      lines.push('');
    }

    const defects = reports.flatMap((report) => report.defects);
    lines.push('## Aggregated Defects');
    if (defects.length > 0) {
      for (const defect of defects) {
        lines.push(`- ${defect}`);
      }
    } else {
      lines.push('- None reported.');
    }
    lines.push('');

    const workflowSection = findDirectiveSection(this.directive, 'Core Workflow');
    if (workflowSection) {
      lines.push('## Directive Reference: Core Workflow');
      lines.push('');
      lines.push(workflowSection.content);
      lines.push('');
    }

    lines.push('## Architect Handoff Summary');
    lines.push('The following excerpt captures the development summary provided by the Architect:');
    lines.push('');
    lines.push('```markdown');
    lines.push(this.handoff.handoffDocument.slice(0, 2000));
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('Generated by the Quasar meta-agent orchestration engine.');

    return lines.join('\n');
  }
}

export const createQuasarOrchestrator = async (
  options: QuasarFactoryOptions,
): Promise<QuasarOrchestrator> => QuasarOrchestrator.fromMarkdown(options);
