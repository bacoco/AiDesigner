const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const McpRegistry = require('./mcp-registry');
const McpProfiles = require('./mcp-profiles');
const McpSecurity = require('./mcp-security');

class McpManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.profile = options.profile || null;
    this.registry = new McpRegistry();
    this.profiles = new McpProfiles({ rootDir: this.rootDir });
    this.security = new McpSecurity();

    // Backward compatibility - will be deprecated
    this.claudeConfigPath = path.join(this.rootDir, '.claude', 'mcp-config.json');
    this.aidesignerConfigPath = path.join(this.rootDir, 'mcp', 'aidesigner-config.json');
    this.bmadConfigPath = path.join(this.rootDir, 'mcp', 'bmad-config.json'); // Legacy fallback
  }

  /**
   * Get current active profile
   */
  getCurrentProfile() {
    return this.profile || this.profiles.getActiveProfile();
  }

  /**
   * Load configuration from .claude/mcp-config.json (with profile support)
   */
  loadClaudeConfig(profileName = null) {
    const profile = profileName || this.getCurrentProfile();
    return this.profiles.loadConfig('claude', profile);
  }

  /**
   * Load configuration from mcp/aidesigner-config.json (with profile support)
   */
  loadaidesignerConfig(profileName = null) {
    const profile = profileName || this.getCurrentProfile();
    return this.profiles.loadConfig('aidesigner', profile);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use loadaidesignerConfig() instead
   */
  loadBmadConfig(profileName = null) {
    return this.loadaidesignerConfig(profileName);
  }

  /**
   * Save configuration to .claude/mcp-config.json (with profile support)
   */
  saveClaudeConfig(config, profileName = null) {
    const profile = profileName || this.getCurrentProfile();
    this.profiles.saveConfig('claude', config, profile);
  }

  /**
   * Save configuration to mcp/aidesigner-config.json (with profile support)
   */
  saveaidesignerConfig(config, profileName = null) {
    const profile = profileName || this.getCurrentProfile();
    this.profiles.saveConfig('aidesigner', config, profile);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use saveaidesignerConfig() instead
   */
  saveBmadConfig(config, profileName = null) {
    return this.saveaidesignerConfig(config, profileName);
  }

  /**
   * Resolve vault references in config (for secure credentials)
   */
  async resolveConfig(config) {
    const profile = this.getCurrentProfile();
    return await this.security.resolveVaultReferences(config, profile);
  }

  /**
   * List all configured MCP servers
   */
  async list() {
    console.log(chalk.bold('\n📡 MCP Servers Configuration\n'));

    const claudeConfig = this.loadClaudeConfig();
    const aidesignerConfig = this.loadaidesignerConfig();

    // Combine both configs for complete view
    const allServers = new Map();

    // Add Claude config servers
    for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
      allServers.set(name, { ...config, source: 'claude' });
    }

    // Add aidesigner config servers
    for (const [name, config] of Object.entries(aidesignerConfig.mcpServers || {})) {
      if (allServers.has(name)) {
        allServers.get(name).source = 'both';
      } else {
        allServers.set(name, { ...config, source: 'aidesigner' });
      }
    }

    if (allServers.size === 0) {
      console.log(chalk.yellow('No MCP servers configured.'));
      console.log(chalk.dim('Run `aidesigner mcp add` to configure your first server.\n'));
      return;
    }

    // Display servers
    for (const [name, config] of allServers) {
      const disabled = config.disabled ? chalk.red(' [DISABLED]') : chalk.green(' [ACTIVE]');
      const source = chalk.dim(`(${config.source})`);

      console.log(`${chalk.cyan('●')} ${chalk.bold(name)}${disabled} ${source}`);
      console.log(`  ${chalk.dim('Command:')} ${config.command}`);

      if (config.args && config.args.length > 0) {
        console.log(`  ${chalk.dim('Args:')} ${config.args.join(' ')}`);
      }

      if (config.env) {
        console.log(`  ${chalk.dim('Environment:')} ${Object.keys(config.env).length} variable(s)`);
      }

      console.log('');
    }

    console.log(chalk.dim(`Total: ${allServers.size} server(s) configured\n`));
  }

  /**
   * Test if an MCP server is healthy
   */
  async testServer(name, config) {
    return new Promise((resolve) => {
      const args = config.args || [];
      const env = { ...process.env, ...config.env };

      const child = spawn(config.command, args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, 5000);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);

        if (timedOut) {
          resolve({
            name,
            status: 'timeout',
            message: 'Server did not respond within 5 seconds',
          });
          return;
        }

        if (code === 0 || stdout.includes('capabilities') || stderr.includes('MCP')) {
          resolve({
            name,
            status: 'healthy',
            message: 'Server is responding',
          });
        } else {
          resolve({
            name,
            status: 'error',
            message: `Exited with code ${code}`,
            stderr: stderr.slice(0, 200),
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          name,
          status: 'error',
          message: error.message,
        });
      });
    });
  }

  /**
   * Run health checks on all MCP servers
   */
  async doctor() {
    console.log(chalk.bold('\n🏥 MCP Health Check\n'));

    const claudeConfig = this.loadClaudeConfig();
    const aidesignerConfig = this.loadaidesignerConfig();

    // Check if config files exist
    console.log(chalk.bold('Configuration Files:'));
    console.log(
      `  ${fs.existsSync(this.claudeConfigPath) ? chalk.green('✓') : chalk.red('✗')} ${this.claudeConfigPath}`,
    );
    console.log(
      `  ${fs.existsSync(this.aidesignerConfigPath) ? chalk.green('✓') : chalk.red('✗')} ${this.aidesignerConfigPath}`,
    );
    console.log('');

    // Combine all servers
    const allServers = new Map();
    for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
      allServers.set(name, config);
    }
    for (const [name, config] of Object.entries(aidesignerConfig.mcpServers || {})) {
      if (!allServers.has(name)) {
        allServers.set(name, config);
      }
    }

    if (allServers.size === 0) {
      console.log(chalk.yellow('No MCP servers to check.'));
      return;
    }

    console.log(chalk.bold('Server Health:'));

    const results = [];
    for (const [name, config] of allServers) {
      if (config.disabled) {
        console.log(`  ${chalk.yellow('⊘')} ${name} ${chalk.dim('(disabled)')}`);
        continue;
      }

      process.stdout.write(`  ${chalk.cyan('⋯')} ${name} ${chalk.dim('(testing...)')}`);

      const result = await this.testServer(name, config);
      results.push(result);

      // Clear the line and rewrite
      process.stdout.write('\r');

      if (result.status === 'healthy') {
        console.log(`  ${chalk.green('✓')} ${name} ${chalk.dim('(healthy)')}`);
      } else if (result.status === 'timeout') {
        console.log(`  ${chalk.yellow('⏱')} ${name} ${chalk.dim('(timeout)')}`);
      } else {
        console.log(`  ${chalk.red('✗')} ${name} ${chalk.dim(`(${result.message})`)}`);
      }
    }

    console.log('');

    // Summary
    const healthy = results.filter((r) => r.status === 'healthy').length;
    const total = results.length;

    if (healthy === total) {
      console.log(chalk.green(`✓ All ${total} server(s) are healthy\n`));
    } else {
      console.log(chalk.yellow(`⚠ ${healthy}/${total} server(s) are healthy\n`));
    }

    // Recommendations
    const failed = results.filter((r) => r.status === 'error');
    if (failed.length > 0) {
      console.log(chalk.bold('Recommendations:'));
      for (const result of failed) {
        console.log(`  • ${result.name}: ${result.message}`);
        if (result.stderr) {
          console.log(chalk.dim(`    ${result.stderr}`));
        }
      }
      console.log('');
    }
  }

  /**
   * Interactive add MCP server
   */
  async add(serverName) {
    console.log(chalk.bold('\n➕ Add MCP Server\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Server name:',
        default: serverName,
        validate: (input) => (input.trim() ? true : 'Server name is required'),
      },
      {
        type: 'list',
        name: 'type',
        message: 'Server type:',
        choices: [
          { name: 'NPX package (e.g., @modelcontextprotocol/server-*)', value: 'npx' },
          { name: 'Node.js script', value: 'node' },
          { name: 'Custom command', value: 'custom' },
        ],
      },
    ]);

    let command;
    let args = [];
    let env = {};

    if (answers.type === 'npx') {
      const packageAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'package',
          message: 'NPX package name:',
          validate: (input) => (input.trim() ? true : 'Package name is required'),
        },
      ]);
      command = 'npx';
      args = ['-y', packageAnswer.package];
    } else if (answers.type === 'node') {
      const scriptAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'script',
          message: 'Path to Node.js script:',
          validate: (input) => (input.trim() ? true : 'Script path is required'),
        },
      ]);
      command = 'node';
      args = [scriptAnswer.script];
    } else {
      const customAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: 'Command:',
          validate: (input) => (input.trim() ? true : 'Command is required'),
        },
        {
          type: 'input',
          name: 'args',
          message: 'Arguments (space-separated):',
        },
      ]);
      command = customAnswer.command;
      args = customAnswer.args ? customAnswer.args.split(' ').filter((a) => a.trim()) : [];
    }

    // Ask for environment variables
    const envAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasEnv',
        message: 'Add environment variables?',
        default: false,
      },
    ]);

    if (envAnswer.hasEnv) {
      let addMore = true;
      while (addMore) {
        const envVar = await inquirer.prompt([
          {
            type: 'input',
            name: 'key',
            message: 'Environment variable name:',
          },
          {
            type: 'input',
            name: 'value',
            message: 'Environment variable value:',
          },
          {
            type: 'confirm',
            name: 'more',
            message: 'Add another environment variable?',
            default: false,
          },
        ]);

        if (envVar.key) {
          env[envVar.key] = envVar.value;
        }
        addMore = envVar.more;
      }
    }

    // Ask which config to update
    const configAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'config',
        message: 'Which configuration to update?',
        choices: [
          { name: 'Claude Code (.claude/mcp-config.json)', value: 'claude' },
          { name: 'aidesigner (mcp/aidesigner-config.json)', value: 'aidesigner' },
          { name: 'Both', value: 'both' },
        ],
        default: 'claude',
      },
    ]);

    // Build server config
    const serverConfig = {
      command,
      args,
      disabled: false,
    };

    if (Object.keys(env).length > 0) {
      serverConfig.env = env;
    }

    // Update configuration(s)
    if (configAnswer.config === 'claude' || configAnswer.config === 'both') {
      const config = this.loadClaudeConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[answers.name] = serverConfig;
      this.saveClaudeConfig(config);
      console.log(chalk.green(`\n✓ Added ${answers.name} to .claude/mcp-config.json`));
    }

    if (configAnswer.config === 'aidesigner' || configAnswer.config === 'both') {
      const config = this.loadaidesignerConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[answers.name] = serverConfig;
      this.saveaidesignerConfig(config);
      console.log(chalk.green(`✓ Added ${answers.name} to mcp/aidesigner-config.json`));
    }

    console.log(chalk.dim('\nRun `aidesigner mcp doctor` to test the server.\n'));
  }

  /**
   * Remove an MCP server
   */
  async remove(serverName) {
    console.log(chalk.bold('\n➖ Remove MCP Server\n'));

    const claudeConfig = this.loadClaudeConfig();
    const aidesignerConfig = this.loadaidesignerConfig();

    const existsInClaude = claudeConfig.mcpServers?.[serverName];
    const existsInaidesigner = aidesignerConfig.mcpServers?.[serverName];

    if (!existsInClaude && !existsInaidesigner) {
      console.log(chalk.red(`Server "${serverName}" not found in any configuration.`));
      return;
    }

    const locations = [];
    if (existsInClaude) locations.push('Claude Code');
    if (existsInaidesigner) locations.push('aidesigner');

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove "${serverName}" from ${locations.join(' and ')}?`,
        default: false,
      },
    ]);

    if (!answer.confirm) {
      console.log(chalk.yellow('\nCancelled.\n'));
      return;
    }

    if (existsInClaude) {
      delete claudeConfig.mcpServers[serverName];
      this.saveClaudeConfig(claudeConfig);
      console.log(chalk.green(`\n✓ Removed ${serverName} from .claude/mcp-config.json`));
    }

    if (existsInaidesigner) {
      delete aidesignerConfig.mcpServers[serverName];
      this.saveaidesignerConfig(aidesignerConfig);
      console.log(chalk.green(`✓ Removed ${serverName} from mcp/aidesigner-config.json`));
    }

    console.log('');
  }

  /**
   * Search for MCP servers in registry
   */
  async search(query, options = {}) {
    console.log(chalk.bold(`\n🔍 Searching for "${query}"...\n`));

    const results = await this.registry.search(query, options);

    if (results.length === 0) {
      console.log(chalk.yellow('No MCP servers found matching your query.'));
      console.log(
        chalk.dim('Try different search terms or browse all servers with `mcp browse`.\n'),
      );
      return;
    }

    console.log(chalk.green(`Found ${results.length} server(s):\n`));

    for (const server of results) {
      console.log(`${chalk.cyan('●')} ${chalk.bold(server.name)}`);
      console.log(`  ${chalk.dim(server.category)} - ${server.description}`);

      if (server.envVars && server.envVars.length > 0) {
        console.log(`  ${chalk.yellow('⚠')}  Requires: ${server.envVars.join(', ')}`);
      }

      console.log(`  ${chalk.dim('Install:')} aidesigner mcp install ${server.id}`);
      console.log('');
    }
  }

  /**
   * Install an MCP server from registry
   */
  async install(serverIdOrName, options = {}) {
    console.log(chalk.bold(`\n📦 Installing MCP Server...\n`));

    // Look up server in registry
    const server = await this.registry.getServer(serverIdOrName);

    if (!server) {
      console.log(chalk.red(`Server "${serverIdOrName}" not found in registry.`));
      console.log(chalk.dim('Search available servers with: aidesigner mcp search <query>\n'));
      return;
    }

    console.log(`${chalk.cyan('●')} ${chalk.bold(server.name)}`);
    console.log(`  ${server.description}\n`);

    // Build configuration based on server type
    let command;
    let args = [];
    const env = {};

    if (server.installType === 'npx') {
      command = 'npx';
      args = ['-y', server.name];
    } else {
      console.log(chalk.red('Unsupported installation type'));
      return;
    }

    // Ask for environment variables if needed
    if (server.envVars && server.envVars.length > 0) {
      console.log(chalk.yellow('This server requires environment variables:\n'));

      for (const envVar of server.envVars) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'value',
            message: `${envVar}:`,
            validate: (input) => (input.trim() ? true : 'This variable is required'),
          },
        ]);
        env[envVar] = answer.value;
      }

      console.log('');
    }

    // Ask for custom server name
    const nameAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Server name (identifier in config):',
        default: server.id,
        validate: (input) => (input.trim() ? true : 'Server name is required'),
      },
    ]);

    // Ask which config to update
    const configAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'config',
        message: 'Which configuration to update?',
        choices: [
          { name: 'Claude Code (.claude/mcp-config.json)', value: 'claude' },
          { name: 'aidesigner (mcp/aidesigner-config.json)', value: 'aidesigner' },
          { name: 'Both', value: 'both' },
        ],
        default: options.config || 'claude',
      },
    ]);

    // Build server config
    const serverConfig = {
      command,
      args,
      disabled: false,
    };

    if (Object.keys(env).length > 0) {
      serverConfig.env = env;
    }

    // Update configuration(s)
    if (configAnswer.config === 'claude' || configAnswer.config === 'both') {
      const config = this.loadClaudeConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[nameAnswer.name] = serverConfig;
      this.saveClaudeConfig(config);
      console.log(chalk.green(`\n✓ Added ${nameAnswer.name} to .claude/mcp-config.json`));
    }

    if (configAnswer.config === 'aidesigner' || configAnswer.config === 'both') {
      const config = this.loadaidesignerConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[nameAnswer.name] = serverConfig;
      this.saveaidesignerConfig(config);
      console.log(chalk.green(`✓ Added ${nameAnswer.name} to mcp/aidesigner-config.json`));
    }

    console.log(chalk.dim('\nRun `aidesigner mcp doctor` to test the server.\n'));
  }

  /**
   * Suggest MCP servers based on project context
   */
  async suggest() {
    console.log(chalk.bold('\n💡 MCP Server Suggestions\n'));
    console.log(chalk.dim('Analyzing your project...\n'));

    const suggestions = await this.registry.suggestForProject(this.rootDir);

    if (suggestions.length === 0) {
      console.log(chalk.yellow('No specific suggestions based on your project.'));
      console.log(chalk.dim('Browse available servers with: aidesigner mcp browse\n'));
      return;
    }

    console.log(chalk.green(`Found ${suggestions.length} recommendation(s):\n`));

    for (const { server, reason } of suggestions) {
      console.log(`${chalk.cyan('●')} ${chalk.bold(server.name)}`);
      console.log(`  ${chalk.dim('Reason:')} ${reason}`);
      console.log(`  ${server.description}`);
      console.log(`  ${chalk.dim('Install:')} aidesigner mcp install ${server.id}`);
      console.log('');
    }
  }

  /**
   * Browse all available MCP servers
   */
  async browse(options = {}) {
    console.log(chalk.bold('\n📚 Available MCP Servers\n'));

    const servers = await this.registry.getServers(options.refresh);
    const categories = await this.registry.getCategories();

    // Group servers by category
    const grouped = {};
    for (const category of categories) {
      grouped[category] = servers.filter((s) => s.category === category);
    }

    // Display by category
    for (const category of categories) {
      console.log(chalk.bold.cyan(`\n${category}:`));

      for (const server of grouped[category]) {
        console.log(`  ${chalk.cyan('●')} ${server.name}`);
        console.log(`    ${server.description}`);

        if (server.envVars && server.envVars.length > 0) {
          console.log(`    ${chalk.yellow('⚠')}  Requires: ${server.envVars.join(', ')}`);
        }
      }
    }

    console.log(chalk.dim(`\n\nTotal: ${servers.length} server(s)`));
    console.log(chalk.dim('Install with: aidesigner mcp install <server-id>\n'));
  }

  /**
   * Secure configuration - migrate to encrypted storage
   */
  async secure() {
    console.log(chalk.bold('\n🔒 Securing MCP Configuration\n'));

    await this.security.initialize();

    const profile = this.getCurrentProfile();
    const claudeConfig = this.loadClaudeConfig();
    const aidesignerConfig = this.loadaidesignerConfig();

    // Audit first
    const auditClaude = this.security.auditConfig(claudeConfig);
    const auditaidesigner = this.security.auditConfig(aidesignerConfig);

    const totalIssues = auditClaude.issues.length + auditaidesigner.issues.length;

    if (totalIssues === 0) {
      console.log(chalk.green('✓ No security issues found. Configuration is already secure.\n'));
      return;
    }

    console.log(chalk.yellow(`Found ${totalIssues} security issue(s)\n`));

    // Ask for confirmation
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Migrate credentials to secure storage?',
        default: true,
      },
    ]);

    if (!answer.proceed) {
      console.log(chalk.yellow('\nCancelled.\n'));
      return;
    }

    // Migrate Claude config
    if (auditClaude.issues.length > 0) {
      const migrated = await this.security.migrateToSecure(claudeConfig, profile);
      this.saveClaudeConfig(migrated.config);
      console.log(
        chalk.green(
          `✓ Migrated ${migrated.count} credential(s) from Claude config to secure storage`,
        ),
      );
    }

    // Migrate aidesigner config
    if (auditaidesigner.issues.length > 0) {
      const migrated = await this.security.migrateToSecure(aidesignerConfig, profile);
      this.saveaidesignerConfig(migrated.config);
      console.log(
        chalk.green(
          `✓ Migrated ${migrated.count} credential(s) from aidesigner config to secure storage`,
        ),
      );
    }

    console.log(chalk.green('\n✓ Configuration secured successfully!\n'));
  }

  /**
   * Run security audit
   */
  async audit() {
    console.log(chalk.bold('\n🔍 Security Audit\n'));

    const profile = this.getCurrentProfile();
    const claudeConfig = this.loadClaudeConfig();
    const aidesignerConfig = this.loadaidesignerConfig();

    const auditClaude = this.security.auditConfig(claudeConfig);
    const auditaidesigner = this.security.auditConfig(aidesignerConfig);

    console.log(chalk.bold('Claude Configuration:'));
    if (auditClaude.secure) {
      console.log(chalk.green('  ✓ Secure'));
    } else {
      console.log(chalk.red(`  ✗ ${auditClaude.issues.length} issue(s) found`));
      for (const issue of auditClaude.issues) {
        console.log(`    - ${issue.message}`);
      }
    }

    console.log('');
    console.log(chalk.bold('aidesigner Configuration:'));
    if (auditaidesigner.secure) {
      console.log(chalk.green('  ✓ Secure'));
    } else {
      console.log(chalk.red(`  ✗ ${auditaidesigner.issues.length} issue(s) found`));
      for (const issue of auditaidesigner.issues) {
        console.log(`    - ${issue.message}`);
      }
    }

    console.log('');
    console.log(chalk.bold('Stored Credentials:'));
    const credentials = this.security.listCredentials(profile);
    if (credentials.length === 0) {
      console.log(chalk.dim('  No credentials in secure storage'));
    } else {
      for (const cred of credentials) {
        console.log(`  ${chalk.cyan('●')} ${cred.key} (${cred.type}) - ${cred.stored}`);
      }
    }

    console.log('');
    if (!auditClaude.secure || !auditBmad.secure) {
      console.log(
        chalk.yellow('⚠️  Run `npm run mcp:secure` to migrate credentials to secure storage\n'),
      );
    } else {
      console.log(chalk.green('✓ All configurations are secure\n'));
    }
  }

  /**
   * Manage profiles
   */
  async manageProfiles(action, ...args) {
    switch (action) {
      case 'list': {
        await this.listAllProfiles();
        break;
      }
      case 'create': {
        await this.createNewProfile(...args);
        break;
      }
      case 'switch': {
        await this.switchProfile(...args);
        break;
      }
      case 'delete': {
        await this.deleteProfileInteractive(...args);
        break;
      }
      case 'diff': {
        await this.diffProfiles(...args);
        break;
      }
      case 'export': {
        await this.exportProfile(...args);
        break;
      }
      case 'import': {
        await this.importProfile(...args);
        break;
      }
      default: {
        console.log(chalk.red(`Unknown profile action: ${action}`));
      }
    }
  }

  async listAllProfiles() {
    console.log(chalk.bold('\n📋 MCP Profiles\n'));

    const profiles = this.profiles.listProfiles();

    for (const profile of profiles) {
      const active = profile.active ? chalk.green(' [ACTIVE]') : '';
      console.log(`${chalk.cyan('●')} ${chalk.bold(profile.name)}${active}`);
      console.log(`  ${chalk.dim(profile.description)}`);

      if (profile.inheritsFrom && profile.inheritsFrom !== 'default') {
        console.log(`  ${chalk.dim('Inherits from:')} ${profile.inheritsFrom}`);
      }

      const status = [];
      if (profile.hasClaudeConfig) status.push('Claude');
      if (profile.hasaidesignerConfig) status.push('aidesigner');

      if (status.length > 0) {
        console.log(`  ${chalk.dim('Configs:')} ${status.join(', ')}`);
      }

      console.log('');
    }

    console.log(chalk.dim(`Total: ${profiles.length} profile(s)\n`));
  }

  async createNewProfile(name, options = {}) {
    if (!name) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Profile name:',
          validate: (input) => (input.trim() ? true : 'Profile name is required'),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: (answers) => `${answers.name} environment`,
        },
        {
          type: 'list',
          name: 'copyFrom',
          message: 'Copy from existing profile?',
          choices: [
            { name: 'Start empty', value: null },
            { name: 'Copy from default', value: 'default' },
            ...this.profiles
              .listProfiles()
              .filter((p) => p.name !== 'default')
              .map((p) => ({ name: `Copy from ${p.name}`, value: p.name })),
          ],
        },
      ]);

      name = answer.name;
      options.description = answer.description;
      options.copyFrom = answer.copyFrom;
    }

    const profile = this.profiles.createProfile(name, options);
    console.log(chalk.green(`\n✓ Created profile: ${name}`));

    // Show recommendations
    const recommendations = this.profiles.getEnvironmentRecommendations(name);
    if (recommendations.length > 0) {
      console.log(chalk.bold('\nRecommendations:'));
      for (const rec of recommendations) {
        console.log(`  ${chalk.yellow('•')} ${rec.message}`);
        console.log(`    ${chalk.dim(rec.action)}`);
      }
    }

    console.log('');
  }

  async switchProfile(profileName) {
    if (!profileName) {
      const profiles = this.profiles.listProfiles();
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select profile:',
          choices: profiles.map((p) => ({
            name: p.active ? `${p.name} (current)` : p.name,
            value: p.name,
          })),
        },
      ]);

      profileName = answer.profile;
    }

    this.profiles.setActiveProfile(profileName);
    console.log(chalk.green(`\n✓ Switched to profile: ${profileName}\n`));
  }

  async deleteProfileInteractive(profileName) {
    if (!profileName) {
      const profiles = this.profiles.listProfiles().filter((p) => p.name !== 'default');
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select profile to delete:',
          choices: profiles.map((p) => ({ name: p.name, value: p.name })),
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: (answers) => `Delete profile "${answers.profile}"? This cannot be undone.`,
          default: false,
        },
      ]);

      if (!answer.confirm) {
        console.log(chalk.yellow('\nCancelled.\n'));
        return;
      }

      profileName = answer.profile;
    }

    this.profiles.deleteProfile(profileName);
    console.log(chalk.green(`\n✓ Deleted profile: ${profileName}\n`));
  }

  async diffProfiles(profile1, profile2) {
    if (!profile1 || !profile2) {
      const profiles = this.profiles.listProfiles();
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile1',
          message: 'First profile:',
          choices: profiles.map((p) => p.name),
        },
        {
          type: 'list',
          name: 'profile2',
          message: 'Second profile:',
          choices: profiles.map((p) => p.name),
        },
      ]);

      profile1 = answer.profile1;
      profile2 = answer.profile2;
    }

    console.log(chalk.bold(`\n📊 Comparing ${profile1} vs ${profile2}\n`));

    const diff = this.profiles.diffProfiles(profile1, profile2);

    if (diff.onlyIn1.length > 0) {
      console.log(chalk.bold(`Only in ${profile1}:`));
      for (const server of diff.onlyIn1) {
        console.log(`  ${chalk.cyan('+')} ${server}`);
      }
      console.log('');
    }

    if (diff.onlyIn2.length > 0) {
      console.log(chalk.bold(`Only in ${profile2}:`));
      for (const server of diff.onlyIn2) {
        console.log(`  ${chalk.red('-')} ${server}`);
      }
      console.log('');
    }

    if (diff.different.length > 0) {
      console.log(chalk.bold('Different configuration:'));
      for (const server of diff.different) {
        console.log(`  ${chalk.yellow('~')} ${server}`);
      }
      console.log('');
    }

    if (diff.identical.length > 0) {
      console.log(chalk.dim(`Identical: ${diff.identical.length} server(s)\n`));
    }
  }

  async exportProfile(profileName, outputPath) {
    if (!profileName) {
      const profiles = this.profiles.listProfiles();
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'profile',
          message: 'Select profile to export:',
          choices: profiles.map((p) => p.name),
        },
        {
          type: 'input',
          name: 'output',
          message: 'Output file path:',
          default: (answers) => `./${answers.profile}-profile.json`,
        },
      ]);

      profileName = answer.profile;
      outputPath = answer.output;
    }

    this.profiles.exportProfile(profileName, outputPath);
    console.log(chalk.green(`\n✓ Exported profile "${profileName}" to ${outputPath}\n`));
  }

  async importProfile(inputPath, newName) {
    if (!inputPath) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: 'Profile file path:',
          validate: (input) => (fs.existsSync(input) ? true : 'File not found'),
        },
        {
          type: 'input',
          name: 'name',
          message: 'New profile name (leave empty to use original):',
        },
      ]);

      inputPath = answer.input;
      newName = answer.name || null;
    }

    const imported = this.profiles.importProfile(inputPath, newName);
    console.log(chalk.green(`\n✓ Imported profile: ${imported}\n`));
  }
}

module.exports = McpManager;
