'use strict';
/**
 * Variation Generator
 * Generates UI variations from any prompt while maintaining design system
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.variationGenerator = exports.VariationGenerator = void 0;
class VariationGenerator {
  /**
   * Generate HTML from a prompt using the session's design system
   */
  async generateFromPrompt(prompt, session, options = {}) {
    const { count = 3, style = 'modern', includeAnimations = true, responsive = true } = options;
    const variations = [];
    const { designSystem } = session;
    // Extract intent from prompt
    const intent = this.analyzePrompt(prompt);
    for (let i = 0; i < count; i++) {
      const html = this.generateVariation(intent, designSystem, i, style, {
        includeAnimations,
        responsive,
      });
      variations.push(html);
    }
    return variations;
  }
  /**
   * Analyze prompt to extract UI requirements
   */
  analyzePrompt(prompt) {
    const lower = prompt.toLowerCase();
    // Detect page type
    let type = 'generic';
    if (lower.includes('dashboard') || lower.includes('analytics')) type = 'dashboard';
    if (lower.includes('landing') || lower.includes('home')) type = 'landing';
    if (lower.includes('login') || lower.includes('auth')) type = 'auth';
    if (lower.includes('profile') || lower.includes('account')) type = 'profile';
    if (lower.includes('pricing') || lower.includes('plans')) type = 'pricing';
    if (lower.includes('form') || lower.includes('contact')) type = 'form';
    if (lower.includes('e-commerce') || lower.includes('shop')) type = 'ecommerce';
    if (lower.includes('blog') || lower.includes('article')) type = 'blog';
    // Detect components
    const components = [];
    if (lower.includes('table')) components.push('table');
    if (lower.includes('chart') || lower.includes('graph')) components.push('chart');
    if (lower.includes('card')) components.push('card');
    if (lower.includes('form')) components.push('form');
    if (lower.includes('button')) components.push('button');
    if (lower.includes('navigation') || lower.includes('nav')) components.push('nav');
    if (lower.includes('sidebar')) components.push('sidebar');
    if (lower.includes('modal')) components.push('modal');
    if (lower.includes('tab')) components.push('tabs');
    // Detect layout preference
    let layout = 'standard';
    if (lower.includes('grid')) layout = 'grid';
    if (lower.includes('sidebar')) layout = 'sidebar';
    if (lower.includes('split')) layout = 'split';
    if (lower.includes('full')) layout = 'fullscreen';
    // Detect features
    const features = [];
    if (lower.includes('dark mode')) features.push('darkMode');
    if (lower.includes('responsive')) features.push('responsive');
    if (lower.includes('animation')) features.push('animations');
    if (lower.includes('real-time') || lower.includes('live')) features.push('realtime');
    return { type, components, layout, features };
  }
  /**
   * Generate a single variation
   */
  generateVariation(intent, designSystem, index, style, options) {
    const { colors, typography, spacing, components } = designSystem;
    // Generate unique layout approach for each variation
    const layoutApproach = this.getLayoutApproach(index);
    // Build HTML based on intent type
    switch (intent.type) {
      case 'dashboard':
        return this.generateDashboard(intent, designSystem, layoutApproach, style, options);
      case 'landing':
        return this.generateLanding(intent, designSystem, layoutApproach, style, options);
      case 'auth':
        return this.generateAuth(intent, designSystem, layoutApproach, style, options);
      case 'pricing':
        return this.generatePricing(intent, designSystem, layoutApproach, style, options);
      case 'ecommerce':
        return this.generateEcommerce(intent, designSystem, layoutApproach, style, options);
      default:
        return this.generateGeneric(intent, designSystem, layoutApproach, style, options);
    }
  }
  getLayoutApproach(index) {
    const approaches = [
      'cards',
      'sidebar',
      'grid',
      'minimal',
      'detailed',
      'split',
      'masonry',
      'timeline',
    ];
    return approaches[index % approaches.length];
  }
  generateDashboard(intent, ds, layout, style, options) {
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
            color: ${ds.colors.text || '#1f2937'};
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            background: ${ds.colors.primary};
            color: white;
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            margin-bottom: 2rem;
        }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
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
            box-shadow: ${ds.components.shadowScale?.[1] || '0 4px 6px rgba(0,0,0,0.1)'};
            ${options.includeAnimations ? 'transition: transform 0.2s;' : ''}
        }
        ${options.includeAnimations ? '.stat-card:hover { transform: translateY(-4px); }' : ''}
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: ${ds.colors.primary};
            margin: 0.5rem 0;
        }
        .stat-label {
            color: ${ds.colors.muted || '#6b7280'};
            font-size: 0.9rem;
        }
        .charts {
            display: grid;
            grid-template-columns: ${layout === 'split' ? '2fr 1fr' : '1fr'};
            gap: 1.5rem;
        }
        .chart-box {
            background: ${ds.colors.surface};
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: ${ds.components.shadowScale?.[1] || '0 4px 6px rgba(0,0,0,0.1)'};
        }
        .chart-placeholder {
            height: 300px;
            background: linear-gradient(135deg, ${ds.colors.primary}22, ${ds.colors.accent}22);
            border-radius: ${ds.components.borderRadius};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${ds.colors.muted || '#6b7280'};
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dashboard - ${layout.charAt(0).toUpperCase() + layout.slice(1)} Layout</h1>
            <p>Vue d'ensemble de vos données</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Utilisateurs Actifs</div>
                <div class="stat-value">12,483</div>
                <div style="color: ${ds.colors.secondary || '#48bb78'};">↑ 12.5%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Revenus</div>
                <div class="stat-value">€84,329</div>
                <div style="color: ${ds.colors.secondary || '#48bb78'};">↑ 23.1%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Conversion</div>
                <div class="stat-value">3.42%</div>
                <div style="color: ${ds.colors.accent || '#ed64a6'};">↓ 2.1%</div>
            </div>
            ${
              layout === 'detailed'
                ? `
            <div class="stat-card">
                <div class="stat-label">Sessions</div>
                <div class="stat-value">458K</div>
                <div style="color: ${ds.colors.secondary || '#48bb78'};">↑ 18.7%</div>
            </div>
            `
                : ''
            }
        </div>

        <div class="charts">
            <div class="chart-box">
                <h3 style="margin-bottom: 1rem;">Évolution des Performances</h3>
                <div class="chart-placeholder">Graphique de Performance</div>
            </div>
            ${
              layout === 'split'
                ? `
            <div class="chart-box">
                <h3 style="margin-bottom: 1rem;">Répartition</h3>
                <div class="chart-placeholder" style="height: 200px;">Données Clés</div>
            </div>
            `
                : ''
            }
        </div>
    </div>
</body>
</html>`;
  }
  generateLanding(intent, ds, layout, style, options) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page - ${layout}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${ds.typography.fontFamily};
            color: ${ds.colors.text || '#1f2937'};
        }
        .hero {
            background: linear-gradient(135deg, ${ds.colors.primary}, ${ds.colors.accent});
            color: white;
            padding: 6rem 2rem;
            text-align: center;
        }
        .hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.3rem; opacity: 0.95; margin-bottom: 2rem; }
        .cta-button {
            background: white;
            color: ${ds.colors.primary};
            padding: 1rem 2.5rem;
            border: none;
            border-radius: ${ds.components.borderRadius};
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            ${options.includeAnimations ? 'transition: all 0.3s;' : ''}
        }
        ${options.includeAnimations ? '.cta-button:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }' : ''}
        .features {
            padding: 4rem 2rem;
            background: ${ds.colors.surface};
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        .feature-card {
            background: ${ds.colors.background};
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            text-align: center;
            box-shadow: ${ds.components.shadowScale?.[1] || '0 4px 6px rgba(0,0,0,0.1)'};
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>Transformez Votre Business</h1>
        <p>La solution que vous attendiez</p>
        <button class="cta-button">Commencer Maintenant</button>
    </section>

    <section class="features">
        <div class="container">
            <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem; color: ${ds.colors.primary};">
                Pourquoi Nous Choisir?
            </h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>Rapide</h3>
                    <p>Performance optimale pour vos besoins</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3>Sécurisé</h3>
                    <p>Protection de vos données garantie</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🚀</div>
                    <h3>Innovant</h3>
                    <p>Technologies de pointe</p>
                </div>
            </div>
        </div>
    </section>
</body>
</html>`;
  }
  generateAuth(intent, ds, layout, style, options) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ${layout}</title>
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
            max-width: ${layout === 'minimal' ? '400px' : '500px'};
            width: 100%;
        }
        h1 { color: ${ds.colors.primary}; margin-bottom: 2rem; text-align: center; }
        .input-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: ${ds.colors.text || '#1f2937'};
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: ${ds.components.borderRadius};
            font-size: 1rem;
        }
        input:focus {
            outline: none;
            border-color: ${ds.colors.primary};
        }
        button {
            width: 100%;
            background: ${ds.colors.primary};
            color: white;
            padding: 1rem;
            border: none;
            border-radius: ${ds.components.borderRadius};
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
        }
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
  generatePricing(intent, ds, layout, style, options) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarifs</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${ds.typography.fontFamily};
            background: ${ds.colors.background};
            padding: 4rem 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; text-align: center; }
        h1 {
            font-size: 3rem;
            color: ${ds.colors.primary};
            margin-bottom: 3rem;
        }
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .pricing-card {
            background: ${ds.colors.surface};
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: ${ds.components.shadowScale?.[1] || '0 4px 6px rgba(0,0,0,0.1)'};
        }
        .pricing-card.featured {
            border: 2px solid ${ds.colors.primary};
            transform: scale(1.05);
        }
        .price {
            font-size: 3rem;
            color: ${ds.colors.primary};
            font-weight: 700;
            margin: 1rem 0;
        }
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
  generateEcommerce(intent, ds, layout, style, options) {
    return this.generateGeneric(intent, ds, layout, style, options);
  }
  generateGeneric(intent, ds, layout, style, options) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Générée</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${ds.typography.fontFamily};
            background: ${ds.colors.background};
            color: ${ds.colors.text || '#1f2937'};
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: ${ds.colors.primary};
            color: white;
            padding: 3rem 2rem;
            border-radius: ${ds.components.borderRadius};
            text-align: center;
            margin-bottom: 2rem;
        }
        .content {
            background: ${ds.colors.surface};
            padding: 2rem;
            border-radius: ${ds.components.borderRadius};
            box-shadow: ${ds.components.shadowScale?.[1] || '0 4px 6px rgba(0,0,0,0.1)'};
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Page Générée - ${layout}</h1>
            <p>Design System appliqué avec succès</p>
        </div>
        <div class="content">
            <h2 style="color: ${ds.colors.primary}; margin-bottom: 1rem;">Contenu Principal</h2>
            <p>Cette page a été générée avec votre Design System personnalisé.</p>
        </div>
    </div>
</body>
</html>`;
  }
}
exports.VariationGenerator = VariationGenerator;
exports.variationGenerator = new VariationGenerator();
