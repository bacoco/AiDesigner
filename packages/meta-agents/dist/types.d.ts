export interface FileSystem {
    ensureDir(target: string): Promise<void>;
    writeFile(target: string, data: string, encoding?: BufferEncoding): Promise<void>;
    readFile(target: string, encoding?: BufferEncoding): Promise<string>;
    pathExists(target: string): Promise<boolean>;
    readdir(target: string): Promise<string[]>;
    stat(target: string): Promise<{
        isDirectory(): boolean;
        isFile(): boolean;
    }>;
}
export interface ArtifactRecord {
    path: string;
    description: string;
}
export interface StageProgress {
    id: string;
    stage: string;
    title: string;
    status: StageStatus;
    startedAt?: string;
    finishedAt?: string;
    summary?: string;
    artifacts: ArtifactRecord[];
}
export type StageStatus = 'pending' | 'running' | 'completed' | 'complete' | 'failed';
export interface MetaAgentResult {
    id: string;
    agentId?: string;
    title: string;
    description: string;
    summary: string;
    startedAt?: string;
    completedAt?: string;
    stages: StageProgress[];
    artifacts: ArtifactRecord[];
}
export interface MetaAgentRuntimeOptions {
    projectRoot?: string;
    fileSystem?: FileSystem;
    supabaseClient?: SupabaseClientLike;
    clock?: () => Date;
    logger?: (message: string) => void;
}
export interface SupabaseClientLike {
    from(table: string): {
        select(columns: string): {
            eq(column: string, value: string): Promise<{
                data?: any[];
                error?: {
                    message: string;
                };
            }>;
        };
    };
}
export interface SupabaseColumnRow {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}
export interface GenesisInput {
    projectName?: string;
    projectType?: string;
    technologyStack?: string[];
}
export interface LibrarianInput {
    scopePaths?: string[];
    apiFiles?: string[];
    developmentGuidePath?: string;
}
export interface RefactorInput {
    scopePaths?: string[];
    dependencyFiles?: string[];
}
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
export type QuasarTesterExecutor = (item: QuasarTestPlanItem) => Promise<QuasarTesterReport> | QuasarTesterReport;
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
