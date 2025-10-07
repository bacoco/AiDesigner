'use strict';
/**
 * Design Library Storage
 * Persistence layer for Quick Designer v4
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.DesignLibraryStorage = void 0;
exports.getStorage = getStorage;
const fs = __importStar(require('fs-extra'));
const path = __importStar(require('path'));
class DesignLibraryStorage {
  constructor(basePath) {
    this.storagePath = basePath || path.join(process.cwd(), '.design-library');
    this.libraryPath = path.join(this.storagePath, 'library');
    this.sessionsPath = path.join(this.storagePath, 'sessions');
    this.initialize();
  }
  async initialize() {
    await fs.ensureDir(this.storagePath);
    await fs.ensureDir(this.libraryPath);
    await fs.ensureDir(this.sessionsPath);
  }
  /**
   * Save design library entry
   */
  async saveLibraryEntry(entry) {
    const filePath = path.join(this.libraryPath, `${entry.id}.json`);
    await fs.writeJson(filePath, entry, { spaces: 2 });
  }
  /**
   * Load design library entry
   */
  async loadLibraryEntry(id) {
    const filePath = path.join(this.libraryPath, `${id}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }
  /**
   * List all library entries
   */
  async listLibraryEntries(type) {
    const files = await fs.readdir(this.libraryPath);
    const entries = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const entry = await fs.readJson(path.join(this.libraryPath, file));
        if (!type || entry.type === type) {
          entries.push(entry);
        }
      }
    }
    return entries.sort(
      (a, b) => new Date(b.metadata.updated).getTime() - new Date(a.metadata.updated).getTime(),
    );
  }
  /**
   * Save session data
   */
  async saveSession(session) {
    const filePath = path.join(this.sessionsPath, `${session.id}.json`);
    session.lastActivity = new Date();
    await fs.writeJson(filePath, session, { spaces: 2 });
  }
  /**
   * Load session data
   */
  async loadSession(sessionId) {
    const filePath = path.join(this.sessionsPath, `${sessionId}.json`);
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  }
  /**
   * List active sessions
   */
  async listSessions() {
    const files = await fs.readdir(this.sessionsPath);
    const sessions = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const session = await fs.readJson(path.join(this.sessionsPath, file));
        sessions.push(session);
      }
    }
    return sessions.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );
  }
  /**
   * Delete old sessions (cleanup)
   */
  async cleanupOldSessions(daysToKeep = 7) {
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
  async saveDesignSystem(name, designSpec, metadata) {
    const id = `design-system-${Date.now()}`;
    const entry = {
      id,
      name,
      type: 'system',
      designSpec,
      metadata: {
        created: new Date(),
        updated: new Date(),
        ...metadata,
      },
    };
    await this.saveLibraryEntry(entry);
    return id;
  }
  /**
   * Load design system
   */
  async loadDesignSystem(id) {
    const entry = await this.loadLibraryEntry(id);
    return entry?.designSpec || null;
  }
  /**
   * Save page with variations
   */
  async savePage(page, sessionId) {
    const session = await this.loadSession(sessionId);
    if (session) {
      const existingIndex = session.pages.findIndex((p) => p.id === page.id);
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
  async validateVariation(sessionId, pageId, variationId) {
    const session = await this.loadSession(sessionId);
    if (session) {
      const page = session.pages.find((p) => p.id === pageId);
      if (page) {
        const variation = page.variations.find((v) => v.id === variationId);
        if (variation) {
          variation.validated = true;
          // Also save as library entry
          const entry = {
            id: `variation-${variationId}`,
            name: `${page.name} - ${variation.name}`,
            type: 'variation',
            designSpec: variation.designSpec || session.designSystem,
            metadata: {
              created: new Date(),
              updated: new Date(),
              validated: true,
              tags: [page.type, variation.name],
            },
            content: {
              html: variation.html,
              pageType: page.type,
            },
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
  async exportSession(sessionId) {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return {
      session: {
        id: session.id,
        created: session.workflow.startTime,
        updated: session.lastActivity,
      },
      designSystem: session.designSystem,
      pages: session.pages.map((page) => ({
        name: page.name,
        type: page.type,
        variations: page.variations.map((v) => ({
          name: v.name,
          validated: v.validated,
          html: v.html,
        })),
      })),
      stats: {
        totalPages: session.pages.length,
        totalVariations: session.pages.reduce((sum, p) => sum + p.variations.length, 0),
        validatedVariations: session.pages.reduce(
          (sum, p) => sum + p.variations.filter((v) => v.validated).length,
          0,
        ),
      },
    };
  }
  /**
   * Import design system from file
   */
  async importDesignSystem(filePath) {
    const content = await fs.readJson(filePath);
    return await this.saveDesignSystem(
      content.name || 'Imported Design System',
      content.designSpec || content,
      { source: filePath },
    );
  }
  /**
   * Get storage statistics
   */
  async getStatistics() {
    const libraryEntries = await this.listLibraryEntries();
    const sessions = await this.listSessions();
    return {
      library: {
        total: libraryEntries.length,
        systems: libraryEntries.filter((e) => e.type === 'system').length,
        components: libraryEntries.filter((e) => e.type === 'component').length,
        pages: libraryEntries.filter((e) => e.type === 'page').length,
        variations: libraryEntries.filter((e) => e.type === 'variation').length,
      },
      sessions: {
        total: sessions.length,
        active: sessions.filter(
          (s) => new Date(s.lastActivity) > new Date(Date.now() - 24 * 60 * 60 * 1000),
        ).length,
      },
      storage: {
        path: this.storagePath,
        sizeEstimate: await this.estimateStorageSize(),
      },
    };
  }
  async estimateStorageSize() {
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
  async searchLibrary(query) {
    const entries = await this.listLibraryEntries();
    const searchTerm = query.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(searchTerm) ||
        entry.metadata.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        entry.type.includes(searchTerm),
    );
  }
  /**
   * Get validated variations
   */
  async getValidatedVariations() {
    const entries = await this.listLibraryEntries('variation');
    return entries.filter((e) => e.metadata.validated);
  }
}
exports.DesignLibraryStorage = DesignLibraryStorage;
// Singleton instance
let storageInstance = null;
function getStorage() {
  if (!storageInstance) {
    storageInstance = new DesignLibraryStorage();
  }
  return storageInstance;
}
exports.default = DesignLibraryStorage;
