import { BaseMetaAgent } from './base';
import type { GenesisInput, MetaAgentRuntimeOptions } from './types';
export declare class GenesisMetaAgent extends BaseMetaAgent<GenesisInput> {
    constructor(input: GenesisInput, options?: MetaAgentRuntimeOptions);
    private composeDomainBlueprint;
    private generateTimeline;
    private renderBlueprintMarkdown;
    private renderSubAgentsMarkdown;
    private renderMigrationDraft;
    protected execute(): Promise<string>;
}
