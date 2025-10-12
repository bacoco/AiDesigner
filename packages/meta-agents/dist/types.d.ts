import type { Stats } from 'node:fs';
export type StageStatus = 'pending' | 'running' | 'complete';
export interface ArtifactRecord {
    path: string;
    description: string;
}
export interface StageProgress {
    id: string;
    title: string;
    status: StageStatus;
    summary?: string;
    artifacts: ArtifactRecord[];
}
export interface MetaAgentResult {
    id: string;
    title: string;
    description: string;
    summary: string;
    startedAt: string;
    completedAt: string;
    artifacts: ArtifactRecord[];
    stages: StageProgress[];
}
export interface WorkflowSession extends MetaAgentResult {
}
export interface FileSystem {
    ensureDir(path: string): Promise<void>;
    writeFile(path: string, data: string, encoding?: BufferEncoding): Promise<void>;
    readFile(path: string, encoding?: BufferEncoding): Promise<string>;
    pathExists(path: string): Promise<boolean>;
    readdir(path: string): Promise<string[]>;
    stat(path: string): Promise<Stats>;
}
export interface SupabaseQueryResult<Row> {
    data: Row[] | null;
    error?: {
        message?: string;
    } | null;
}
export interface SupabaseColumnRow {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable?: string;
    column_default?: string | null;
}
export interface SupabaseClientLike {
    from(table: string): {
        select(columns: string): {
            eq(column: string, value: string): Promise<SupabaseQueryResult<SupabaseColumnRow>>;
        };
    };
}
export interface MetaAgentRuntimeOptions {
    projectRoot?: string;
    fileSystem?: FileSystem;
    supabaseClient?: SupabaseClientLike;
    clock?: () => Date;
    logger?: (message: string) => void;
}
export interface GenesisInput {
    projectName: string;
    projectType: string;
    technologyStack: string[];
}
export interface LibrarianInput {
    scopePaths?: string[];
    architectureEntryPoints?: string[];
    apiFiles?: string[];
    developmentGuidePath?: string;
}
export interface RefactorInput {
    scopePaths: string[];
    dependencyFiles?: string[];
}
//# sourceMappingURL=types.d.ts.map