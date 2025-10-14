/**
 * Session Manager
 * Manages design sessions with persistence
 */
export interface DesignSession {
    sessionId: string;
    createdAt: string;
    lastModified: string;
    designSystem: {
        colors: {
            primary: string;
            secondary?: string;
            accent?: string;
            neutral: string[];
            background: string;
            surface: string;
            text?: string;
            muted?: string;
        };
        typography: {
            fontFamily: string;
            scale?: number;
            headingFont?: string;
            bodyFont?: string;
        };
        spacing: {
            unit: string;
            scale?: number[];
        };
        components?: {
            borderRadius?: string;
            shadowScale?: string[];
            button?: any;
            input?: any;
            card?: any;
        };
    };
    variations: Array<{
        id: string;
        name: string;
        html: string;
        prompt: string;
        timestamp: string;
    }>;
    metadata: {
        totalVariations: number;
        projectName?: string;
        tags?: string[];
    };
}
export declare class SessionManager {
    private sessionsDir;
    private activeSessions;
    constructor(baseDir?: string);
    init(): Promise<void>;
    generateSessionId(): string;
    createSession(designSystem?: any): Promise<DesignSession>;
    getSession(sessionId: string): Promise<DesignSession | null>;
    saveSession(session: DesignSession): Promise<void>;
    addVariation(sessionId: string, variation: {
        name: string;
        html: string;
        prompt: string;
    }): Promise<DesignSession>;
    updateDesignSystem(sessionId: string, designSystem: Partial<any>): Promise<DesignSession>;
    listSessions(): Promise<string[]>;
    exportSession(sessionId: string, outputPath: string): Promise<void>;
    private getDefaultDesignSystem;
    generateViewerHTML(sessionId: string): Promise<string>;
}
export declare const sessionManager: SessionManager;
