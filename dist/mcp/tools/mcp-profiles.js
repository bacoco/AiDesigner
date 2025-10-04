const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');

/**
 * MCP Profiles Manager - Handles environment-specific configurations
 */
class McpProfiles {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.claudeDir = path.join(this.rootDir, '.claude');
    this.agilaiDir = path.join(this.rootDir, 'mcp');
    this.profilesMetaFile = path.join(this.claudeDir, '.mcp-profiles.json');
  }

  /**
   * Get config file path for a profile
   */
  getConfigPath(type, profile = null) {
    const baseDir = type === 'claude' ? this.claudeDir : this.agilaiDir;
    const baseName = type === 'claude' ? 'mcp-config' : 'agilai-config';

    if (!profile || profile === 'default') {
      return path.join(baseDir, `${baseName}.json`);
    }

    return path.join(baseDir, `${baseName}.${profile}.json`);
  }

  /**
   * Load profiles metadata
   */
  loadProfilesMeta() {
    if (!fs.existsSync(this.profilesMetaFile)) {
      return {
        activeProfile: 'default',
        profiles: {
          default: {
            name: 'default',
            description: 'Default configuration',
            created: new Date().toISOString(),
          },
        },
      };
    }

    try {
      return JSON.parse(fs.readFileSync(this.profilesMetaFile, 'utf8'));
    } catch {
      return {
        activeProfile: 'default',
        profiles: {},
      };
    }
  }

  /**
   * Save profiles metadata
   */
  saveProfilesMeta(meta) {
    if (!fs.existsSync(this.claudeDir)) {
      fs.mkdirSync(this.claudeDir, { recursive: true });
    }
    fs.writeFileSync(this.profilesMetaFile, JSON.stringify(meta, null, 2));
  }

  /**
   * Get active profile name
   */
  getActiveProfile() {
    // Check environment variable first
    if (process.env.MCP_PROFILE) {
      return process.env.MCP_PROFILE;
    }

    // Check NODE_ENV mapping
    if (process.env.NODE_ENV) {
      const envMap = {
        development: 'dev',
        staging: 'staging',
        production: 'prod',
      };
      if (envMap[process.env.NODE_ENV]) {
        return envMap[process.env.NODE_ENV];
      }
    }

    // Check git branch
    try {
      const branch = require('node:child_process')
        .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: 'pipe' })
        .trim();

      if (branch === 'main' || branch === 'master') {
        return 'prod';
      } else if (branch.startsWith('feature/') || branch.startsWith('dev/')) {
        return 'dev';
      }
    } catch {
      // Not a git repo or git not available
    }

    // Fallback to saved active profile
    const meta = this.loadProfilesMeta();
    return meta.activeProfile || 'default';
  }

  /**
   * Set active profile
   */
  setActiveProfile(profileName) {
    const meta = this.loadProfilesMeta();

    if (!meta.profiles[profileName]) {
      throw new Error(`Profile "${profileName}" does not exist`);
    }

    meta.activeProfile = profileName;
    this.saveProfilesMeta(meta);
  }

  /**
   * Create a new profile
   */
  createProfile(name, options = {}) {
    const meta = this.loadProfilesMeta();

    if (meta.profiles[name]) {
      throw new Error(`Profile "${name}" already exists`);
    }

    meta.profiles[name] = {
      name,
      description: options.description || `${name} environment`,
      inheritsFrom: options.inheritsFrom || 'default',
      created: new Date().toISOString(),
    };

    this.saveProfilesMeta(meta);

    // Create config files if copyFrom is specified
    if (options.copyFrom) {
      const sourceProfile = options.copyFrom;

      // Copy Claude config
      const claudeSource = this.getConfigPath('claude', sourceProfile);
      const claudeTarget = this.getConfigPath('claude', name);
      if (fs.existsSync(claudeSource)) {
        fs.copyFileSync(claudeSource, claudeTarget);
      }

      // Copy Agilai config
      const agilaiSource = this.getConfigPath('agilai', sourceProfile);
      const agilaiTarget = this.getConfigPath('agilai', name);
      if (fs.existsSync(agilaiSource)) {
        fs.copyFileSync(agilaiSource, agilaiTarget);
      }
    } else {
      // Create empty configs
      const emptyConfig = { mcpServers: {} };

      fs.writeFileSync(this.getConfigPath('claude', name), JSON.stringify(emptyConfig, null, 2));
      fs.writeFileSync(this.getConfigPath('agilai', name), JSON.stringify(emptyConfig, null, 2));
    }

    return meta.profiles[name];
  }

  /**
   * Delete a profile
   */
  deleteProfile(name) {
    if (name === 'default') {
      throw new Error('Cannot delete default profile');
    }

    const meta = this.loadProfilesMeta();

    if (!meta.profiles[name]) {
      throw new Error(`Profile "${name}" does not exist`);
    }

    // Delete config files
    const claudeConfig = this.getConfigPath('claude', name);
    const agilaiConfig = this.getConfigPath('agilai', name);

    if (fs.existsSync(claudeConfig)) {
      fs.unlinkSync(claudeConfig);
    }
    if (fs.existsSync(agilaiConfig)) {
      fs.unlinkSync(agilaiConfig);
    }

    // Remove from metadata
    delete meta.profiles[name];

    // If this was active, switch to default
    if (meta.activeProfile === name) {
      meta.activeProfile = 'default';
    }

    this.saveProfilesMeta(meta);
  }

  /**
   * List all profiles
   */
  listProfiles() {
    const meta = this.loadProfilesMeta();
    const activeProfile = this.getActiveProfile();

    return Object.values(meta.profiles).map((profile) => ({
      ...profile,
      active: profile.name === activeProfile,
      hasClaudeConfig: fs.existsSync(this.getConfigPath('claude', profile.name)),
      hasAgilaiConfig: fs.existsSync(this.getConfigPath('agilai', profile.name)),
    }));
  }

  /**
   * Load config with profile support and inheritance
   */
  loadConfig(type, profileName = null) {
    const profile = profileName || this.getActiveProfile();
    const configPath = this.getConfigPath(type, profile);

    // Load base config
    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        config = { mcpServers: {} };
      }
    }

    // Apply inheritance
    const meta = this.loadProfilesMeta();
    const profileMeta = meta.profiles[profile];

    if (profileMeta && profileMeta.inheritsFrom && profileMeta.inheritsFrom !== profile) {
      const parentConfig = this.loadConfig(type, profileMeta.inheritsFrom);

      // Merge parent config (parent values can be overridden by child)
      config.mcpServers = {
        ...parentConfig.mcpServers,
        ...config.mcpServers,
      };
    }

    return config;
  }

  /**
   * Save config for a specific profile
   */
  saveConfig(type, config, profileName = null) {
    const profile = profileName || this.getActiveProfile();
    const configPath = this.getConfigPath(type, profile);

    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Compare two profiles
   */
  diffProfiles(profile1, profile2, type = 'claude') {
    const config1 = this.loadConfig(type, profile1);
    const config2 = this.loadConfig(type, profile2);

    const servers1 = Object.keys(config1.mcpServers || {});
    const servers2 = Object.keys(config2.mcpServers || {});

    const onlyIn1 = servers1.filter((s) => !servers2.includes(s));
    const onlyIn2 = servers2.filter((s) => !servers1.includes(s));
    const inBoth = servers1.filter((s) => servers2.includes(s));

    const different = inBoth.filter((serverName) => {
      return (
        JSON.stringify(config1.mcpServers[serverName]) !==
        JSON.stringify(config2.mcpServers[serverName])
      );
    });

    return {
      onlyIn1,
      onlyIn2,
      different,
      identical: inBoth.filter((s) => !different.includes(s)),
    };
  }

  /**
   * Merge profile into another
   */
  mergeProfiles(sourceProfile, targetProfile, strategy = 'prefer-target') {
    const sourceConfig = this.loadConfig('claude', sourceProfile);
    const targetConfig = this.loadConfig('claude', targetProfile);

    let merged = { ...targetConfig };

    switch (strategy) {
      case 'prefer-source': {
        merged.mcpServers = {
          ...targetConfig.mcpServers,
          ...sourceConfig.mcpServers,
        };

        break;
      }
      case 'prefer-target': {
        merged.mcpServers = {
          ...sourceConfig.mcpServers,
          ...targetConfig.mcpServers,
        };

        break;
      }
      case 'combine': {
        // Keep both, rename conflicts
        merged.mcpServers = { ...targetConfig.mcpServers };
        for (const [key, value] of Object.entries(sourceConfig.mcpServers)) {
          if (merged.mcpServers[key]) {
            merged.mcpServers[`${key}-${sourceProfile}`] = value;
          } else {
            merged.mcpServers[key] = value;
          }
        }

        break;
      }
      // No default
    }

    return merged;
  }

  /**
   * Export profile to portable format
   */
  exportProfile(profileName, outputPath) {
    const meta = this.loadProfilesMeta();
    const profile = meta.profiles[profileName];

    if (!profile) {
      throw new Error(`Profile "${profileName}" not found`);
    }

    const exportData = {
      profile,
      claudeConfig: this.loadConfig('claude', profileName),
      agilaiConfig: this.loadConfig('agilai', profileName),
      exported: new Date().toISOString(),
      version: '1.0.0',
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  }

  /**
   * Import profile from portable format
   */
  importProfile(inputPath, newName = null) {
    const exportData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const profileName = newName || exportData.profile.name;

    // Create profile
    const meta = this.loadProfilesMeta();
    meta.profiles[profileName] = {
      ...exportData.profile,
      name: profileName,
      imported: new Date().toISOString(),
    };
    this.saveProfilesMeta(meta);

    // Save configs
    this.saveConfig('claude', exportData.claudeConfig, profileName);
    this.saveConfig('agilai', exportData.agilaiConfig, profileName);

    return profileName;
  }

  /**
   * Get environment-specific recommendations
   */
  getEnvironmentRecommendations(profileName) {
    const recommendations = [];

    switch (profileName) {
      case 'dev':
      case 'development': {
        recommendations.push(
          {
            type: 'setting',
            message: 'Consider enabling debug logs for development',
            action: 'Add DEBUG=* to environment variables',
          },
          {
            type: 'security',
            message: 'Development credentials should be separate from production',
            action: 'Use different API keys for dev environment',
          },
        );

        break;
      }
      case 'prod':
      case 'production': {
        recommendations.push(
          {
            type: 'security',
            message: 'Production should use secure credential storage',
            action: 'Run: npm run mcp:secure',
          },
          {
            type: 'monitoring',
            message: 'Enable monitoring for production MCP servers',
            action: 'Configure health checks and alerts',
          },
        );

        break;
      }
      case 'staging': {
        recommendations.push({
          type: 'testing',
          message: 'Staging should mirror production configuration',
          action: 'Regularly sync staging with prod profile',
        });

        break;
      }
      // No default
    }

    return recommendations;
  }
}

module.exports = McpProfiles;
