import fs from 'fs-extra';
import type { FileSystem, ArtifactRecord, SupabaseClientLike } from './types';
export declare class NodeFileSystem implements FileSystem {
    ensureDir(target: string): Promise<void>;
    writeFile(target: string, data: string, encoding?: BufferEncoding): Promise<void>;
    readFile(target: string, encoding?: BufferEncoding): Promise<string>;
    pathExists(target: string): Promise<boolean>;
    readdir(target: string): Promise<string[]>;
    stat(target: string): Promise<fs.Stats>;
}
export declare class ArtifactManager {
    private readonly projectRoot;
    private readonly fileSystem;
    private readonly artifacts;
    constructor(projectRoot: string, fileSystem: FileSystem);
    get records(): ArtifactRecord[];
    write(relativePath: string, contents: string, description: string): Promise<ArtifactRecord>;
}
export interface StageExecutionResult {
    summary: string;
    artifacts?: ArtifactRecord[];
}
export declare const formatTimestamp: (date: Date) => string;
export interface SupabaseTableDefinition {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        defaultValue?: string | null;
    }>;
}
export declare function fetchSupabasePublicSchema(client?: SupabaseClientLike): Promise<SupabaseTableDefinition[]>;
export declare const renderMermaidComponentMap: (components: Array<{
    name: string;
    type: string;
    relations: string[];
}>) => string;
export declare const tokenizeLines: (contents: string) => string[];
export declare const slidingWindow: <T>(values: T[], size: number) => T[][];
export interface CommandCheckResult {
    command: string;
    status: 'ok' | 'skipped';
    note?: string;
}
export declare const extractShellCommands: (guideContent: string) => string[];
export declare const summarizeCommands: (commands: string[]) => CommandCheckResult[];
export declare const normalizeTechnologyStack: (stack: string[]) => string[];
//# sourceMappingURL=utils.d.ts.map