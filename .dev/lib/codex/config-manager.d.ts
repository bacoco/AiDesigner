export interface EnsureConfigOptions {
    nonInteractive?: boolean;
}
export interface EnsureConfigResult {
    configPath: string;
    changed: boolean;
    config: Record<string, any>;
}
export declare function ensureCodexConfig(options?: EnsureConfigOptions): Promise<EnsureConfigResult>;
export declare function getCodexConfigPath(): string;
