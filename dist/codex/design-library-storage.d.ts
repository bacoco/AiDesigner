/**
 * Design Library Storage
 * Persistence layer for Quick Designer v4
 */
import type { DesignSpec } from "./ui-generator.js";
import type { WorkflowSession } from "./workflow-manager.js";
export interface DesignLibraryEntry {
    id: string;
    name: string;
    type: "system" | "component" | "page" | "variation";
    designSpec: DesignSpec;
    metadata: {
        created: Date;
        updated: Date;
        source?: string;
        tags?: string[];
        validated?: boolean;
    };
    content?: any;
}
export interface SessionData {
    id: string;
    workflow: WorkflowSession;
    designSystem: DesignSpec;
    pages: PageData[];
    lastActivity: Date;
}
export interface PageData {
    id: string;
    name: string;
    type: string;
    variations: VariationData[];
    createdAt: Date;
}
export interface VariationData {
    id: string;
    name: string;
    html: string;
    designSpec?: DesignSpec;
    validated: boolean;
    metadata?: any;
}
export declare class DesignLibraryStorage {
    private storagePath;
    private libraryPath;
    private sessionsPath;
    constructor(basePath?: string);
    private initialize;
    /**
     * Save design library entry
     */
    saveLibraryEntry(entry: DesignLibraryEntry): Promise<void>;
    /**
     * Load design library entry
     */
    loadLibraryEntry(id: string): Promise<DesignLibraryEntry | null>;
    /**
     * List all library entries
     */
    listLibraryEntries(type?: string): Promise<DesignLibraryEntry[]>;
    /**
     * Save session data
     */
    saveSession(session: SessionData): Promise<void>;
    /**
     * Load session data
     */
    loadSession(sessionId: string): Promise<SessionData | null>;
    /**
     * List active sessions
     */
    listSessions(): Promise<SessionData[]>;
    /**
     * Delete old sessions (cleanup)
     */
    cleanupOldSessions(daysToKeep?: number): Promise<number>;
    /**
     * Save design system
     */
    saveDesignSystem(name: string, designSpec: DesignSpec, metadata?: any): Promise<string>;
    /**
     * Load design system
     */
    loadDesignSystem(id: string): Promise<DesignSpec | null>;
    /**
     * Save page with variations
     */
    savePage(page: PageData, sessionId: string): Promise<void>;
    /**
     * Mark variation as validated
     */
    validateVariation(sessionId: string, pageId: string, variationId: string): Promise<void>;
    /**
     * Export session as bundle
     */
    exportSession(sessionId: string): Promise<any>;
    /**
     * Import design system from file
     */
    importDesignSystem(filePath: string): Promise<string>;
    /**
     * Get storage statistics
     */
    getStatistics(): Promise<any>;
    private estimateStorageSize;
    /**
     * Search library entries
     */
    searchLibrary(query: string): Promise<DesignLibraryEntry[]>;
    /**
     * Get validated variations
     */
    getValidatedVariations(): Promise<DesignLibraryEntry[]>;
}
export declare function getStorage(): DesignLibraryStorage;
export default DesignLibraryStorage;
