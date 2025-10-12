import { BaseMetaAgent } from './base';
import type { MetaAgentRuntimeOptions, RefactorInput } from './types';
export declare class RefactorMetaAgent extends BaseMetaAgent<RefactorInput> {
    constructor(input: RefactorInput, options?: MetaAgentRuntimeOptions);
    private listFiles;
    private loadSourceFiles;
    private detectDuplications;
    private analyzeComplexity;
    private auditDependencies;
    private renderDuplicationReport;
    private renderComplexityReport;
    private renderDependencyReport;
    protected execute(): Promise<string>;
}
//# sourceMappingURL=refactor.d.ts.map