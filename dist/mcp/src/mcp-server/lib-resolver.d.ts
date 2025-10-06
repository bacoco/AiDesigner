export declare function resolveFromPackageRoot(...segments: string[]): string;
export declare function resolveLibPath(moduleName: string): string;
export declare function importLibModule<TModule = unknown>(moduleName: string): Promise<TModule>;
export declare function requireLibModule<TModule = unknown>(moduleName: string): TModule;
export declare function importFromPackageRoot<TModule = unknown>(...segments: string[]): Promise<TModule>;
