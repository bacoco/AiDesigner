/**
 * Pattern Library for Quick Designer v4
 * Provides deterministic HTML generation without LLM calls
 */

import type { DesignSpec } from "./ui-generator.js";

export interface Pattern {
  id: string;
  name: string;
  category: string;
  style: string;
  html: string;
  variables: string[];
}

export interface PatternVariation {
  base: string;
  modifiers: Record<string, string>;
}

/**
 * Apply design system to pattern HTML
 */
export function applyDesignSystem(html: string, design: DesignSpec): string {
  let result = html;

  // Color replacements
  result = result.replace(/\{\{primary\}\}/g, design.colors.primary);
  result = result.replace(/\{\{secondary\}\}/g, design.colors.secondary || design.colors.primary);
  result = result.replace(/\{\{accent\}\}/g, design.colors.accent || design.colors.primary);
  result = result.replace(/\{\{neutral\}\}/g, design.colors.neutral?.[0] || "#6B7280");
  result = result.replace(/\{\{neutral-light\}\}/g, design.colors.neutral?.[2] || "#9CA3AF");
  result = result.replace(/\{\{bg\}\}/g, design.colors.background || "#F9FAFB");
  result = result.replace(/\{\{surface\}\}/g, design.colors.surface || "#FFFFFF");

  // Typography replacements
  result = result.replace(/\{\{font-family\}\}/g, design.typography.fontFamily);
  result = result.replace(/\{\{font-heading\}\}/g, design.typography.headingFont || design.typography.fontFamily);
  result = result.replace(/\{\{font-body\}\}/g, design.typography.bodyFont || design.typography.fontFamily);

  // Component replacements
  result = result.replace(/\{\{border-radius\}\}/g, design.components?.borderRadius || "8px");
  result = result.replace(/\{\{border-radius-sm\}\}/g, "4px");
  result = result.replace(/\{\{border-radius-lg\}\}/g, "12px");
  result = result.replace(/\{\{shadow-sm\}\}/g, design.components?.shadowScale?.[0] || "0 1px 2px rgba(0, 0, 0, 0.05)");
  result = result.replace(/\{\{shadow\}\}/g, design.components?.shadowScale?.[1] || "0 4px 6px rgba(0, 0, 0, 0.1)");
  result = result.replace(/\{\{shadow-lg\}\}/g, design.components?.shadowScale?.[2] || "0 10px 15px rgba(0, 0, 0, 0.15)");

  // Spacing replacements
  const unit = design.spacing?.unit || "8px";
  const unitValue = parseInt(unit);
  result = result.replace(/\{\{spacing-xs\}\}/g, `${unitValue * 0.5}px`);
  result = result.replace(/\{\{spacing-sm\}\}/g, `${unitValue}px`);
  result = result.replace(/\{\{spacing\}\}/g, `${unitValue * 2}px`);
  result = result.replace(/\{\{spacing-md\}\}/g, `${unitValue * 3}px`);
  result = result.replace(/\{\{spacing-lg\}\}/g, `${unitValue * 4}px`);
  result = result.replace(/\{\{spacing-xl\}\}/g, `${unitValue * 6}px`);

  return result;
}

/**
 * Pattern Library Database
 */
export const patternLibrary: Record<string, Pattern[]> = {
  login: [
    {
      id: "login-minimal",
      name: "Minimal Login",
      category: "login",
      style: "minimal",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: {{bg}};
      font-family: {{font-family}};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: {{spacing}};
    }
    .container {
      width: 100%;
      max-width: 400px;
    }
    .logo {
      width: 48px;
      height: 48px;
      background: {{primary}};
      border-radius: {{border-radius}};
      margin: 0 auto {{spacing-lg}};
    }
    .card {
      background: {{surface}};
      padding: {{spacing-lg}};
      border-radius: {{border-radius}};
      box-shadow: {{shadow}};
    }
    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      text-align: center;
      margin-bottom: {{spacing-lg}};
    }
    .form-group {
      margin-bottom: {{spacing-md}};
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: {{neutral}};
      margin-bottom: {{spacing-sm}};
    }
    input {
      width: 100%;
      padding: {{spacing-sm}} {{spacing}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 1rem;
      transition: all 0.2s;
    }
    input:focus {
      outline: none;
      border-color: {{primary}};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      margin-bottom: {{spacing-md}};
    }
    .checkbox-group input {
      width: auto;
      margin-right: {{spacing-sm}};
    }
    button {
      width: 100%;
      padding: {{spacing}} {{spacing-md}};
      background: {{primary}};
      color: white;
      border: none;
      border-radius: {{border-radius-sm}};
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: {{primary}};
      filter: brightness(1.1);
    }
    .links {
      text-align: center;
      margin-top: {{spacing-md}};
    }
    .links a {
      color: {{primary}};
      text-decoration: none;
      font-size: 0.875rem;
    }
    .links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="card">
      <h1>Connexion</h1>
      <form>
        <div class="form-group">
          <label>Adresse email</label>
          <input type="email" placeholder="vous@exemple.com" required>
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="••••••••" required>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="remember">
          <label for="remember">Se souvenir de moi</label>
        </div>
        <button type="submit">Se connecter</button>
      </form>
      <div class="links">
        <a href="#">Mot de passe oublié?</a>
        <span style="margin: 0 {{spacing-sm}};">•</span>
        <a href="#">Créer un compte</a>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "bg", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    },
    {
      id: "login-split",
      name: "Split Screen Login",
      category: "login",
      style: "modern",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: {{font-family}};
      display: flex;
      min-height: 100vh;
    }
    .brand-panel {
      flex: 1;
      background: linear-gradient(135deg, {{primary}}, {{accent}});
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: {{spacing-xl}};
      color: white;
    }
    .brand-logo {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: {{border-radius-lg}};
      margin-bottom: {{spacing-lg}};
    }
    .brand-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: {{spacing}};
    }
    .brand-subtitle {
      font-size: 1.25rem;
      opacity: 0.9;
      text-align: center;
    }
    .form-panel {
      flex: 1;
      background: {{surface}};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: {{spacing-xl}};
    }
    .form-container {
      width: 100%;
      max-width: 400px;
    }
    h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: {{spacing-sm}};
    }
    .subtitle {
      color: {{neutral}};
      margin-bottom: {{spacing-lg}};
    }
    .form-group {
      margin-bottom: {{spacing-md}};
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: {{neutral}};
      margin-bottom: {{spacing-sm}};
    }
    input {
      width: 100%;
      padding: {{spacing}} {{spacing}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 1rem;
      transition: all 0.2s;
    }
    input:focus {
      outline: none;
      border-color: {{primary}};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    button {
      width: 100%;
      padding: {{spacing}} {{spacing-md}};
      background: {{primary}};
      color: white;
      border: none;
      border-radius: {{border-radius-sm}};
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: {{spacing-md}};
    }
    button:hover {
      filter: brightness(1.1);
    }
    .divider {
      text-align: center;
      margin: {{spacing-lg}} 0;
      color: {{neutral-light}};
      position: relative;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #E5E7EB;
    }
    .divider span {
      background: {{surface}};
      padding: 0 {{spacing}};
      position: relative;
    }
    .social-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: {{spacing}};
    }
    .social-btn {
      padding: {{spacing}} {{spacing}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .social-btn:hover {
      background: {{bg}};
    }
    @media (max-width: 768px) {
      .brand-panel { display: none; }
    }
  </style>
</head>
<body>
  <div class="brand-panel">
    <div class="brand-logo"></div>
    <h1 class="brand-title">Welcome</h1>
    <p class="brand-subtitle">Votre plateforme de productivité moderne</p>
  </div>
  <div class="form-panel">
    <div class="form-container">
      <h2>Bon retour!</h2>
      <p class="subtitle">Connectez-vous à votre compte</p>
      <form>
        <div class="form-group">
          <label>Email professionnel</label>
          <input type="email" placeholder="vous@entreprise.com" required>
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="••••••••" required>
        </div>
        <button type="submit">Continuer</button>
      </form>
      <div class="divider">
        <span>ou</span>
      </div>
      <div class="social-buttons">
        <button class="social-btn">Google</button>
        <button class="social-btn">Microsoft</button>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "surface", "neutral", "font-family", "border-radius", "spacing"]
    },
    {
      id: "login-floating",
      name: "Floating Card Login",
      category: "login",
      style: "bold",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, {{primary}} 0%, {{accent}} 100%);
      font-family: {{font-family}};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: {{spacing}};
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255, 255, 255, 0.05) 10px,
        rgba(255, 255, 255, 0.05) 20px
      );
      animation: slide 20s linear infinite;
    }
    @keyframes slide {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .card {
      background: {{surface}};
      padding: {{spacing-xl}};
      border-radius: {{border-radius-lg}};
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 450px;
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, {{primary}}, {{accent}});
      border-radius: {{border-radius}};
      margin: 0 auto {{spacing-lg}};
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .logo::after {
      content: '⚡';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.5rem;
      color: white;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: {{spacing-sm}};
      background: linear-gradient(135deg, {{primary}}, {{accent}});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      text-align: center;
      color: {{neutral}};
      margin-bottom: {{spacing-xl}};
    }
    .form-group {
      margin-bottom: {{spacing-md}};
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: {{spacing}};
      top: 50%;
      transform: translateY(-50%);
      color: {{neutral-light}};
    }
    input {
      width: 100%;
      padding: {{spacing}} {{spacing}} {{spacing}} {{spacing-xl}};
      border: 2px solid #E5E7EB;
      border-radius: {{border-radius}};
      font-size: 1rem;
      transition: all 0.3s;
    }
    input:focus {
      outline: none;
      border-color: {{primary}};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      transform: translateY(-2px);
    }
    button {
      width: 100%;
      padding: {{spacing}} {{spacing-md}};
      background: linear-gradient(135deg, {{primary}}, {{accent}});
      color: white;
      border: none;
      border-radius: {{border-radius}};
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-top: {{spacing-lg}};
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
    .footer-links {
      display: flex;
      justify-content: space-between;
      margin-top: {{spacing-lg}};
      padding-top: {{spacing-lg}};
      border-top: 1px solid #E5E7EB;
    }
    .footer-links a {
      color: {{primary}};
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"></div>
    <h1>QuickDesigner</h1>
    <p class="subtitle">Créez des interfaces en un instant</p>
    <form>
      <div class="form-group">
        <span class="input-icon">📧</span>
        <input type="email" placeholder="Votre email" required>
      </div>
      <div class="form-group">
        <span class="input-icon">🔒</span>
        <input type="password" placeholder="Mot de passe" required>
      </div>
      <button type="submit">Accéder à mon espace</button>
    </form>
    <div class="footer-links">
      <a href="#">Créer un compte</a>
      <a href="#">Besoin d'aide?</a>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    }
  ],

  dashboard: [
    {
      id: "dashboard-analytics",
      name: "Analytics Dashboard",
      category: "dashboard",
      style: "modern",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau de bord</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: {{bg}};
      font-family: {{font-family}};
    }
    .header {
      background: {{surface}};
      padding: {{spacing}} {{spacing-lg}};
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: {{spacing}};
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: {{primary}};
    }
    .container {
      padding: {{spacing-lg}};
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: {{spacing-md}};
      margin-bottom: {{spacing-lg}};
    }
    .metric-card {
      background: {{surface}};
      padding: {{spacing-md}};
      border-radius: {{border-radius}};
      box-shadow: {{shadow-sm}};
      transition: all 0.3s;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: {{shadow}};
    }
    .metric-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, {{primary}}, {{accent}});
      border-radius: {{border-radius}};
      margin-bottom: {{spacing}};
      opacity: 0.1;
    }
    .metric-label {
      font-size: 0.875rem;
      color: {{neutral}};
      margin-bottom: {{spacing-xs}};
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: {{spacing-xs}};
    }
    .metric-change {
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: {{spacing-xs}};
    }
    .change-positive {
      color: {{accent}};
    }
    .change-negative {
      color: #EF4444;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: {{spacing-md}};
    }
    .chart-container {
      background: {{surface}};
      padding: {{spacing-md}};
      border-radius: {{border-radius}};
      box-shadow: {{shadow-sm}};
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: {{spacing-md}};
    }
    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }
    .chart-actions {
      display: flex;
      gap: {{spacing-sm}};
    }
    .btn-sm {
      padding: {{spacing-xs}} {{spacing}};
      background: {{bg}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 0.875rem;
      cursor: pointer;
    }
    .chart-area {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: {{bg}};
      border-radius: {{border-radius-sm}};
      position: relative;
    }
    .chart-placeholder {
      color: {{neutral}};
    }
    @media (max-width: 768px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tableau de bord</h1>
    <div class="user-menu">
      <button class="btn-sm">Aujourd'hui</button>
      <div class="avatar"></div>
    </div>
  </div>

  <div class="container">
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon"></div>
        <div class="metric-label">Revenus totaux</div>
        <div class="metric-value">€124,580</div>
        <div class="metric-change change-positive">
          <span>↑</span>
          <span>12.5% vs mois dernier</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: linear-gradient(135deg, {{accent}}, {{secondary}});"></div>
        <div class="metric-label">Utilisateurs actifs</div>
        <div class="metric-value">8,492</div>
        <div class="metric-change change-positive">
          <span>↑</span>
          <span>8.3% vs semaine dernière</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: linear-gradient(135deg, {{secondary}}, {{primary}});"></div>
        <div class="metric-label">Taux de conversion</div>
        <div class="metric-value">3.24%</div>
        <div class="metric-change change-negative">
          <span>↓</span>
          <span>0.5% vs hier</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"></div>
        <div class="metric-label">Commandes</div>
        <div class="metric-value">1,892</div>
        <div class="metric-change change-positive">
          <span>↑</span>
          <span>24 nouvelles aujourd'hui</span>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-container">
        <div class="chart-header">
          <h2 class="chart-title">Performance sur 30 jours</h2>
          <div class="chart-actions">
            <button class="btn-sm">Exporter</button>
            <button class="btn-sm">Filtrer</button>
          </div>
        </div>
        <div class="chart-area">
          <span class="chart-placeholder">📊 Graphique des performances</span>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-header">
          <h2 class="chart-title">Répartition</h2>
        </div>
        <div class="chart-area">
          <span class="chart-placeholder">🍰 Diagramme circulaire</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "secondary", "bg", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    },
    {
      id: "dashboard-cards",
      name: "Cards Dashboard",
      category: "dashboard",
      style: "minimal",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue d'ensemble</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: {{bg}};
      font-family: {{font-family}};
      padding: {{spacing-xl}};
    }
    .page-header {
      margin-bottom: {{spacing-xl}};
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 300;
      color: #111827;
      letter-spacing: -0.02em;
      margin-bottom: {{spacing-sm}};
    }
    .subtitle {
      color: {{neutral}};
      font-size: 1.125rem;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: {{spacing-lg}};
    }
    .card {
      background: {{surface}};
      padding: {{spacing-lg}};
      border-radius: {{border-radius}};
      transition: all 0.3s;
      cursor: pointer;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: {{shadow-lg}};
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: {{spacing-md}};
    }
    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: {{border-radius}};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .icon-primary {
      background: rgba(59, 130, 246, 0.1);
      color: {{primary}};
    }
    .icon-accent {
      background: rgba(16, 185, 129, 0.1);
      color: {{accent}};
    }
    .icon-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #F59E0B;
    }
    .card-badge {
      padding: {{spacing-xs}} {{spacing-sm}};
      background: {{bg}};
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: {{neutral}};
    }
    .card-title {
      font-size: 0.875rem;
      color: {{neutral}};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: {{spacing-sm}};
    }
    .card-value {
      font-size: 2.25rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: {{spacing}};
    }
    .card-description {
      color: {{neutral}};
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .card-footer {
      margin-top: {{spacing-md}};
      padding-top: {{spacing-md}};
      border-top: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .trend {
      display: flex;
      align-items: center;
      gap: {{spacing-xs}};
      font-size: 0.875rem;
    }
    .trend-up {
      color: {{accent}};
    }
    .trend-down {
      color: #EF4444;
    }
    .card-link {
      color: {{primary}};
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>Vue d'ensemble</h1>
    <p class="subtitle">Bienvenue dans votre espace de travail</p>
  </div>

  <div class="cards-grid">
    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-primary">📈</div>
        <span class="card-badge">Mensuel</span>
      </div>
      <div class="card-title">Chiffre d'affaires</div>
      <div class="card-value">€48,295</div>
      <div class="card-description">
        Performance exceptionnelle ce mois-ci avec une croissance soutenue
      </div>
      <div class="card-footer">
        <div class="trend trend-up">
          <span>↑</span>
          <span>12% vs mois dernier</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-accent">👥</div>
        <span class="card-badge">Temps réel</span>
      </div>
      <div class="card-title">Clients actifs</div>
      <div class="card-value">3,428</div>
      <div class="card-description">
        Base client en croissance constante avec un taux de rétention élevé
      </div>
      <div class="card-footer">
        <div class="trend trend-up">
          <span>↑</span>
          <span>5.2% cette semaine</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-warning">📦</div>
        <span class="card-badge">Aujourd'hui</span>
      </div>
      <div class="card-title">Commandes</div>
      <div class="card-value">892</div>
      <div class="card-description">
        Volume de commandes stable avec un panier moyen en hausse
      </div>
      <div class="card-footer">
        <div class="trend trend-down">
          <span>↓</span>
          <span>2.1% vs hier</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-primary">🎯</div>
        <span class="card-badge">Hebdomadaire</span>
      </div>
      <div class="card-title">Taux de conversion</div>
      <div class="card-value">4.8%</div>
      <div class="card-description">
        Optimisation continue du tunnel de conversion avec des résultats prometteurs
      </div>
      <div class="card-footer">
        <div class="trend trend-up">
          <span>↑</span>
          <span>0.3% d'amélioration</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-accent">💰</div>
        <span class="card-badge">Moyenne</span>
      </div>
      <div class="card-title">Panier moyen</div>
      <div class="card-value">€127</div>
      <div class="card-description">
        Augmentation significative grâce aux ventes croisées
      </div>
      <div class="card-footer">
        <div class="trend trend-up">
          <span>↑</span>
          <span>€12 d'augmentation</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon icon-warning">⚡</div>
        <span class="card-badge">Live</span>
      </div>
      <div class="card-title">Sessions actives</div>
      <div class="card-value">284</div>
      <div class="card-description">
        Utilisateurs actuellement connectés sur la plateforme
      </div>
      <div class="card-footer">
        <div class="trend trend-up">
          <span>●</span>
          <span>En direct</span>
        </div>
        <a href="#" class="card-link">Voir détails →</a>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "bg", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    },
    {
      id: "dashboard-table",
      name: "Table Dashboard",
      category: "dashboard",
      style: "professional",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gestion des données</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: {{bg}};
      font-family: {{font-family}};
    }
    .header {
      background: {{surface}};
      padding: {{spacing-md}} {{spacing-lg}};
      border-bottom: 1px solid #E5E7EB;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }
    .header-actions {
      display: flex;
      gap: {{spacing}};
    }
    .btn {
      padding: {{spacing-sm}} {{spacing-md}};
      border-radius: {{border-radius-sm}};
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: {{primary}};
      color: white;
      border: none;
    }
    .btn-primary:hover {
      filter: brightness(1.1);
    }
    .btn-secondary {
      background: {{surface}};
      color: {{neutral}};
      border: 1px solid #E5E7EB;
    }
    .container {
      padding: {{spacing-lg}};
    }
    .stats-bar {
      display: flex;
      gap: {{spacing-xl}};
      padding: {{spacing-md}};
      background: {{surface}};
      border-radius: {{border-radius}};
      margin-bottom: {{spacing-lg}};
    }
    .stat {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.75rem;
      color: {{neutral}};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: {{spacing-xs}};
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: {{primary}};
    }
    .filters {
      display: flex;
      gap: {{spacing}};
      margin-bottom: {{spacing-md}};
    }
    .filter-input {
      flex: 1;
      max-width: 300px;
      padding: {{spacing-sm}} {{spacing}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 0.875rem;
    }
    .filter-select {
      padding: {{spacing-sm}} {{spacing}};
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 0.875rem;
      background: {{surface}};
    }
    .table-container {
      background: {{surface}};
      border-radius: {{border-radius}};
      overflow: hidden;
      box-shadow: {{shadow-sm}};
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: {{bg}};
      padding: {{spacing}} {{spacing-md}};
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: {{neutral}};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #E5E7EB;
    }
    td {
      padding: {{spacing}} {{spacing-md}};
      border-bottom: 1px solid #F3F4F6;
    }
    tr:hover {
      background: {{bg}};
    }
    .status {
      display: inline-block;
      padding: {{spacing-xs}} {{spacing-sm}};
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-active {
      background: rgba(16, 185, 129, 0.1);
      color: {{accent}};
    }
    .status-pending {
      background: rgba(245, 158, 11, 0.1);
      color: #F59E0B;
    }
    .status-inactive {
      background: rgba(107, 114, 128, 0.1);
      color: {{neutral}};
    }
    .actions {
      display: flex;
      gap: {{spacing-sm}};
    }
    .action-btn {
      padding: {{spacing-xs}} {{spacing-sm}};
      background: transparent;
      border: 1px solid #E5E7EB;
      border-radius: {{border-radius-sm}};
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: {{bg}};
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: {{spacing-md}};
      background: {{bg}};
      border-top: 1px solid #E5E7EB;
    }
    .pagination-info {
      color: {{neutral}};
      font-size: 0.875rem;
    }
    .pagination-controls {
      display: flex;
      gap: {{spacing-xs}};
    }
    .page-btn {
      padding: {{spacing-xs}} {{spacing-sm}};
      border: 1px solid #E5E7EB;
      background: {{surface}};
      border-radius: {{border-radius-sm}};
      font-size: 0.875rem;
      cursor: pointer;
    }
    .page-btn.active {
      background: {{primary}};
      color: white;
      border-color: {{primary}};
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <h1>Gestion des données</h1>
      <div class="header-actions">
        <button class="btn btn-secondary">Importer</button>
        <button class="btn btn-primary">+ Nouveau</button>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-label">Total enregistrements</span>
        <span class="stat-value">1,234</span>
      </div>
      <div class="stat">
        <span class="stat-label">Actifs</span>
        <span class="stat-value">892</span>
      </div>
      <div class="stat">
        <span class="stat-label">En attente</span>
        <span class="stat-value">234</span>
      </div>
      <div class="stat">
        <span class="stat-label">Inactifs</span>
        <span class="stat-value">108</span>
      </div>
    </div>

    <div class="filters">
      <input type="text" class="filter-input" placeholder="Rechercher...">
      <select class="filter-select">
        <option>Tous les statuts</option>
        <option>Actif</option>
        <option>En attente</option>
        <option>Inactif</option>
      </select>
      <select class="filter-select">
        <option>Toutes les catégories</option>
        <option>Marketing</option>
        <option>Ventes</option>
        <option>Support</option>
      </select>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#001234</td>
            <td>Campagne de lancement produit</td>
            <td>Marketing</td>
            <td><span class="status status-active">Actif</span></td>
            <td>15/01/2024</td>
            <td>
              <div class="actions">
                <button class="action-btn">Voir</button>
                <button class="action-btn">Éditer</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>#001235</td>
            <td>Rapport trimestriel Q4</td>
            <td>Ventes</td>
            <td><span class="status status-pending">En attente</span></td>
            <td>14/01/2024</td>
            <td>
              <div class="actions">
                <button class="action-btn">Voir</button>
                <button class="action-btn">Éditer</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>#001236</td>
            <td>Analyse des retours clients</td>
            <td>Support</td>
            <td><span class="status status-active">Actif</span></td>
            <td>13/01/2024</td>
            <td>
              <div class="actions">
                <button class="action-btn">Voir</button>
                <button class="action-btn">Éditer</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>#001237</td>
            <td>Stratégie social media 2024</td>
            <td>Marketing</td>
            <td><span class="status status-inactive">Inactif</span></td>
            <td>12/01/2024</td>
            <td>
              <div class="actions">
                <button class="action-btn">Voir</button>
                <button class="action-btn">Éditer</button>
              </div>
            </td>
          </tr>
          <tr>
            <td>#001238</td>
            <td>Formation équipe commerciale</td>
            <td>Ventes</td>
            <td><span class="status status-active">Actif</span></td>
            <td>11/01/2024</td>
            <td>
              <div class="actions">
                <button class="action-btn">Voir</button>
                <button class="action-btn">Éditer</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span class="pagination-info">Affichage 1-5 sur 1,234 résultats</span>
        <div class="pagination-controls">
          <button class="page-btn">Précédent</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn">...</button>
          <button class="page-btn">247</button>
          <button class="page-btn">Suivant</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "bg", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    }
  ],

  pricing: [
    {
      id: "pricing-cards",
      name: "Pricing Cards",
      category: "pricing",
      style: "modern",
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tarifs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: {{bg}};
      font-family: {{font-family}};
      padding: {{spacing-xl}} {{spacing}};
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: {{spacing-xl}};
    }
    h1 {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: {{spacing}};
    }
    .subtitle {
      font-size: 1.25rem;
      color: {{neutral}};
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: {{spacing-lg}};
      margin-bottom: {{spacing-xl}};
    }
    .pricing-card {
      background: {{surface}};
      border-radius: {{border-radius}};
      padding: {{spacing-lg}};
      position: relative;
      transition: all 0.3s;
    }
    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: {{shadow-lg}};
    }
    .pricing-card.featured {
      border: 2px solid {{primary}};
    }
    .badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: {{primary}};
      color: white;
      padding: {{spacing-xs}} {{spacing-md}};
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .plan-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: {{spacing-sm}};
    }
    .plan-description {
      color: {{neutral}};
      margin-bottom: {{spacing-lg}};
    }
    .price {
      display: flex;
      align-items: baseline;
      margin-bottom: {{spacing-lg}};
    }
    .currency {
      font-size: 1.5rem;
      color: {{neutral}};
    }
    .amount {
      font-size: 3rem;
      font-weight: 700;
      color: {{primary}};
      margin: 0 {{spacing-xs}};
    }
    .period {
      color: {{neutral}};
    }
    .features {
      list-style: none;
      margin-bottom: {{spacing-lg}};
    }
    .features li {
      padding: {{spacing-sm}} 0;
      display: flex;
      align-items: center;
      gap: {{spacing-sm}};
      color: #4B5563;
    }
    .features li::before {
      content: '✓';
      color: {{accent}};
      font-weight: 700;
    }
    .cta-button {
      width: 100%;
      padding: {{spacing}} {{spacing-md}};
      background: {{primary}};
      color: white;
      border: none;
      border-radius: {{border-radius-sm}};
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cta-button:hover {
      filter: brightness(1.1);
    }
    .cta-button.secondary {
      background: transparent;
      color: {{primary}};
      border: 2px solid {{primary}};
    }
    .cta-button.secondary:hover {
      background: {{primary}};
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Choisissez votre plan</h1>
      <p class="subtitle">Des tarifs transparents pour tous les besoins</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h2 class="plan-name">Starter</h2>
        <p class="plan-description">Parfait pour débuter</p>
        <div class="price">
          <span class="currency">€</span>
          <span class="amount">9</span>
          <span class="period">/mois</span>
        </div>
        <ul class="features">
          <li>1 utilisateur</li>
          <li>10 projets maximum</li>
          <li>Support par email</li>
          <li>Statistiques de base</li>
          <li>Export PDF</li>
        </ul>
        <button class="cta-button secondary">Commencer l'essai</button>
      </div>

      <div class="pricing-card featured">
        <span class="badge">Populaire</span>
        <h2 class="plan-name">Professional</h2>
        <p class="plan-description">Pour les équipes en croissance</p>
        <div class="price">
          <span class="currency">€</span>
          <span class="amount">29</span>
          <span class="period">/mois</span>
        </div>
        <ul class="features">
          <li>5 utilisateurs</li>
          <li>Projets illimités</li>
          <li>Support prioritaire</li>
          <li>Analytics avancés</li>
          <li>Intégrations API</li>
          <li>Export tous formats</li>
          <li>Collaboration temps réel</li>
        </ul>
        <button class="cta-button">Commencer maintenant</button>
      </div>

      <div class="pricing-card">
        <h2 class="plan-name">Enterprise</h2>
        <p class="plan-description">Solutions sur mesure</p>
        <div class="price">
          <span class="currency">€</span>
          <span class="amount">99</span>
          <span class="period">/mois</span>
        </div>
        <ul class="features">
          <li>Utilisateurs illimités</li>
          <li>Tout du plan Pro</li>
          <li>Support dédié 24/7</li>
          <li>Formation personnalisée</li>
          <li>SSO et sécurité avancée</li>
          <li>SLA garanti</li>
          <li>Personnalisation complète</li>
        </ul>
        <button class="cta-button secondary">Contactez-nous</button>
      </div>
    </div>
  </div>
</body>
</html>`,
      variables: ["primary", "accent", "bg", "surface", "neutral", "font-family", "border-radius", "spacing", "shadow"]
    }
  ]
};

/**
 * Get patterns for a specific screen type
 */
export function getPatternsForScreen(screenType: string): Pattern[] {
  return patternLibrary[screenType] || patternLibrary.dashboard;
}

/**
 * Select pattern based on style preference
 */
export function selectPatternByStyle(
  patterns: Pattern[],
  style: string,
  index: number = 0
): Pattern {
  // Try to find pattern matching the style
  const stylePatterns = patterns.filter(p => p.style === style);
  if (stylePatterns.length > 0) {
    return stylePatterns[index % stylePatterns.length];
  }

  // Fallback to any pattern
  return patterns[index % patterns.length];
}

/**
 * Generate variation by modifying pattern
 */
export function generateVariation(
  basePattern: Pattern,
  variationType: "layout" | "density" | "style"
): Pattern {
  const variation = { ...basePattern };

  switch (variationType) {
    case "layout":
      // Modify layout structure
      variation.id = `${basePattern.id}-layout-variant`;
      variation.name = `${basePattern.name} (Layout Variant)`;
      break;
    case "density":
      // Modify spacing density
      variation.id = `${basePattern.id}-density-variant`;
      variation.name = `${basePattern.name} (Compact)`;
      break;
    case "style":
      // Modify visual style
      variation.id = `${basePattern.id}-style-variant`;
      variation.name = `${basePattern.name} (Alternative Style)`;
      break;
  }

  return variation;
}

/**
 * Validate that pattern HTML is well-formed
 */
export function validatePattern(html: string): boolean {
  // Basic validation
  return html.includes("<!DOCTYPE") &&
         html.includes("<html") &&
         html.includes("</html>");
}

export default patternLibrary;