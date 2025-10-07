/**
 * Quick Designer V4 - Standalone MCP Server
 * Works with any prompt, maintains design system, adds variations progressively
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storage
const SESSIONS_DIR = path.join(__dirname, '.quick-designer-sessions');
let currentSession = null;

// Default Design System
const DEFAULT_DS = {
  colors: {
    primary: '#667eea',
    secondary: '#48bb78',
    accent: '#ed64a6',
    neutral: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af'],
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    scale: 1.25,
  },
  spacing: {
    unit: '8px',
    scale: [4, 8, 12, 16, 24, 32, 48, 64],
  },
  components: {
    borderRadius: '8px',
    shadowScale: ['0 1px 2px rgba(0,0,0,0.05)', '0 4px 6px rgba(0,0,0,0.1)'],
  },
};

// Session Management
async function initStorage() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

function generateSessionId() {
  return `qd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function createSession(designSystem = DEFAULT_DS) {
  const session = {
    sessionId: generateSessionId(),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    designSystem,
    variations: [],
    metadata: { totalVariations: 0 },
  };

  await saveSession(session);
  currentSession = session;
  return session;
}

async function saveSession(session) {
  session.lastModified = new Date().toISOString();
  const sessionPath = path.join(SESSIONS_DIR, `${session.sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
}

// async function loadSession(sessionId) {
//   const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
//   const data = await fs.readFile(sessionPath, 'utf-8');
//   return JSON.parse(data);
// }

// HTML Generation
function analyzePrompt(prompt) {
  const lower = prompt.toLowerCase();
  let type = 'generic';

  if (lower.includes('dashboard') || lower.includes('analytics')) type = 'dashboard';
  else if (lower.includes('landing') || lower.includes('home')) type = 'landing';
  else if (lower.includes('login') || lower.includes('auth')) type = 'auth';
  else if (lower.includes('pricing') || lower.includes('plans')) type = 'pricing';
  else if (lower.includes('form')) type = 'form';

  return { type, prompt };
}

function generateHTML(intent, ds, index) {
  const layouts = ['cards', 'sidebar', 'grid', 'minimal', 'split'];
  const layout = layouts[index % layouts.length];

  switch (intent.type) {
    case 'dashboard': {
      return generateDashboard(intent, ds, layout);
    }
    case 'landing': {
      return generateLanding(intent, ds, layout);
    }
    case 'auth': {
      return generateAuth(intent, ds, layout);
    }
    case 'pricing': {
      return generatePricing(intent, ds, layout);
    }
    // No default
  }

  return generateGeneric(intent, ds, layout);
}

function generateDashboard(intent, ds, layout) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ${layout}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${ds.typography.fontFamily};
            background: ${ds.colors.background};
            color: ${ds.colors.text};
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .header {
            background: ${ds.colors.primary};
            color: white;
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            margin-bottom: 2rem;
        }
        .header h1 { font-size: 2rem; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: ${ds.colors.surface};
            padding: 1.5rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: ${ds.components.shadowScale[1]};
            transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-4px); }
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: ${ds.colors.primary};
            margin: 0.5rem 0;
        }
        .stat-label { color: ${ds.colors.muted}; }
        .charts {
            display: grid;
            grid-template-columns: ${layout === 'split' ? '2fr 1fr' : '1fr'};
            gap: 1.5rem;
        }
        .chart-box {
            background: ${ds.colors.surface};
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: ${ds.components.shadowScale[1]};
        }
        .chart-placeholder {
            height: 300px;
            background: linear-gradient(135deg, ${ds.colors.primary}22, ${ds.colors.accent}22);
            border-radius: ${ds.components.borderRadius};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${ds.colors.muted};
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dashboard - ${layout}</h1>
            <p>Généré avec prompt: "${intent.prompt.slice(0, 60)}..."</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Utilisateurs</div>
                <div class="stat-value">12,483</div>
                <div style="color: ${ds.colors.secondary};">↑ 12.5%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Revenus</div>
                <div class="stat-value">€84,329</div>
                <div style="color: ${ds.colors.secondary};">↑ 23.1%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Conversion</div>
                <div class="stat-value">3.42%</div>
                <div style="color: ${ds.colors.accent};">↓ 2.1%</div>
            </div>
        </div>
        <div class="charts">
            <div class="chart-box">
                <h3 style="margin-bottom: 1rem;">Performance</h3>
                <div class="chart-placeholder">Graphique de Performance</div>
            </div>
            ${layout === 'split' ? `<div class="chart-box"><h3>Répartition</h3><div class="chart-placeholder" style="height: 200px;">Données</div></div>` : ''}
        </div>
    </div>
</body>
</html>`;
}

function generateLanding(intent, ds) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${ds.typography.fontFamily}; }
        .hero {
            background: linear-gradient(135deg, ${ds.colors.primary}, ${ds.colors.accent});
            color: white;
            padding: 6rem 2rem;
            text-align: center;
        }
        .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
        .cta { background: white; color: ${ds.colors.primary}; padding: 1rem 2.5rem; border-radius: 50px; font-weight: 600; border: none; cursor: pointer; margin-top: 2rem; }
        .features { padding: 4rem 2rem; background: ${ds.colors.surface}; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 2rem auto; }
        .feature-card { background: ${ds.colors.background}; padding: 2rem; border-radius: ${ds.components.borderRadius}; text-align: center; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Transformez Votre Business</h1>
        <p style="font-size: 1.3rem;">La solution que vous attendiez</p>
        <button class="cta">Commencer Maintenant</button>
    </section>
    <section class="features">
        <h2 style="text-align: center; font-size: 2.5rem; color: ${ds.colors.primary}; margin-bottom: 2rem;">Pourquoi Nous Choisir?</h2>
        <div class="features-grid">
            <div class="feature-card"><div style="font-size: 3rem;">⚡</div><h3>Rapide</h3><p>Performance optimale</p></div>
            <div class="feature-card"><div style="font-size: 3rem;">🔒</div><h3>Sécurisé</h3><p>Protection garantie</p></div>
            <div class="feature-card"><div style="font-size: 3rem;">🚀</div><h3>Innovant</h3><p>Technologies avancées</p></div>
        </div>
    </section>
</body>
</html>`;
}

function generateAuth(intent, ds) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${ds.typography.fontFamily};
            background: linear-gradient(135deg, ${ds.colors.primary}, ${ds.colors.accent});
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .login-card {
            background: white;
            padding: 3rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
        }
        h1 { color: ${ds.colors.primary}; margin-bottom: 2rem; text-align: center; }
        .input-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: ${ds.components.borderRadius}; }
        button { width: 100%; background: ${ds.colors.primary}; color: white; padding: 1rem; border: none; border-radius: ${ds.components.borderRadius}; font-weight: 600; cursor: pointer; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>🔐 Connexion</h1>
        <div class="input-group">
            <label>Email</label>
            <input type="email" placeholder="votre@email.com">
        </div>
        <div class="input-group">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••">
        </div>
        <button>Se Connecter</button>
    </div>
</body>
</html>`;
}

function generatePricing(intent, ds) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarifs</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${ds.typography.fontFamily}; background: ${ds.colors.background}; padding: 4rem 2rem; }
        .container { max-width: 1200px; margin: 0 auto; text-align: center; }
        h1 { font-size: 3rem; color: ${ds.colors.primary}; margin-bottom: 3rem; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .pricing-card { background: ${ds.colors.surface}; padding: 2rem; border-radius: ${ds.components.borderRadius}; box-shadow: ${ds.components.shadowScale[1]}; }
        .pricing-card.featured { border: 2px solid ${ds.colors.primary}; transform: scale(1.05); }
        .price { font-size: 3rem; color: ${ds.colors.primary}; font-weight: 700; margin: 1rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Nos Tarifs</h1>
        <div class="pricing-grid">
            <div class="pricing-card">
                <h3>Starter</h3>
                <div class="price">€29<span style="font-size: 1rem;">/mois</span></div>
                <p>Pour débuter</p>
            </div>
            <div class="pricing-card featured">
                <h3>Pro</h3>
                <div class="price">€99<span style="font-size: 1rem;">/mois</span></div>
                <p>Le plus populaire</p>
            </div>
            <div class="pricing-card">
                <h3>Enterprise</h3>
                <div class="price">€299<span style="font-size: 1rem;">/mois</span></div>
                <p>Pour les équipes</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function generateGeneric(intent, ds, layout) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Générée</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${ds.typography.fontFamily}; background: ${ds.colors.background}; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: ${ds.colors.primary}; color: white; padding: 3rem 2rem; border-radius: ${ds.components.borderRadius}; text-align: center; margin-bottom: 2rem; }
        .content { background: ${ds.colors.surface}; padding: 2rem; border-radius: ${ds.components.borderRadius}; box-shadow: ${ds.components.shadowScale[1]}; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Page Générée - ${layout}</h1>
            <p>Prompt: "${intent.prompt}"</p>
        </div>
        <div class="content">
            <h2 style="color: ${ds.colors.primary}; margin-bottom: 1rem;">Contenu</h2>
            <p>Cette page a été générée avec votre Design System personnalisé.</p>
        </div>
    </div>
</body>
</html>`;
}

// Create viewer HTML
async function generateViewer(session) {
  const { sessionId, designSystem, variations } = session;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Designer - ${variations.length} Variations</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Inter, system-ui, sans-serif;
            background: #0a0a0a;
            color: #fafafa;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(90deg, ${designSystem.colors.primary}, ${designSystem.colors.accent});
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .tabs {
            background: #1a1a1a;
            border-bottom: 1px solid #333;
            display: flex;
            overflow-x: auto;
            padding: 0 2rem;
        }
        .tab {
            background: transparent;
            color: #888;
            border: none;
            padding: 1rem 1.5rem;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .tab.active {
            color: #fff;
            border-bottom-color: ${designSystem.colors.primary};
        }
        .content {
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        .variation {
            position: absolute;
            inset: 0;
            display: none;
            overflow: auto;
        }
        .variation.active { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Quick Designer - ${variations.length} Variations</h1>
        <div style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px;">
            ${sessionId.slice(0, 12)}...
        </div>
    </div>
    <div class="tabs">
        ${variations.map((v, i) => `<button class="tab ${i === 0 ? 'active' : ''}" onclick="showVariation(${i})">Var ${i + 1}</button>`).join('')}
    </div>
    <div class="content">
        ${variations.map((v, i) => `<div class="variation ${i === 0 ? 'active' : ''}" id="var-${i}">${v.html}</div>`).join('')}
    </div>
    <script>
        function showVariation(index) {
            document.querySelectorAll('.tab').forEach((t, i) => {
                t.classList.toggle('active', i === index);
            });
            document.querySelectorAll('.variation').forEach((v, i) => {
                v.classList.toggle('active', i === index);
            });
        }
    </script>
</body>
</html>`;
}

// MCP Server
const server = new Server(
  { name: 'quick-designer-v4', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'quick_designer_generate',
      description: "Générer des variations d'UI à partir de n'importe quel prompt",
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Prompt de génération' },
          count: { type: 'number', default: 3, description: 'Nombre de variations (1-8)' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'quick_designer_add',
      description: 'Ajouter une variation à la session en cours',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Nouveau prompt' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'quick_designer_show',
      description: 'Afficher toutes les variations dans le navigateur',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'quick_designer_generate') {
      const { prompt, count = 3 } = args;

      if (!currentSession) {
        await createSession();
      }

      const intent = analyzePrompt(prompt);

      for (let i = 0; i < count; i++) {
        const html = generateHTML(intent, currentSession.designSystem, i);
        currentSession.variations.push({
          id: `var_${Date.now()}_${i}`,
          name: `${prompt.slice(0, 30)} - Var ${currentSession.variations.length + 1}`,
          html,
          prompt,
          timestamp: new Date().toISOString(),
        });
      }

      currentSession.metadata.totalVariations = currentSession.variations.length;
      await saveSession(currentSession);

      return {
        content: [
          {
            type: 'text',
            text: `✨ ${count} variations générées!\n\nSession: ${currentSession.sessionId}\nTotal: ${currentSession.variations.length} variations\n\nUtilise 'quick_designer_show' pour voir toutes les variations.`,
          },
        ],
      };
    }

    if (name === 'quick_designer_add') {
      if (!currentSession)
        throw new Error("Aucune session. Utilise quick_designer_generate d'abord.");

      const { prompt } = args;
      const intent = analyzePrompt(prompt);
      const html = generateHTML(
        intent,
        currentSession.designSystem,
        currentSession.variations.length,
      );

      currentSession.variations.push({
        id: `var_${Date.now()}`,
        name: `${prompt.slice(0, 30)} - Var ${currentSession.variations.length + 1}`,
        html,
        prompt,
        timestamp: new Date().toISOString(),
      });

      currentSession.metadata.totalVariations = currentSession.variations.length;
      await saveSession(currentSession);

      return {
        content: [
          {
            type: 'text',
            text: `✨ Variation ajoutée!\n\nTotal: ${currentSession.variations.length} variations`,
          },
        ],
      };
    }

    if (name === 'quick_designer_show') {
      if (!currentSession) throw new Error('Aucune session.');

      const viewerHtml = await generateViewer(currentSession);
      const viewerPath = path.join(__dirname, `qd-${currentSession.sessionId.slice(0, 12)}.html`);
      await fs.writeFile(viewerPath, viewerHtml);

      exec(`open "${viewerPath}"`);

      return {
        content: [
          {
            type: 'text',
            text: `📄 Viewer créé: ${viewerPath}\n🌐 Ouverture dans le navigateur...`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ Erreur: ${error.message}` }],
      isError: true,
    };
  }
});

// Start
await initStorage();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('✅ Quick Designer v4 ready');
