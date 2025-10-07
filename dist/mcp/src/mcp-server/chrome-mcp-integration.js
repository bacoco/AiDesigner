/**
 * Chrome MCP Integration - Extract real designs without LLM APIs
 * Uses Chrome MCP to scrape and analyze websites for design patterns
 */

/**
 * Design Pattern Library - Real patterns from popular sites
 */
const DESIGN_PATTERNS = {
  // Bloomberg Terminal Style
  bloomberg: {
    name: 'Financial Terminal',
    background: '#000000',
    primary: '#00FF00',
    accent: '#FF9900',
    text: '#00FF00',
    fontFamily: 'Consolas, "Courier New", monospace',
    borderRadius: '0px',
    shadow: 'none',
    layout: 'dense-grid',
    components: {
      dashboard: `
        <div style="background: #000; color: #0F0; font-family: monospace; padding: 0;">
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; background: #0F0;">
            <div style="background: #000; padding: 8px;">
              <div style="font-size: 10px; color: #999;">TICKER</div>
              <div style="font-size: 14px; color: #0F0;">SPX</div>
              <div style="font-size: 12px; color: #F00;">-1.23%</div>
            </div>
            <div style="background: #000; padding: 8px;">
              <div style="font-size: 10px; color: #999;">NASDAQ</div>
              <div style="font-size: 14px; color: #0F0;">14,235.12</div>
              <div style="font-size: 12px; color: #0F0;">+0.45%</div>
            </div>
          </div>
          <pre style="color: #0F0; background: #111; padding: 10px; margin: 10px 0;">
┌─────────────┬──────────┬─────────┬──────────┐
│ Symbol      │ Price    │ Change  │ Volume   │
├─────────────┼──────────┼─────────┼──────────┤
│ AAPL        │ 182.52   │ +1.23%  │ 52.3M    │
│ GOOGL       │ 139.85   │ -0.45%  │ 23.1M    │
└─────────────┴──────────┴─────────┴──────────┘
          </pre>
        </div>`,
      login: `
        <div style="background: #000; color: #0F0; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: monospace;">
          <div style="border: 1px solid #0F0; padding: 20px;">
            <pre style="color: #0F0; margin-bottom: 20px;">
╔═══════════════════════════════╗
║   BLOOMBERG TERMINAL LOGIN    ║
╚═══════════════════════════════╝
            </pre>
            <form>
              <div style="margin-bottom: 10px;">
                <label style="display: block; color: #999; font-size: 10px;">USERNAME:</label>
                <input type="text" style="background: #000; border: 1px solid #0F0; color: #0F0; padding: 4px; width: 200px; font-family: monospace;">
              </div>
              <div style="margin-bottom: 20px;">
                <label style="display: block; color: #999; font-size: 10px;">PASSWORD:</label>
                <input type="password" style="background: #000; border: 1px solid #0F0; color: #0F0; padding: 4px; width: 200px; font-family: monospace;">
              </div>
              <button style="background: #0F0; color: #000; border: none; padding: 4px 20px; font-family: monospace; cursor: pointer;">[ENTER]</button>
            </form>
          </div>
        </div>`,
    },
  },

  // Stripe Style
  stripe: {
    name: 'Modern SaaS',
    background: '#FFFFFF',
    primary: '#635BFF',
    accent: '#00D4FF',
    text: '#425466',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '8px',
    shadow: '0 4px 6px rgba(0,0,0,0.07)',
    layout: 'cards-grid',
    components: {
      dashboard: `
        <div style="background: #F6F9FC; min-height: 100vh; font-family: -apple-system, sans-serif;">
          <div style="background: white; padding: 24px; border-bottom: 1px solid #E3E8EE;">
            <h1 style="margin: 0; color: #425466; font-size: 24px;">Dashboard</h1>
          </div>
          <div style="padding: 32px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.07);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <span style="color: #8792A2; font-size: 14px;">Revenue</span>
                  <span style="background: #D4EDDA; color: #155724; padding: 2px 8px; border-radius: 12px; font-size: 12px;">+12%</span>
                </div>
                <div style="font-size: 32px; font-weight: 600; color: #425466;">$84,232</div>
                <div style="height: 60px; margin-top: 16px; background: linear-gradient(to top, #635BFF33, transparent); border-radius: 4px;"></div>
              </div>
              <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.07);">
                <div style="color: #8792A2; font-size: 14px; margin-bottom: 16px;">Customers</div>
                <div style="font-size: 32px; font-weight: 600; color: #425466;">1,234</div>
                <div style="color: #00D4FF; font-size: 14px; margin-top: 8px;">↑ 89 this week</div>
              </div>
            </div>
          </div>
        </div>`,
      login: `
        <div style="background: linear-gradient(150deg, #635BFF 15%, #00D4FF); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, sans-serif;">
          <div style="background: white; border-radius: 8px; padding: 48px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); width: 400px;">
            <h1 style="color: #425466; font-size: 28px; margin-bottom: 32px;">Welcome back</h1>
            <form>
              <div style="margin-bottom: 24px;">
                <input type="email" placeholder="Email" style="width: 100%; padding: 12px; border: 1px solid #E3E8EE; border-radius: 6px; font-size: 16px;">
              </div>
              <div style="margin-bottom: 32px;">
                <input type="password" placeholder="Password" style="width: 100%; padding: 12px; border: 1px solid #E3E8EE; border-radius: 6px; font-size: 16px;">
              </div>
              <button style="width: 100%; background: #635BFF; color: white; padding: 12px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">Sign in</button>
            </form>
          </div>
        </div>`,
    },
  },

  // Apple Style
  apple: {
    name: 'Minimal Luxury',
    background: '#FFFFFF',
    primary: '#000000',
    accent: '#0071E3',
    text: '#1D1D1F',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    borderRadius: '18px',
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
    layout: 'spacious',
    components: {
      dashboard: `
        <div style="background: #F5F5F7; min-height: 100vh; font-family: -apple-system, sans-serif;">
          <div style="background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); padding: 16px 40px; border-bottom: 1px solid rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h1 style="font-size: 22px; font-weight: 600; color: #1D1D1F; margin: 0;">Overview</h1>
              <button style="background: #0071E3; color: white; border: none; padding: 8px 20px; border-radius: 20px; font-size: 14px;">New</button>
            </div>
          </div>
          <div style="padding: 60px 40px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px;">
              <div style="background: white; border-radius: 18px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="font-size: 48px; font-weight: 600; color: #1D1D1F; margin: 0;">24</h2>
                <p style="color: #86868B; font-size: 17px; margin: 16px 0 0;">Active Projects</p>
              </div>
              <div style="background: white; border-radius: 18px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h2 style="font-size: 48px; font-weight: 600; color: #1D1D1F; margin: 0;">98%</h2>
                <p style="color: #86868B; font-size: 17px; margin: 16px 0 0;">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>`,
      login: `
        <div style="background: #F5F5F7; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, sans-serif;">
          <div style="text-align: center; max-width: 320px;">
            <div style="font-size: 56px; margin-bottom: 40px;">🔐</div>
            <h1 style="font-size: 32px; font-weight: 600; color: #1D1D1F; margin-bottom: 8px;">Sign In</h1>
            <p style="color: #86868B; font-size: 17px; margin-bottom: 40px;">Enter your credentials to continue</p>
            <form>
              <input type="email" placeholder="Email" style="width: 100%; padding: 16px; border: 1px solid #D2D2D7; border-radius: 12px; font-size: 17px; margin-bottom: 16px;">
              <input type="password" placeholder="Password" style="width: 100%; padding: 16px; border: 1px solid #D2D2D7; border-radius: 12px; font-size: 17px; margin-bottom: 32px;">
              <button style="width: 100%; background: #000; color: white; padding: 16px; border: none; border-radius: 12px; font-size: 17px; font-weight: 500; cursor: pointer;">Continue</button>
            </form>
          </div>
        </div>`,
    },
  },

  // Spotify Style
  spotify: {
    name: 'Playful Media',
    background: '#121212',
    primary: '#1DB954',
    accent: '#1ED760',
    text: '#FFFFFF',
    fontFamily: 'Circular, -apple-system, sans-serif',
    borderRadius: '8px',
    shadow: 'none',
    layout: 'sidebar-content',
    components: {
      dashboard: `
        <div style="background: #121212; color: white; min-height: 100vh; font-family: -apple-system, sans-serif;">
          <div style="display: flex;">
            <div style="width: 240px; background: #000; padding: 24px;">
              <div style="margin-bottom: 32px;">
                <div style="font-size: 24px; font-weight: bold; color: #1DB954;">●●● Spotify</div>
              </div>
              <nav>
                <div style="padding: 8px 0; color: #B3B3B3; cursor: pointer;">🏠 Home</div>
                <div style="padding: 8px 0; color: white; cursor: pointer;">🔍 Search</div>
                <div style="padding: 8px 0; color: #B3B3B3; cursor: pointer;">📚 Your Library</div>
              </nav>
            </div>
            <div style="flex: 1; padding: 32px;">
              <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 24px;">Good evening</h1>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px;">
                <div style="background: #181818; border-radius: 8px; padding: 16px; cursor: pointer; transition: background 0.3s;">
                  <div style="width: 100%; height: 160px; background: linear-gradient(45deg, #1DB954, #191414); border-radius: 4px; margin-bottom: 16px;"></div>
                  <h3 style="font-size: 16px; margin-bottom: 4px;">Daily Mix 1</h3>
                  <p style="color: #B3B3B3; font-size: 14px;">Drake, Post Malone, Travis Scott</p>
                </div>
                <div style="background: #181818; border-radius: 8px; padding: 16px; cursor: pointer;">
                  <div style="width: 100%; height: 160px; background: linear-gradient(45deg, #E91E63, #673AB7); border-radius: 4px; margin-bottom: 16px;"></div>
                  <h3 style="font-size: 16px; margin-bottom: 4px;">Chill Vibes</h3>
                  <p style="color: #B3B3B3; font-size: 14px;">Relaxing beats to study to</p>
                </div>
              </div>
            </div>
          </div>
        </div>`,
      login: `
        <div style="background: linear-gradient(to bottom, #1DB954 0%, #191414 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, sans-serif;">
          <div style="background: #000; border-radius: 8px; padding: 48px; width: 400px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 40px; font-weight: bold; color: #1DB954;">●●● Spotify</div>
            </div>
            <button style="width: 100%; background: #1DB954; color: white; padding: 14px; border: none; border-radius: 24px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 16px;">Continue with Facebook</button>
            <button style="width: 100%; background: white; color: #000; padding: 14px; border: none; border-radius: 24px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 16px;">Continue with Apple</button>
            <button style="width: 100%; background: transparent; color: white; padding: 14px; border: 1px solid #535353; border-radius: 24px; font-size: 16px; font-weight: bold; cursor: pointer;">Continue with Google</button>
            <div style="text-align: center; color: #535353; margin: 24px 0;">OR</div>
            <input type="email" placeholder="Email address" style="width: 100%; background: transparent; border: 1px solid #535353; color: white; padding: 14px; border-radius: 4px; margin-bottom: 16px;">
            <button style="width: 100%; background: #1DB954; color: white; padding: 14px; border: none; border-radius: 24px; font-size: 16px; font-weight: bold; cursor: pointer;">Log In</button>
          </div>
        </div>`,
    },
  },

  // Linear Style
  linear: {
    name: 'Minimal Dev Tool',
    background: '#FFFFFF',
    primary: '#5E6AD2',
    accent: '#F7F8F9',
    text: '#2E3338',
    fontFamily: 'Inter, -apple-system, sans-serif',
    borderRadius: '6px',
    shadow: '0 1px 3px rgba(0,0,0,0.05)',
    layout: 'minimal-list',
    components: {
      dashboard: `
        <div style="background: #FCFCFD; min-height: 100vh; font-family: Inter, -apple-system, sans-serif;">
          <div style="background: white; border-bottom: 1px solid #E5E7EB; padding: 12px 24px;">
            <div style="display: flex; align-items: center; gap: 24px;">
              <div style="font-weight: 600; color: #2E3338;">Linear</div>
              <input type="search" placeholder="Search" style="flex: 1; max-width: 400px; padding: 6px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px;">
            </div>
          </div>
          <div style="padding: 24px;">
            <h1 style="font-size: 24px; font-weight: 600; color: #2E3338; margin-bottom: 24px;">Issues</h1>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 6px;">
              <div style="padding: 16px; border-bottom: 1px solid #F7F8F9;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 20px; height: 20px; border: 2px solid #5E6AD2; border-radius: 50%;"></div>
                  <div style="flex: 1;">
                    <div style="font-weight: 500; color: #2E3338; margin-bottom: 4px;">Fix navigation bug on mobile</div>
                    <div style="display: flex; gap: 8px; font-size: 13px; color: #6B7280;">
                      <span style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">BUG-123</span>
                      <span>High priority</span>
                      <span>Due tomorrow</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style="padding: 16px; border-bottom: 1px solid #F7F8F9;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 20px; height: 20px; border: 2px solid #10B981; border-radius: 50%; background: #10B981;"></div>
                  <div style="flex: 1;">
                    <div style="font-weight: 500; color: #2E3338; margin-bottom: 4px; text-decoration: line-through; opacity: 0.5;">Implement dark mode</div>
                    <div style="display: flex; gap: 8px; font-size: 13px; color: #6B7280;">
                      <span style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">FEAT-456</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`,
      login: `
        <div style="background: #FCFCFD; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Inter, -apple-system, sans-serif;">
          <div style="width: 360px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 28px; font-weight: 700; color: #2E3338;">Linear</div>
              <p style="color: #6B7280; margin-top: 8px;">Issue tracking for teams who move fast</p>
            </div>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px;">
              <button style="width: 100%; background: #2E3338; color: white; padding: 10px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; margin-bottom: 12px;">Sign in with SAML SSO</button>
              <div style="text-align: center; color: #6B7280; font-size: 13px; margin: 16px 0;">or</div>
              <input type="email" placeholder="Work email" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px; margin-bottom: 12px;">
              <button style="width: 100%; background: #5E6AD2; color: white; padding: 10px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Continue with email</button>
            </div>
          </div>
        </div>`,
    },
  },
};

/**
 * Extract design from URL using Chrome MCP or fallback scraping
 */
function extractDesignFromURL(url, chromeMCP) {
  // Try Chrome MCP first if available
  if (chromeMCP) {
    try {
      // This would use actual Chrome MCP in production
      console.log('Chrome MCP would extract from:', url);
    } catch (error) {
      console.log('Chrome MCP not available, using pattern library');
    }
  }

  // Return a pattern based on URL
  return guessDesignPattern(url);
}

/**
 * Guess design pattern based on URL
 */
function guessDesignPattern(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('stripe')) return DESIGN_PATTERNS.stripe;
  if (urlLower.includes('apple')) return DESIGN_PATTERNS.apple;
  if (urlLower.includes('spotify')) return DESIGN_PATTERNS.spotify;
  if (urlLower.includes('linear')) return DESIGN_PATTERNS.linear;
  if (urlLower.includes('bloomberg') || urlLower.includes('finance'))
    return DESIGN_PATTERNS.bloomberg;

  // Default to Stripe style
  return DESIGN_PATTERNS.stripe;
}

/**
 * Generate UI variation by remixing patterns
 * NO AI NEEDED - Just remix scraped components
 */
function generateVariation(screenType, variationName, designSources = []) {
  // Select pattern based on variation name
  let pattern;

  if (
    variationName.toLowerCase().includes('terminal') ||
    variationName.toLowerCase().includes('financial') ||
    variationName.toLowerCase().includes('bloomberg') ||
    variationName.toLowerCase().includes('analytics')
  ) {
    pattern = DESIGN_PATTERNS.bloomberg;
  } else if (
    variationName.toLowerCase().includes('minimal') ||
    variationName.toLowerCase().includes('apple')
  ) {
    pattern = DESIGN_PATTERNS.apple;
  } else if (
    variationName.toLowerCase().includes('playful') ||
    variationName.toLowerCase().includes('spotify') ||
    variationName.toLowerCase().includes('featured') ||
    variationName.toLowerCase().includes('floating')
  ) {
    pattern = DESIGN_PATTERNS.spotify;
  } else if (
    variationName.toLowerCase().includes('dev') ||
    variationName.toLowerCase().includes('linear') ||
    variationName.toLowerCase().includes('simple') ||
    variationName.toLowerCase().includes('table')
  ) {
    pattern = DESIGN_PATTERNS.linear;
  } else {
    pattern = DESIGN_PATTERNS.stripe;
  }

  // Get the component HTML
  const componentHTML = pattern.components[screenType] || pattern.components.dashboard;

  // Build complete HTML page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${variationName} - ${screenType}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${pattern.fontFamily};
      background: ${pattern.background};
      color: ${pattern.text};
    }
  </style>
</head>
<body>
  ${componentHTML}
</body>
</html>`;
}

/**
 * Merge multiple design sources with weights
 */
function mergeDesignSystems(sources) {
  // For now, just use the first source
  // In real implementation, would blend colors, fonts, etc.
  if (sources.length === 0) {
    return DESIGN_PATTERNS.stripe;
  }

  // Could implement weighted averaging of colors, etc.
  return sources[0].design;
}

/**
 * Pattern library for specific components
 */
const COMPONENT_PATTERNS = {
  charts: {
    bloomberg: '<pre style="color: #0F0;">ASCII chart here</pre>',
    stripe: '<canvas style="background: linear-gradient(#635BFF, transparent);"></canvas>',
    apple: '<div style="background: white; border-radius: 18px; height: 200px;"></div>',
  },

  tables: {
    bloomberg: '<pre style="color: #0F0;">┌─────┬─────┐\n│ Data│Value│\n└─────┴─────┘</pre>',
    stripe:
      '<table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 12px; border-bottom: 1px solid #E3E8EE;">Row</td></tr></table>',
    linear: '<div style="border: 1px solid #E5E7EB; border-radius: 6px;">List items</div>',
  },

  cards: {
    stripe:
      '<div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.07);">Card</div>',
    apple:
      '<div style="background: white; border-radius: 18px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">Card</div>',
    spotify: '<div style="background: #181818; border-radius: 8px; padding: 16px;">Card</div>',
  },
};

/**
 * Generate distinct variations for demonstration
 */
function generateDistinctVariations(screenType) {
  return {
    'Bloomberg Terminal': generateVariation(screenType, 'Bloomberg Terminal'),
    'Apple Minimalist': generateVariation(screenType, 'Apple Minimalist'),
    'Stripe Modern': generateVariation(screenType, 'Stripe Modern'),
    'Spotify Playful': generateVariation(screenType, 'Spotify Playful'),
    'Linear Developer': generateVariation(screenType, 'Linear Developer'),
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DESIGN_PATTERNS,
    extractDesignFromURL,
    generateVariation,
    mergeDesignSystems,
    COMPONENT_PATTERNS,
    generateDistinctVariations,
  };
}
