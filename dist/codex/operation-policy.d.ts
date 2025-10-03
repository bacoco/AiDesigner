export interface OperationPolicy {
    maxExecutionsPerHour?: number;
    escalate?: boolean;
}
export interface PolicyConfig {
    defaults?: OperationPolicy;
    default?: OperationPolicy;
    operations?: Record<string, OperationPolicy>;
}
export interface PolicyAssessment {
    matchedKey?: string;
    requiresEscalation: boolean;
    violation?: Error;
    commit?: () => void;
}
interface EnforcerOptions {
    now?: () => number;
    source?: string;
}
export declare class OperationPolicyEnforcer {
    private readonly config;
    private readonly usage;
    private readonly now;
    private readonly source?;
    constructor(config: PolicyConfig, options?: EnforcerOptions);
    static fromFile(filePath: string): OperationPolicyEnforcer;
    assess(operation: string, keys: string[]): PolicyAssessment | undefined;
    getSource(): string | undefined;
    private resolve;
}
export {};
