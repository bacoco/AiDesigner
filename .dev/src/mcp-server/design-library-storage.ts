/**
 * Design Library Storage
 * Persistence layer for Quick Designer v4
 */

import * as fs from "fs-extra";
import * as path from "path";
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

export class DesignLibraryStorage {
  private storagePath: string;
  private libraryPath: string;
  private sessionsPath: string;

  constructor(basePath?: string) {
    this.storagePath = basePath || path.join(process.cwd(), ".design-library");
    this.libraryPath = path.join(this.storagePath, "library");
    this.sessionsPath = path.join(this.storagePath, "sessions");
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await fs.ensureDir(this.storagePath);
    await fs.ensureDir(this.libraryPath);
    await fs.ensureDir(this.sessionsPath);
  }

  /**
   * Save design library entry
   */
  async saveLibraryEntry(entry: DesignLibraryEntry): Promise<void> {
    const filePath = path.join(this.libraryPath, `${entry.id}.json`);
    await fs.writeJson(filePath, entry, { spaces: 2 });
  }

  /**
   * Load design library entry
   */
  async loadLibraryEntry(id: string): Promise<DesignLibraryEntry | null> {
    const filePath = path.join(this.libraryPath, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  /**
   * List all library entries
   */
  async listLibraryEntries(type?: string): Promise<DesignLibraryEntry[]> {
    const files = await fs.readdir(this.libraryPath);
    const entries: DesignLibraryEntry[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const entry = await fs.readJson(path.join(this.libraryPath, file));
        if (!type || entry.type === type) {
          entries.push(entry);
        }
      }
    }

    return entries.sort((a, b) =>
      new Date(b.metadata.updated).getTime() - new Date(a.metadata.updated).getTime()
    );
  }

  /**
   * Save session data
   */
  async saveSession(session: SessionData): Promise<void> {
    const filePath = path.join(this.sessionsPath, `${session.id}.json`);
    session.lastActivity = new Date();
    await fs.writeJson(filePath, session, { spaces: 2 });
  }

  /**
   * Load session data
   */
  async loadSession(sessionId: string): Promise<SessionData | null> {
    const filePath = path.join(this.sessionsPath, `${sessionId}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }

  /**
   * List active sessions
   */
  async listSessions(): Promise<SessionData[]> {
    const files = await fs.readdir(this.sessionsPath);
    const sessions: SessionData[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const session = await fs.readJson(path.join(this.sessionsPath, file));
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }

  /**
   * Delete old sessions (cleanup)
   */
  async cleanupOldSessions(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const sessions = await this.listSessions();
    let deletedCount = 0;

    for (const session of sessions) {
      if (new Date(session.lastActivity) < cutoffDate) {
        await fs.remove(path.join(this.sessionsPath, `${session.id}.json`));
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Save design system
   */
  async saveDesignSystem(
    name: string,
    designSpec: DesignSpec,
    metadata?: any
  ): Promise<string> {
    const id = `design-system-${Date.now()}`;
    const entry: DesignLibraryEntry = {
      id,
      name,
      type: "system",
      designSpec,
      metadata: {
        created: new Date(),
        updated: new Date(),
        ...metadata
      }
    };

    await this.saveLibraryEntry(entry);
    return id;
  }

  /**
   * Load design system
   */
  async loadDesignSystem(id: string): Promise<DesignSpec | null> {
    const entry = await this.loadLibraryEntry(id);
    return entry?.designSpec || null;
  }

  /**
   * Save page with variations
   */
  async savePage(page: PageData, sessionId: string): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      const existingIndex = session.pages.findIndex(p => p.id === page.id);
      if (existingIndex >= 0) {
        session.pages[existingIndex] = page;
      } else {
        session.pages.push(page);
      }
      await this.saveSession(session);
    }
  }

  /**
   * Mark variation as validated
   */
  async validateVariation(
    sessionId: string,
    pageId: string,
    variationId: string
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      const page = session.pages.find(p => p.id === pageId);
      if (page) {
        const variation = page.variations.find(v => v.id === variationId);
        if (variation) {
          variation.validated = true;

          // Also save as library entry
          const entry: DesignLibraryEntry = {
            id: `variation-${variationId}`,
            name: `${page.name} - ${variation.name}`,
            type: "variation",
            designSpec: variation.designSpec || session.designSystem,
            metadata: {
              created: new Date(),
              updated: new Date(),
              validated: true,
              tags: [page.type, variation.name]
            },
            content: {
              html: variation.html,
              pageType: page.type
            }
          };

          await this.saveLibraryEntry(entry);
        }
      }
      await this.saveSession(session);
    }
  }

  /**
   * Export session as bundle
   */
  async exportSession(sessionId: string): Promise<any> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      session: {
        id: session.id,
        created: session.workflow.startTime,
        updated: session.lastActivity
      },
      designSystem: session.designSystem,
      pages: session.pages.map(page => ({
        name: page.name,
        type: page.type,
        variations: page.variations.map(v => ({
          name: v.name,
          validated: v.validated,
          html: v.html
        }))
      })),
      stats: {
        totalPages: session.pages.length,
        totalVariations: session.pages.reduce((sum, p) => sum + p.variations.length, 0),
        validatedVariations: session.pages.reduce(
          (sum, p) => sum + p.variations.filter(v => v.validated).length,
          0
        )
      }
    };
  }

  /**
   * Import design system from file
   */
  async importDesignSystem(filePath: string): Promise<string> {
    const content = await fs.readJson(filePath);
    return await this.saveDesignSystem(
      content.name || "Imported Design System",
      content.designSpec || content,
      { source: filePath }
    );
  }

  /**
   * Get storage statistics
   */
  async getStatistics(): Promise<any> {
    const libraryEntries = await this.listLibraryEntries();
    const sessions = await this.listSessions();

    return {
      library: {
        total: libraryEntries.length,
        systems: libraryEntries.filter(e => e.type === "system").length,
        components: libraryEntries.filter(e => e.type === "component").length,
        pages: libraryEntries.filter(e => e.type === "page").length,
        variations: libraryEntries.filter(e => e.type === "variation").length
      },
      sessions: {
        total: sessions.length,
        active: sessions.filter(s =>
          new Date(s.lastActivity) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      },
      storage: {
        path: this.storagePath,
        sizeEstimate: await this.estimateStorageSize()
      }
    };
  }

  private async estimateStorageSize(): Promise<string> {
    // Simple estimation based on file count
    const libraryFiles = await fs.readdir(this.libraryPath);
    const sessionFiles = await fs.readdir(this.sessionsPath);
    const totalFiles = libraryFiles.length + sessionFiles.length;
    const avgFileSize = 10; // KB estimate
    return `~${totalFiles * avgFileSize} KB`;
  }

  /**
   * Search library entries
   */
  async searchLibrary(query: string): Promise<DesignLibraryEntry[]> {
    const entries = await this.listLibraryEntries();
    const searchTerm = query.toLowerCase();

    return entries.filter(entry =>
      entry.name.toLowerCase().includes(searchTerm) ||
      entry.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      entry.type.includes(searchTerm)
    );
  }

  /**
   * Get validated variations
   */
  async getValidatedVariations(): Promise<DesignLibraryEntry[]> {
    const entries = await this.listLibraryEntries("variation");
    return entries.filter(e => e.metadata.validated);
  }
}

// Singleton instance
let storageInstance: DesignLibraryStorage | null = null;

export function getStorage(): DesignLibraryStorage {
  if (!storageInstance) {
    storageInstance = new DesignLibraryStorage();
  }
  return storageInstance;
}

export default DesignLibraryStorage;