const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const McpRegistry = require('./mcp-registry');

class McpManager {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.claudeConfigPath = path.join(this.rootDir, '.claude', 'mcp-config.json');
    this.bmadConfigPath = path.join(this.rootDir, 'mcp', 'bmad-config.json');
    this.registry = new McpRegistry();
  }

  /**
   * Load configuration from .claude/mcp-config.json
   */
  loadClaudeConfig() {
    if (!fs.existsSync(this.claudeConfigPath)) {
      return { mcpServers: {} };
    }
    try {
      const content = fs.readFileSync(this.claudeConfigPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(chalk.red(`Error loading Claude config: ${error.message}`));
      return { mcpServers: {} };
    }
  }

  /**
   * Load configuration from mcp/bmad-config.json
   */
  loadBmadConfig() {
    if (!fs.existsSync(this.bmadConfigPath)) {
      return { mcpServers: {} };
    }
    try {
      const content = fs.readFileSync(this.bmadConfigPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(chalk.red(`Error loading BMAD config: ${error.message}`));
      return { mcpServers: {} };
    }
  }

  /**
   * Save configuration to .claude/mcp-config.json
   */
  saveClaudeConfig(config) {
    const dir = path.dirname(this.claudeConfigPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.claudeConfigPath, JSON.stringify(config, null, 2) + '\n');
  }

  /**
   * Save configuration to mcp/bmad-config.json
   */
  saveBmadConfig(config) {
    const dir = path.dirname(this.bmadConfigPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.bmadConfigPath, JSON.stringify(config, null, 2) + '\n');
  }

  /**
   * List all configured MCP servers
   */
  async list() {
    console.log(chalk.bold('\n📡 MCP Servers Configuration\n'));

    const claudeConfig = this.loadClaudeConfig();
    const bmadConfig = this.loadBmadConfig();

    // Combine both configs for complete view
    const allServers = new Map();

    // Add Claude config servers
    for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
      allServers.set(name, { ...config, source: 'claude' });
    }

    // Add BMAD config servers
    for (const [name, config] of Object.entries(bmadConfig.mcpServers || {})) {
      if (allServers.has(name)) {
        allServers.get(name).source = 'both';
      } else {
        allServers.set(name, { ...config, source: 'bmad' });
      }
    }

    if (allServers.size === 0) {
      console.log(chalk.yellow('No MCP servers configured.'));
      console.log(chalk.dim('Run `bmad-invisible mcp add` to configure your first server.\n'));
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
    const bmadConfig = this.loadBmadConfig();

    // Check if config files exist
    console.log(chalk.bold('Configuration Files:'));
    console.log(
      `  ${fs.existsSync(this.claudeConfigPath) ? chalk.green('✓') : chalk.red('✗')} ${this.claudeConfigPath}`,
    );
    console.log(
      `  ${fs.existsSync(this.bmadConfigPath) ? chalk.green('✓') : chalk.red('✗')} ${this.bmadConfigPath}`,
    );
    console.log('');

    // Combine all servers
    const allServers = new Map();
    for (const [name, config] of Object.entries(claudeConfig.mcpServers || {})) {
      allServers.set(name, config);
    }
    for (const [name, config] of Object.entries(bmadConfig.mcpServers || {})) {
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
          { name: 'BMAD (mcp/bmad-config.json)', value: 'bmad' },
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

    if (configAnswer.config === 'bmad' || configAnswer.config === 'both') {
      const config = this.loadBmadConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[answers.name] = serverConfig;
      this.saveBmadConfig(config);
      console.log(chalk.green(`✓ Added ${answers.name} to mcp/bmad-config.json`));
    }

    console.log(chalk.dim('\nRun `bmad-invisible mcp doctor` to test the server.\n'));
  }

  /**
   * Remove an MCP server
   */
  async remove(serverName) {
    console.log(chalk.bold('\n➖ Remove MCP Server\n'));

    const claudeConfig = this.loadClaudeConfig();
    const bmadConfig = this.loadBmadConfig();

    const existsInClaude = claudeConfig.mcpServers?.[serverName];
    const existsInBmad = bmadConfig.mcpServers?.[serverName];

    if (!existsInClaude && !existsInBmad) {
      console.log(chalk.red(`Server "${serverName}" not found in any configuration.`));
      return;
    }

    const locations = [];
    if (existsInClaude) locations.push('Claude Code');
    if (existsInBmad) locations.push('BMAD');

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

    if (existsInBmad) {
      delete bmadConfig.mcpServers[serverName];
      this.saveBmadConfig(bmadConfig);
      console.log(chalk.green(`✓ Removed ${serverName} from mcp/bmad-config.json`));
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

      console.log(`  ${chalk.dim('Install:')} bmad-invisible mcp install ${server.id}`);
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
      console.log(chalk.dim('Search available servers with: bmad-invisible mcp search <query>\n'));
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
          { name: 'BMAD (mcp/bmad-config.json)', value: 'bmad' },
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

    if (configAnswer.config === 'bmad' || configAnswer.config === 'both') {
      const config = this.loadBmadConfig();
      config.mcpServers = config.mcpServers || {};
      config.mcpServers[nameAnswer.name] = serverConfig;
      this.saveBmadConfig(config);
      console.log(chalk.green(`✓ Added ${nameAnswer.name} to mcp/bmad-config.json`));
    }

    console.log(chalk.dim('\nRun `bmad-invisible mcp doctor` to test the server.\n'));
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
      console.log(chalk.dim('Browse available servers with: bmad-invisible mcp browse\n'));
      return;
    }

    console.log(chalk.green(`Found ${suggestions.length} recommendation(s):\n`));

    for (const { server, reason } of suggestions) {
      console.log(`${chalk.cyan('●')} ${chalk.bold(server.name)}`);
      console.log(`  ${chalk.dim('Reason:')} ${reason}`);
      console.log(`  ${server.description}`);
      console.log(`  ${chalk.dim('Install:')} bmad-invisible mcp install ${server.id}`);
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
    console.log(chalk.dim('Install with: bmad-invisible mcp install <server-id>\n'));
  }
}

module.exports = McpManager;
