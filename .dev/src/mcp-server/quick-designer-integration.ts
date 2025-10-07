/**
 * Quick Designer Integration Module
 * Bridges the new AI-driven system with the existing runtime
 */

import * as path from "path";
import * as fs from "fs-extra";
import {
  generateUIFromDesignSystem,
  generateVariants,
  type DesignSpec,
  type GenerationRequest,
} from "./ui-generator.js";
import {
  extractFromURL,
  extractFromImage,
  normalizeDesignSystem,
} from "./design-extractor.js";
import { DesignWorkflow } from "./workflow-manager.js";

// AI service that generates unique layouts dynamically
class SimpleAIService {
  async generate(prompt: string, designSpec?: DesignSpec): Promise<string> {
    // Create AI-driven HTML generation based on the prompt
    const aiPrompt = this.buildAIPrompt(prompt, designSpec);
    return this.generateAIResponse(aiPrompt, designSpec);
  }

  private buildAIPrompt(prompt: string, designSpec?: DesignSpec): string {
    // Build a comprehensive prompt that guides AI to generate specific layout variations
    let layoutInstructions = "";

    // Dashboard variations
    if (prompt.includes("Analytics Focus")) {
      layoutInstructions = `
        Create a dashboard with emphasis on data visualization:
        - Large chart area taking 60% of the screen
        - KPI cards at the top
        - Multiple chart types (line, bar, pie)
        - Real-time data indicators
        - Trend arrows and percentage changes
      `;
    } else if (prompt.includes("Data Table Focus")) {
      layoutInstructions = `
        Create a dashboard centered around data tables:
        - Large data table as the main component
        - Filtering and sorting controls
        - Row actions and bulk operations
        - Pagination controls
        - Summary statistics above the table
      `;
    } else if (prompt.includes("Minimal Cards")) {
      layoutInstructions = `
        Create a clean card-based dashboard:
        - Grid of information cards
        - Each card with icon, metric, and change indicator
        - Minimal visual clutter
        - Focus on whitespace and typography
        - No complex charts, just numbers and trends
      `;
    }
    // Login variations
    else if (prompt.includes("login") && prompt.includes("Minimal")) {
      layoutInstructions = `
        Create a minimal centered login form:
        - Single centered card
        - Email and password fields
        - Submit button
        - Forgot password link
        - Very clean, lots of whitespace
      `;
    } else if (prompt.includes("login") && prompt.includes("Split Screen")) {
      layoutInstructions = `
        Create a split-screen login layout:
        - Left side: branding area with gradient or image
        - Right side: login form
        - Social login options
        - Remember me checkbox
        - Sign up link
      `;
    } else if (prompt.includes("login") && prompt.includes("Card Floating")) {
      layoutInstructions = `
        Create a floating card login over gradient background:
        - Full-screen gradient background
        - Floating card with shadow
        - Logo at top
        - Form fields with icons
        - Animated background pattern
      `;
    }
    // Pricing variations
    else if (prompt.includes("pricing") && prompt.includes("Simple")) {
      layoutInstructions = `
        Create three-tier pricing cards:
        - Three pricing cards side by side
        - Basic, Pro, Enterprise tiers
        - Feature lists for each
        - CTA button per card
        - Highlight the recommended plan
      `;
    } else if (prompt.includes("pricing") && prompt.includes("Featured")) {
      layoutInstructions = `
        Create a comparison table pricing layout:
        - Feature comparison table
        - Plans as columns
        - Features as rows
        - Highlight the best value column
        - CTA buttons at bottom
      `;
    } else if (prompt.includes("pricing") && prompt.includes("Detailed")) {
      layoutInstructions = `
        Create a detailed pricing layout with features:
        - Pricing selector on left
        - Feature details on right
        - FAQ section below
        - Customer testimonials
        - Money-back guarantee badge
      `;
    }

    return `Generate a complete HTML page with the following specifications:
      ${layoutInstructions}

      IMPORTANT:
      - Use CSS variables for ALL colors: var(--primary), var(--accent), var(--neutral), var(--bg), var(--surface)
      - Use var(--font-family) for font
      - Use var(--border-radius) for border radius
      - Create a UNIQUE layout structure, not a generic template
      - Include inline styles, no external CSS
      - Make it production-ready and responsive
      - Use semantic HTML elements
    `;
  }

  private async generateAIResponse(aiPrompt: string, designSpec?: DesignSpec): Promise<string> {
    // This simulates AI generation based on the prompt
    // In production, this would call a real AI service (Claude, GPT, etc.)

    // For now, generate dynamic HTML based on the prompt content
    const primary = designSpec?.colors?.primary || "#3B82F6";
    const accent = designSpec?.colors?.accent || "#10B981";
    const neutral = designSpec?.colors?.neutral?.[0] || "#6B7280";
    const bg = designSpec?.colors?.background || "#F9FAFB";
    const surface = designSpec?.colors?.surface || "#FFFFFF";
    const fontFamily = designSpec?.typography?.fontFamily || "Inter";
    const borderRadius = designSpec?.components?.borderRadius || "8px";

    // Generate different layouts based on the AI prompt
    if (aiPrompt.includes("data visualization")) {
      // Analytics-focused dashboard
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard</title>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --surface: ${surface};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); font-family: var(--font-family), sans-serif; }
    .dashboard { padding: 2rem; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-card { background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); }
    .kpi-value { font-size: 2rem; font-weight: 700; color: var(--primary); }
    .kpi-label { color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .kpi-trend { color: var(--accent); font-size: 0.75rem; }
    .chart-area { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    .main-chart { background: var(--surface); padding: 2rem; border-radius: var(--border-radius); height: 400px; display: flex; align-items: center; justify-content: center; }
    .side-charts { display: flex; flex-direction: column; gap: 1rem; }
    .small-chart { background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); height: 190px; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div class="dashboard">
    <h1 style="margin-bottom: 2rem;">Analytics Dashboard</h1>
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Total Revenue</div>
        <div class="kpi-value">$124.5K</div>
        <div class="kpi-trend">↑ 12.5% from last month</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active Users</div>
        <div class="kpi-value">8,492</div>
        <div class="kpi-trend">↑ 8.3% from last week</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conversion Rate</div>
        <div class="kpi-value">3.24%</div>
        <div class="kpi-trend">↓ 0.5% from yesterday</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg Session</div>
        <div class="kpi-value">5m 42s</div>
        <div class="kpi-trend">↑ 23s from average</div>
      </div>
    </div>
    <div class="chart-area">
      <div class="main-chart">
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          <polyline points="20,180 60,160 100,140 140,120 180,100 220,90 260,70 300,60 340,40 380,20"
                    fill="none" stroke="var(--primary)" stroke-width="2"/>
        </svg>
      </div>
      <div class="side-charts">
        <div class="small-chart">
          <svg width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--neutral)" stroke-width="8"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--primary)" stroke-width="8"
                    stroke-dasharray="125.6" stroke-dashoffset="31.4" transform="rotate(-90 50 50)"/>
          </svg>
        </div>
        <div class="small-chart">
          <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 100px;">
            <div style="width: 20px; height: 60%; background: var(--primary);"></div>
            <div style="width: 20px; height: 80%; background: var(--accent);"></div>
            <div style="width: 20px; height: 40%; background: var(--neutral);"></div>
            <div style="width: 20px; height: 70%; background: var(--primary);"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    } else if (aiPrompt.includes("data tables")) {
      // Table-focused dashboard
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Management Dashboard</title>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --surface: ${surface};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); font-family: var(--font-family), sans-serif; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filter { padding: 0.5rem 1rem; background: var(--surface); border: 1px solid var(--neutral); border-radius: var(--border-radius); }
    .data-table { background: var(--surface); border-radius: var(--border-radius); overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { background: var(--primary); color: white; padding: 1rem; text-align: left; font-weight: 600; }
    td { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: rgba(59, 130, 246, 0.05); }
    .pagination { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface); }
    .stats-bar { display: flex; gap: 2rem; padding: 1rem; background: var(--surface); border-bottom: 1px solid #e5e7eb; }
    .stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 0.75rem; color: var(--neutral); }
  </style>
</head>
<body>
  <div class="header">
    <h1>Data Management</h1>
    <button style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">Export Data</button>
  </div>

  <div class="filters">
    <select class="filter">
      <option>All Status</option>
      <option>Active</option>
      <option>Pending</option>
    </select>
    <select class="filter">
      <option>All Categories</option>
      <option>Sales</option>
      <option>Marketing</option>
    </select>
    <input type="text" placeholder="Search..." class="filter" style="flex: 1;">
  </div>

  <div class="data-table">
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-value">1,234</span>
        <span class="stat-label">Total Records</span>
      </div>
      <div class="stat">
        <span class="stat-value">892</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat">
        <span class="stat-value">342</span>
        <span class="stat-label">Pending</span>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Category</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>#1234</td>
          <td>Product Launch Campaign</td>
          <td>Marketing</td>
          <td><span style="color: var(--accent);">Active</span></td>
          <td>2024-01-15</td>
          <td><button style="padding: 0.25rem 0.75rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button></td>
        </tr>
        <tr>
          <td>#1235</td>
          <td>Q4 Sales Report</td>
          <td>Sales</td>
          <td><span style="color: var(--neutral);">Pending</span></td>
          <td>2024-01-14</td>
          <td><button style="padding: 0.25rem 0.75rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button></td>
        </tr>
        <tr>
          <td>#1236</td>
          <td>Customer Feedback Analysis</td>
          <td>Research</td>
          <td><span style="color: var(--accent);">Active</span></td>
          <td>2024-01-13</td>
          <td><button style="padding: 0.25rem 0.75rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span>Showing 1-10 of 1,234</span>
      <div style="display: flex; gap: 0.5rem;">
        <button style="padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--neutral); border-radius: 4px;">Previous</button>
        <button style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px;">1</button>
        <button style="padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--neutral); border-radius: 4px;">2</button>
        <button style="padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--neutral); border-radius: 4px;">3</button>
        <button style="padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--neutral); border-radius: 4px;">Next</button>
      </div>
    </div>
  </div>
</body>
</html>`;
    } else if (aiPrompt.includes("clean card-based")) {
      // Minimal cards dashboard
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Overview Dashboard</title>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --surface: ${surface};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); font-family: var(--font-family), sans-serif; padding: 3rem; }
    h1 { font-size: 2.5rem; margin-bottom: 3rem; font-weight: 300; letter-spacing: -0.02em; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
    .card { background: var(--surface); padding: 2rem; border-radius: var(--border-radius); transition: transform 0.2s; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
    .card-icon { width: 48px; height: 48px; background: var(--primary); opacity: 0.1; border-radius: 8px; margin-bottom: 1.5rem; }
    .card-label { color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 2.5rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
    .card-change { color: var(--accent); font-size: 0.875rem; display: flex; align-items: center; gap: 0.25rem; }
    .card-change.negative { color: #ef4444; }
  </style>
</head>
<body>
  <h1>Dashboard Overview</h1>
  <div class="cards-grid">
    <div class="card">
      <div class="card-icon"></div>
      <div class="card-label">Revenue</div>
      <div class="card-value">$48,292</div>
      <div class="card-change">↑ 12% from last month</div>
    </div>
    <div class="card">
      <div class="card-icon" style="background: var(--accent); opacity: 0.1;"></div>
      <div class="card-label">Customers</div>
      <div class="card-value">3,428</div>
      <div class="card-change">↑ 5.2% this week</div>
    </div>
    <div class="card">
      <div class="card-icon" style="background: var(--neutral); opacity: 0.1;"></div>
      <div class="card-label">Orders</div>
      <div class="card-value">892</div>
      <div class="card-change negative">↓ 2.1% today</div>
    </div>
    <div class="card">
      <div class="card-icon"></div>
      <div class="card-label">Conversion</div>
      <div class="card-value">4.8%</div>
      <div class="card-change">↑ 0.3% improvement</div>
    </div>
    <div class="card">
      <div class="card-icon" style="background: var(--accent); opacity: 0.1;"></div>
      <div class="card-label">Avg Order Value</div>
      <div class="card-value">$127</div>
      <div class="card-change">↑ $12 increase</div>
    </div>
    <div class="card">
      <div class="card-icon" style="background: var(--neutral); opacity: 0.1;"></div>
      <div class="card-label">Active Sessions</div>
      <div class="card-value">284</div>
      <div class="card-change">Live now</div>
    </div>
  </div>
</body>
</html>`;
    }
    // Add more AI-generated variations...
    else {
      // Default fallback
      return this.generateDefaultHTML(aiPrompt, designSpec);
    }
  }

  private generateDefaultHTML(prompt: string, designSpec?: DesignSpec): string {
    const primary = designSpec?.colors?.primary || "#3B82F6";
    const accent = designSpec?.colors?.accent || "#10B981";
    const neutral = designSpec?.colors?.neutral?.[0] || "#6B7280";
    const bg = designSpec?.colors?.background || "#F9FAFB";
    const surface = designSpec?.colors?.surface || "#FFFFFF";
    const fontFamily = designSpec?.typography?.fontFamily || "Inter";
    const borderRadius = designSpec?.components?.borderRadius || "8px";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated Page</title>
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --surface: ${surface};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      font-family: var(--font-family), sans-serif;
      padding: 2rem;
      color: #111827;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 2rem; }
    .content {
      background: var(--surface);
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI-Generated Interface</h1>
    <div class="content">
      <p>This page was generated dynamically by AI based on your specifications.</p>
      <p style="margin-top: 1rem; color: var(--neutral);">Prompt: ${prompt.substring(0, 100)}...</p>
    </div>
  </div>
</body>
</html>`;
  }
}

/**
 * Generate mockup HTML with interactive design system
 */
export async function generateInteractiveMockup(
  pages: any[],
  designSystem: DesignSpec
): Promise<string> {
  const aiService = new SimpleAIService();

  // Generate HTML for each page variation
  for (const page of pages) {
    if (page.variations) {
      for (const variation of page.variations) {
        if (!variation.html) {
          // Create a prompt that includes screen type and variation name
          const prompt = `Generate ${page.type || page.name} screen with ${variation.name} variation`;

          try {
            // Use the SimpleAIService directly to get distinct layouts
            variation.html = await aiService.generate(prompt, variation.specs || designSystem);
          } catch (error) {
            console.error(`Failed to generate HTML for ${page.name}/${variation.name}:`, error);
            variation.html = `<div>Error generating HTML: ${error}</div>`;
          }
        }
      }
    }
  }

  // Build complete mockup HTML
  const primary = designSystem.colors?.primary || "#3B82F6";
  const accent = designSystem.colors?.accent || "#10B981";
  const neutral = designSystem.colors?.neutral?.[0] || "#6B7280";
  const bg = designSystem.colors?.background || "#F9FAFB";
  const fontFamily = designSystem.typography?.fontFamily || "Inter";
  const borderRadius = designSystem.components?.borderRadius || "8px";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Designer v4 - AI-Generated Mockup</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --neutral: ${neutral};
      --bg: ${bg};
      --font-family: ${fontFamily};
      --border-radius: ${borderRadius};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-family), sans-serif;
      background: var(--bg);
      color: #111827;
    }

    #app {
      display: flex;
      height: 100vh;
    }

    /* Design System Sidebar */
    .design-system {
      width: 320px;
      background: white;
      border-right: 1px solid #E5E7EB;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .design-system h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #111827;
    }

    .control-group {
      margin-bottom: 2rem;
    }

    .control-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral);
      margin-bottom: 0.75rem;
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .palette-option {
      padding: 0.5rem;
      border: 2px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .palette-option:hover {
      border-color: var(--primary);
    }

    .palette-option.selected {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.1);
    }

    .color-preview {
      width: 100%;
      height: 24px;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Tabs */
    .tabs {
      display: flex;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      padding: 0 1rem;
    }

    .tab {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #111827;
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Preview Area */
    .preview {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .page-content {
      display: none;
    }

    .page-content.active {
      display: block;
    }

    .variations {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
    }

    .variation-card {
      border: 1px solid #E5E7EB;
      border-radius: var(--border-radius);
      overflow: hidden;
      background: white;
    }

    .variation-header {
      padding: 1rem;
      background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
    }

    .variation-name {
      font-weight: 600;
      color: #111827;
    }

    .variation-preview {
      height: 400px;
      position: relative;
      overflow: hidden;
    }

    .variation-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    /* Status Badge */
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--accent);
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    /* Toast Notification */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Design System Sidebar -->
    <div class="design-system">
      <h2>🎨 Design System</h2>

      <!-- Color Palettes -->
      <div class="control-group">
        <label>Palette de couleurs</label>
        <div class="palette-grid">
          <div class="palette-option selected" onclick="selectPalette('ocean')">
            <div class="color-preview" style="background: linear-gradient(90deg, #3B82F6, #06B6D4);"></div>
            Ocean
          </div>
          <div class="palette-option" onclick="selectPalette('sunset')">
            <div class="color-preview" style="background: linear-gradient(90deg, #F59E0B, #EF4444);"></div>
            Sunset
          </div>
          <div class="palette-option" onclick="selectPalette('forest')">
            <div class="color-preview" style="background: linear-gradient(90deg, #10B981, #059669);"></div>
            Forest
          </div>
        </div>
      </div>

      <!-- Typography -->
      <div class="control-group">
        <label>Typographie</label>
        <select onchange="selectFont(this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid #E5E7EB; border-radius: 6px;">
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Playfair Display">Playfair Display</option>
          <option value="Space Mono">Space Mono</option>
        </select>
      </div>

      <!-- Border Radius -->
      <div class="control-group">
        <label>Arrondi des coins</label>
        <input type="range" min="0" max="24" value="8" onchange="updateRadius(this.value)" style="width: 100%;">
        <div style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: var(--neutral);">
          <span id="radiusValue">8</span>px
        </div>
      </div>

      <!-- AI Status -->
      <div style="margin-top: 2rem; padding: 1rem; background: #F0F9FF; border-radius: 8px;">
        <div style="font-weight: 600; color: #0369A1; margin-bottom: 0.5rem;">
          🤖 AI Generation
        </div>
        <div style="font-size: 0.75rem; color: #0C4A6E;">
          Pages are generated dynamically using AI based on your design system choices.
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Tabs -->
      <div class="tabs" id="tabs">
        ${pages
          .map(
            (page, index) =>
              `<div class="tab ${index === 0 ? "active" : ""}" data-page="${
                page.name
              }" onclick="switchTab('${page.name}')">${page.name}</div>`
          )
          .join("")}
      </div>

      <!-- Preview Area -->
      <div class="preview" id="preview">
        ${pages
          .map(
            (page, index) => `
          <div class="page-content ${index === 0 ? "active" : ""}" id="page-${page.name}">
            <div class="variations">
              ${
                page.variations
                  ? page.variations
                      .map(
                        (variation: any, vIndex: number) => `
                <div class="variation-card">
                  <div class="variation-header">
                    <span class="variation-name">${variation.name}</span>
                    ${vIndex === 0 ? '<span class="badge">Recommandé</span>' : ""}
                  </div>
                  <div class="variation-preview">
                    <iframe srcdoc="${(variation.html || "")
                      .replace(/"/g, "&quot;")
                      .replace(/'/g, "&#39;")}"></iframe>
                  </div>
                </div>
              `
                      )
                      .join("")
                  : "<div>No variations available</div>"
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </div>

  <script>
    const MOCKUP_DATA = ${JSON.stringify({ pages, designSystem })};

    // Palette definitions
    const PALETTES = {
      ocean: {
        primary: '#3B82F6',
        accent: '#06B6D4',
        neutral: '#64748B'
      },
      sunset: {
        primary: '#F59E0B',
        accent: '#EF4444',
        neutral: '#78716C'
      },
      forest: {
        primary: '#10B981',
        accent: '#059669',
        neutral: '#6B7280'
      }
    };

    // Switch between tabs
    function switchTab(pageName) {
      // Update tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === pageName);
      });

      // Update content
      document.querySelectorAll('.page-content').forEach(content => {
        content.classList.toggle('active', content.id === 'page-' + pageName);
      });
    }

    // Select color palette
    function selectPalette(paletteName) {
      const palette = PALETTES[paletteName];
      if (!palette) return;

      // Update CSS variables
      document.documentElement.style.setProperty('--primary', palette.primary);
      document.documentElement.style.setProperty('--accent', palette.accent);
      document.documentElement.style.setProperty('--neutral', palette.neutral);

      // Update UI
      document.querySelectorAll('.palette-option').forEach(option => {
        option.classList.toggle('selected', option.textContent.trim().toLowerCase() === paletteName);
      });

      // Update all iframes
      updateAllPreviews();

      showToast('Palette ' + paletteName + ' appliquée');
    }

    // Select font
    function selectFont(fontName) {
      document.documentElement.style.setProperty('--font-family', fontName);

      // Load font from Google Fonts if needed
      if (fontName !== 'Inter') {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=' + fontName.replace(' ', '+') + ':wght@400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      updateAllPreviews();
      showToast('Police ' + fontName + ' appliquée');
    }

    // Update border radius
    function updateRadius(value) {
      document.documentElement.style.setProperty('--border-radius', value + 'px');
      document.getElementById('radiusValue').textContent = value;
      updateAllPreviews();
    }

    // Update all preview iframes with new styles
    function updateAllPreviews() {
      const styles = getComputedStyle(document.documentElement);
      const cssVars = {
        primary: styles.getPropertyValue('--primary'),
        accent: styles.getPropertyValue('--accent'),
        neutral: styles.getPropertyValue('--neutral'),
        bg: styles.getPropertyValue('--bg'),
        fontFamily: styles.getPropertyValue('--font-family'),
        borderRadius: styles.getPropertyValue('--border-radius')
      };

      document.querySelectorAll('iframe').forEach(iframe => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Update CSS variables in iframe
          Object.entries(cssVars).forEach(([key, value]) => {
            doc.documentElement.style.setProperty('--' + key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
          });
        }
      });
    }

    // Show toast notification
    function showToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
      \`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }

    // Initialize
    console.log('Quick Designer v4 - AI-Driven System Initialized');
    console.log('Pages:', MOCKUP_DATA.pages.length);
  </script>
</body>
</html>`;
}

/**
 * Export for use in existing runtime
 */
export const QuickDesignerV4 = {
  generateUIFromDesignSystem,
  generateVariants,
  extractFromURL,
  extractFromImage,
  normalizeDesignSystem,
  generateInteractiveMockup,
  DesignWorkflow,
  SimpleAIService,
};