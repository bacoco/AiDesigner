/**
 * Session Manager
 * Manages design sessions with persistence
 */

import fs from 'fs/promises';
import path from 'path';

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

export class SessionManager {
  private sessionsDir: string;
  private activeSessions: Map<string, DesignSession>;

  constructor(baseDir?: string) {
    this.sessionsDir = baseDir || path.join(process.cwd(), '.quick-designer-sessions');
    this.activeSessions = new Map();
  }

  async init(): Promise<void> {
    await fs.mkdir(this.sessionsDir, { recursive: true });
  }

  generateSessionId(): string {
    return `qd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async createSession(designSystem?: any): Promise<DesignSession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: DesignSession = {
      sessionId,
      createdAt: now,
      lastModified: now,
      designSystem: designSystem || this.getDefaultDesignSystem(),
      variations: [],
      metadata: {
        totalVariations: 0
      }
    };

    this.activeSessions.set(sessionId, session);
    await this.saveSession(session);

    return session;
  }

  async getSession(sessionId: string): Promise<DesignSession | null> {
    // Check in-memory cache
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Load from disk
    try {
      const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);
      const data = await fs.readFile(sessionPath, 'utf-8');
      const session = JSON.parse(data) as DesignSession;
      this.activeSessions.set(sessionId, session);
      return session;
    } catch (error) {
      return null;
    }
  }

  async saveSession(session: DesignSession): Promise<void> {
    session.lastModified = new Date().toISOString();
    const sessionPath = path.join(this.sessionsDir, `${session.sessionId}.json`);
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
    this.activeSessions.set(session.sessionId, session);
  }

  async addVariation(
    sessionId: string,
    variation: {
      name: string;
      html: string;
      prompt: string;
    }
  ): Promise<DesignSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const variationId = `var_${Date.now()}_${session.variations.length + 1}`;
    session.variations.push({
      id: variationId,
      name: variation.name,
      html: variation.html,
      prompt: variation.prompt,
      timestamp: new Date().toISOString()
    });

    session.metadata.totalVariations = session.variations.length;
    await this.saveSession(session);

    return session;
  }

  async updateDesignSystem(sessionId: string, designSystem: Partial<any>): Promise<DesignSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.designSystem = {
      ...session.designSystem,
      ...designSystem,
      colors: { ...session.designSystem.colors, ...designSystem.colors },
      typography: { ...session.designSystem.typography, ...designSystem.typography },
      spacing: { ...session.designSystem.spacing, ...designSystem.spacing }
    };

    await this.saveSession(session);
    return session;
  }

  async listSessions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.sessionsDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  async exportSession(sessionId: string, outputPath: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await fs.writeFile(outputPath, JSON.stringify(session, null, 2), 'utf-8');
  }

  private getDefaultDesignSystem() {
    return {
      colors: {
        primary: '#667eea',
        secondary: '#48bb78',
        accent: '#ed64a6',
        neutral: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af'],
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#1f2937',
        muted: '#6b7280'
      },
      typography: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        scale: 1.25,
        headingFont: 'Inter',
        bodyFont: 'Inter'
      },
      spacing: {
        unit: '8px',
        scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
      },
      components: {
        borderRadius: '8px',
        shadowScale: [
          '0 1px 2px rgba(0, 0, 0, 0.05)',
          '0 4px 6px rgba(0, 0, 0, 0.1)',
          '0 10px 15px rgba(0, 0, 0, 0.15)'
        ]
      }
    };
  }

  async generateViewerHTML(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { designSystem, variations } = session;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Designer - Session ${sessionId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${designSystem.typography.fontFamily};
            background: #0a0a0a;
            color: #fafafa;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(90deg, ${designSystem.colors.primary} 0%, ${designSystem.colors.accent} 100%);
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }
        .header h1 { font-size: 1.5rem; font-weight: 700; }
        .tabs-container {
            background: #1a1a1a;
            border-bottom: 1px solid #333;
            display: flex;
            gap: 0;
            padding: 0 2rem;
            overflow-x: auto;
        }
        .tab {
            background: transparent;
            color: #888;
            border: none;
            padding: 1rem 1.5rem;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            position: relative;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .tab:hover { color: #ccc; background: rgba(255,255,255,0.05); }
        .tab.active {
            color: #fff;
            background: rgba(102, 126, 234, 0.1);
        }
        .tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: ${designSystem.colors.primary};
        }
        .content-area {
            flex: 1;
            position: relative;
            background: #0f0f0f;
            overflow: hidden;
        }
        .variation-frame {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: none;
            overflow: auto;
        }
        .variation-frame.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .controls {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            display: flex;
            gap: 1rem;
            z-index: 1000;
        }
        .control-btn {
            background: rgba(26, 26, 26, 0.95);
            border: 1px solid #333;
            color: #fff;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            backdrop-filter: blur(10px);
        }
        .control-btn:hover {
            background: rgba(102, 126, 234, 0.2);
            border-color: ${designSystem.colors.primary};
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Quick Designer - ${variations.length} Variations</h1>
        <div style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
            Session: ${sessionId.substring(0, 12)}...
        </div>
    </div>

    <div class="tabs-container">
        ${variations.map((v, i) => `
        <button class="tab ${i === 0 ? 'active' : ''}" data-variation="${i}">
            Variation ${i + 1}: ${v.name}
        </button>
        `).join('')}
    </div>

    <div class="content-area">
        ${variations.map((v, i) => `
        <div class="variation-frame ${i === 0 ? 'active' : ''}" data-content="${i}">
            ${v.html}
        </div>
        `).join('')}
    </div>

    <div class="controls">
        <button class="control-btn" onclick="previousVariation()">← Précédent</button>
        <button class="control-btn" onclick="nextVariation()">Suivant →</button>
    </div>

    <script>
        let currentVariation = 0;
        const totalVariations = ${variations.length};

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const variation = parseInt(this.dataset.variation);
                switchToVariation(variation);
            });
        });

        function switchToVariation(index) {
            currentVariation = index;
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab')[index].classList.add('active');
            document.querySelectorAll('.variation-frame').forEach(frame => frame.classList.remove('active'));
            document.querySelectorAll('.variation-frame')[index].classList.add('active');
        }

        function nextVariation() {
            const next = (currentVariation + 1) % totalVariations;
            switchToVariation(next);
        }

        function previousVariation() {
            const prev = currentVariation === 0 ? totalVariations - 1 : currentVariation - 1;
            switchToVariation(prev);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') previousVariation();
            if (e.key === 'ArrowRight') nextVariation();
        });
    </script>
</body>
</html>`;
  }
}

export const sessionManager = new SessionManager();