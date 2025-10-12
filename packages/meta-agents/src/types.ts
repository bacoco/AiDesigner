export interface DirectiveSection {
  heading: string;
  depth: number;
  slug: string;
  content: string;
}

export interface MetaAgentDirective {
  title: string;
  sections: DirectiveSection[];
  raw: string;
}

export type ArchitectTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked';

export interface ArchitectTaskOutput {
  summary: string;
  details?: string;
  filesTouched?: string[];
  artifacts?: Record<string, string>;
  notes?: string;
}

export type ArchitectTaskExecutor = () => Promise<ArchitectTaskOutput> | ArchitectTaskOutput;

export interface ArchitectSubAgentTaskConfig {
  id: string;
  title: string;
  mission: string;
  dependencies?: string[];
  executor: ArchitectTaskExecutor;
}

export interface ArchitectTaskState {
  id: string;
  title: string;
  mission: string;
  dependencies: string[];
  status: ArchitectTaskStatus;
  startedAt?: string;
  finishedAt?: string;
  output?: ArchitectTaskOutput;
  error?: string;
}

export interface ArchitectExecutionResult {
  featureRequest: string;
  directiveTitle: string;
  tasks: ArchitectTaskState[];
  filesTouched: string[];
  handoffDocument: string;
}

export type ArchitectHandoff = ArchitectExecutionResult;

export interface QuasarTestPlanItem {
  id: string;
  title: string;
  mission: string;
  targetTaskId: string;
  relatedFiles: string[];
  focusAreas: string[];
}

export interface QuasarTestPlan {
  featureRequest: string;
  directiveTitle: string;
  items: QuasarTestPlanItem[];
}

export type QuasarTesterExecutor = (
  item: QuasarTestPlanItem,
) => Promise<QuasarTesterReport> | QuasarTesterReport;

export type QuasarTesterStatus = 'pass' | 'fail' | 'skipped';

export interface QuasarTesterReport {
  id?: string;
  status: QuasarTesterStatus;
  findings: string;
  defects?: string[];
  evidence?: string;
}

export interface QuasarAggregatedReport {
  planItemId: string;
  title: string;
  mission: string;
  status: QuasarTesterStatus;
  findings: string;
  defects: string[];
  evidence?: string;
}

export interface GlobalQualityReport {
  overallStatus: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  summary: string;
  featureRequest: string;
  plan: QuasarTestPlan;
  reports: QuasarAggregatedReport[];
  markdown: string;
}
