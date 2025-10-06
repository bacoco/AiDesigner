const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const chalk = require('chalk');

/**
 * MCP Registry - Fetches and manages MCP server registry for aidesigner
 */
class McpRegistry {
  constructor() {
    this.cacheDir = path.join(require('node:os').homedir(), '.aidesigner', 'cache');
    this.cacheFile = path.join(this.cacheDir, 'mcp-registry.json');
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

    // Built-in MCP server catalog
    this.builtInServers = [
      {
        id: 'filesystem',
        name: '@modelcontextprotocol/server-filesystem',
        category: 'File System',
        description: 'Access and manipulate local file system',
        installType: 'npx',
        tags: ['filesystem', 'files', 'io'],
      },
      {
        id: 'chrome-devtools',
        name: 'chrome-devtools-mcp',
        category: 'Browser DevTools',
        description: 'Interact with the Chrome DevTools Protocol (CDP) over STDIO',
        installType: 'npx',
        tags: ['chrome', 'cdp', 'devtools', 'browser'],
        // If you run Chrome with --remote-debugging-port, you can set a WS endpoint
        // Common env var used by several MCP browser servers
        envVars: ['BROWSER_WS_ENDPOINT'],
      },
      {
        id: 'github',
        name: '@modelcontextprotocol/server-github',
        category: 'Development',
        description: 'Interact with GitHub repositories, issues, and pull requests',
        installType: 'npx',
        tags: ['github', 'git', 'development', 'vcs'],
        envVars: ['GITHUB_TOKEN'],
      },
      {
        id: 'sqlite',
        name: '@modelcontextprotocol/server-sqlite',
        category: 'Database',
        description: 'Query and manage SQLite databases',
        installType: 'npx',
        tags: ['database', 'sql', 'sqlite'],
      },
      {
        id: 'postgres',
        name: '@modelcontextprotocol/server-postgres',
        category: 'Database',
        description: 'Connect to and query PostgreSQL databases',
        installType: 'npx',
        tags: ['database', 'sql', 'postgres', 'postgresql'],
      },
      {
        id: 'puppeteer',
        name: '@modelcontextprotocol/server-puppeteer',
        category: 'Browser Automation',
        description: 'Control and automate Chrome/Chromium browsers',
        installType: 'npx',
        tags: ['browser', 'automation', 'testing', 'scraping'],
      },
      {
        id: 'brave-search',
        name: '@modelcontextprotocol/server-brave-search',
        category: 'Search',
        description: 'Search the web using Brave Search API',
        installType: 'npx',
        tags: ['search', 'web', 'api'],
        envVars: ['BRAVE_API_KEY'],
      },
      {
        id: 'google-maps',
        name: '@modelcontextprotocol/server-google-maps',
        category: 'Geolocation',
        description: 'Access Google Maps API for geocoding and directions',
        installType: 'npx',
        tags: ['maps', 'geolocation', 'navigation'],
        envVars: ['GOOGLE_MAPS_API_KEY'],
      },
      {
        id: 'slack',
        name: '@modelcontextprotocol/server-slack',
        category: 'Communication',
        description: 'Send messages and interact with Slack workspaces',
        installType: 'npx',
        tags: ['slack', 'communication', 'messaging'],
        envVars: ['SLACK_BOT_TOKEN'],
      },
      {
        id: 'memory',
        name: '@modelcontextprotocol/server-memory',
        category: 'State Management',
        description: 'Persistent key-value memory store for agents',
        installType: 'npx',
        tags: ['memory', 'storage', 'state', 'persistence'],
      },
      {
        id: 'fetch',
        name: '@modelcontextprotocol/server-fetch',
        category: 'HTTP',
        description: 'Make HTTP requests to external APIs',
        installType: 'npx',
        tags: ['http', 'api', 'fetch', 'rest'],
      },
      {
        id: 'playwright',
        name: '@playwright/mcp-server',
        category: 'Browser Automation',
        description: 'Browser automation and testing with Playwright',
        installType: 'npx',
        tags: ['browser', 'automation', 'testing', 'playwright'],
      },
      {
        id: 'shadcn-ui',
        name: '@jpisnice/shadcn-ui-mcp-server',
        category: 'UI Components',
        description: 'Explore shadcn/ui components, demos, and metadata',
        installType: 'npx',
        tags: ['ui', 'components', 'shadcn'],
      },
      {
        id: 'azure',
        name: '@microsoft/azure-mcp-server',
        category: 'Cloud',
        description: 'Access Azure Storage, Cosmos DB, and Azure CLI',
        installType: 'npx',
        tags: ['azure', 'cloud', 'microsoft', 'storage'],
        envVars: ['AZURE_SUBSCRIPTION_ID'],
      },
      {
        id: 'atlassian',
        name: '@atlassian/mcp-server',
        category: 'Project Management',
        description: 'Interact with Jira work items and Confluence pages',
        installType: 'npx',
        tags: ['jira', 'confluence', 'atlassian', 'project-management'],
        envVars: ['ATLASSIAN_API_TOKEN'],
      },
      {
        id: 'time',
        name: '@modelcontextprotocol/server-time',
        category: 'Utility',
        description: 'Time and timezone conversion capabilities',
        installType: 'npx',
        tags: ['time', 'timezone', 'utility'],
      },
      {
        id: 'everything',
        name: '@modelcontextprotocol/server-everything',
        category: 'File Search',
        description: 'Ultra-fast file search using Everything search engine (Windows)',
        installType: 'npx',
        tags: ['search', 'files', 'windows'],
      },
    ];
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load cached registry data
   */
  loadCache() {
    if (!fs.existsSync(this.cacheFile)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      const age = Date.now() - data.timestamp;

      if (age > this.cacheTTL) {
        return null; // Cache expired
      }

      return data.servers;
    } catch {
      return null;
    }
  }

  /**
   * Save registry data to cache
   */
  saveCache(servers) {
    this.ensureCacheDir();
    const data = {
      timestamp: Date.now(),
      servers,
    };
    fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
  }

  /**
   * Fetch MCP servers from GitHub registry repo
   */
  async fetchFromGitHub() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'raw.githubusercontent.com',
        path: '/modelcontextprotocol/servers/main/README.md',
        method: 'GET',
        headers: {
          'User-Agent': 'aidesigner-MCP-Manager',
        },
      };

      https
        .get(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            // Parse README for server information
            const servers = this.parseGitHubReadme(data);
            resolve(servers);
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse GitHub README to extract server information
   */
  parseGitHubReadme(readme) {
    const servers = [];
    const lines = readme.split('\n');

    // Simple parsing - look for server entries
    // This is a basic implementation and would need refinement based on actual README structure
    let currentCategory = 'Uncategorized';

    for (const line_ of lines) {
      const line = line_.trim();

      // Detect category headers
      if (line.startsWith('## ') && !line.includes('Table of Contents')) {
        currentCategory = line.replace('## ', '').trim();
        continue;
      }

      // Look for npm package patterns
      const npmMatch = line.match(/@[\w-]+\/[\w-]+/);
      if (npmMatch) {
        const packageName = npmMatch[0];
        const description = line
          .replaceAll(/[*#[\]()]/g, '')
          .replace(packageName, '')
          .trim();

        if (packageName.startsWith('@modelcontextprotocol/') && description) {
          servers.push({
            id: packageName.replace('@modelcontextprotocol/server-', ''),
            name: packageName,
            category: currentCategory,
            description,
            installType: 'npx',
            tags: [currentCategory.toLowerCase()],
            source: 'github',
          });
        }
      }
    }

    return servers;
  }

  /**
   * Get all available MCP servers
   */
  async getServers(forceRefresh = false) {
    // Try cache first
    if (!forceRefresh) {
      const cached = this.loadCache();
      if (cached) {
        return cached;
      }
    }

    // Fetch from GitHub
    let githubServers = [];
    try {
      githubServers = await this.fetchFromGitHub();
    } catch {
      console.error(chalk.yellow('Warning: Could not fetch from GitHub registry'));
    }

    // Merge built-in catalog with fetched servers
    const allServers = [...this.builtInServers];

    // Add GitHub servers that aren't in built-in list
    for (const server of githubServers) {
      if (!allServers.some((s) => s.name === server.name)) {
        allServers.push(server);
      }
    }

    // Cache the results
    this.saveCache(allServers);

    return allServers;
  }

  /**
   * Search for MCP servers
   */
  async search(query, options = {}) {
    const servers = await this.getServers();
    const lowerQuery = query.toLowerCase();

    let results = servers.filter((server) => {
      // Search in name, description, category, and tags
      const searchFields = [
        server.name,
        server.description,
        server.category,
        ...(server.tags || []),
      ]
        .join(' ')
        .toLowerCase();

      return searchFields.includes(lowerQuery);
    });

    // Filter by category if specified
    if (options.category) {
      results = results.filter(
        (server) => server.category.toLowerCase() === options.category.toLowerCase(),
      );
    }

    return results;
  }

  /**
   * Get server details by ID or name
   */
  async getServer(idOrName) {
    const servers = await this.getServers();
    return servers.find((s) => s.id === idOrName || s.name === idOrName);
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const servers = await this.getServers();
    const categories = new Set(servers.map((s) => s.category));
    return [...categories].sort();
  }

  /**
   * Suggest MCP servers based on project context
   */
  async suggestForProject(projectPath) {
    const suggestions = [];
    const servers = await this.getServers();

    try {
      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // React/Next.js projects
        if (deps.react || deps.next) {
          suggestions.push({
            server: servers.find((s) => s.id === 'puppeteer'),
            reason: 'Browser automation for React/Next.js testing',
          });
        }

        // Database projects
        if (deps.pg || deps.postgres) {
          suggestions.push({
            server: servers.find((s) => s.id === 'postgres'),
            reason: 'PostgreSQL database detected',
          });
        }

        if (deps['better-sqlite3'] || deps.sqlite3) {
          suggestions.push({
            server: servers.find((s) => s.id === 'sqlite'),
            reason: 'SQLite database detected',
          });
        }

        // Playwright projects
        if (deps.playwright || deps['@playwright/test']) {
          suggestions.push({
            server: servers.find((s) => s.id === 'playwright'),
            reason: 'Playwright testing framework detected',
          });
        }
      }

      // Check for .git directory
      if (fs.existsSync(path.join(projectPath, '.git'))) {
        suggestions.push({
          server: servers.find((s) => s.id === 'github'),
          reason: 'Git repository detected',
        });
      }

      // Check for Docker
      if (fs.existsSync(path.join(projectPath, 'Dockerfile'))) {
        suggestions.push({
          server: servers.find((s) => s.id === 'azure'),
          reason: 'Docker detected - consider cloud deployment',
        });
      }
    } catch {
      // Ignore errors during project analysis
    }

    return suggestions.filter((s) => s.server); // Remove null entries
  }

  /**
   * Clear cache
   */
  clearCache() {
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
  }
}

module.exports = McpRegistry;
