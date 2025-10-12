import { BaseMetaAgent } from './base';
import type { LibrarianInput, MetaAgentRuntimeOptions } from './types';
export declare class LibrarianMetaAgent extends BaseMetaAgent<LibrarianInput> {
    constructor(input?: LibrarianInput, options?: MetaAgentRuntimeOptions);
    private listFiles;
    private deriveArchitecture;
    private generateArchitectureDoc;
    private parseEndpointLine;
    private collectApiEndpoints;
    private renderApiReference;
    private renderDatabaseSchema;
    private renderSetupValidation;
    protected execute(): Promise<string>;
}
//# sourceMappingURL=librarian.d.ts.map