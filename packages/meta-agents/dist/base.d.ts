import type { MetaAgentResult, MetaAgentRuntimeOptions } from './types';
import { ArtifactManager, type StageExecutionResult } from './utils';
export declare abstract class BaseMetaAgent<Input, Result extends MetaAgentResult = MetaAgentResult> {
    protected readonly input: Input;
    protected readonly options: MetaAgentRuntimeOptions;
    protected readonly id: string;
    protected readonly title: string;
    protected readonly description: string;
    protected readonly artifactManager: ArtifactManager;
    protected readonly projectRoot: string;
    protected readonly logger: (message: string) => void;
    protected readonly clock: () => Date;
    private readonly stages;
    private readonly stageOrder;
    private startedAt?;
    private completedAt?;
    private runStamp;
    private artifactCounter;
    constructor(id: string, title: string, description: string, input: Input, options?: MetaAgentRuntimeOptions);
    protected registerStage(id: string, title: string): void;
    private updateStageStatus;
    protected runStage(id: string, title: string, handler: () => Promise<StageExecutionResult>): Promise<void>;
    protected createArtifactPath(baseDirectory: string, prefix: string, extension: string): string;
    protected abstract execute(): Promise<string>;
    run(): Promise<Result>;
}
//# sourceMappingURL=base.d.ts.map