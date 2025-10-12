const { Command } = require('commander');
const WebBuilder = require('./builders/web-builder');
const V3ToV4Upgrader = require('./upgraders/v3-to-v4-upgrader');
const IdeSetup = require('./installer/lib/ide-setup');
const McpManager = require('./mcp-manager');
const path = require('node:path');
const fs = require('node:fs/promises');
const { normalizeConfigTarget } = require('./shared/mcp-config');

const program = new Command();

program
  .name('bmad-build')
  .description('BMAD-METHOD™ build tool for creating web bundles')
  .version('4.0.0');

program
  .command('build')
  .description('Build web bundles for agents and teams')
  .option('-a, --agents-only', 'Build only agent bundles')
  .option('-t, --teams-only', 'Build only team bundles')
  .option('--no-clean', 'Skip cleaning output directories')
  .action(async (options) => {
    const builder = new WebBuilder({
      rootDir: process.cwd(),
    });

    try {
      if (options.clean) {
        console.log('Cleaning output directories...');
        await builder.cleanOutputDirs();
      }

      if (!options.teamsOnly) {
        console.log('Building agent bundles...');
        await builder.buildAgents();
      }

      if (!options.agentsOnly) {
        console.log('Building team bundles...');
        await builder.buildTeams();
      }

      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('list:agents')
  .description('List all available agents')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const agents = await builder.resolver.listAgents();
    console.log('Available agents:');
    for (const agent of agents) console.log(`  - ${agent}`);
    process.exit(0);
  });

program
  .command('validate')
  .description('Validate agent and team configurations')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      // Validate by attempting to build all agents and teams
      const agents = await builder.resolver.listAgents();
      const teams = await builder.resolver.listTeams();

      console.log('Validating agents...');
      for (const agent of agents) {
        await builder.resolver.resolveAgentDependencies(agent);
        console.log(`  ✓ ${agent}`);
      }

      console.log('\nValidating teams...');
      for (const team of teams) {
        await builder.resolver.resolveTeamDependencies(team);
        console.log(`  ✓ ${team}`);
      }

      console.log('\nAll configurations are valid!');
    } catch (error) {
      console.error('Validation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('upgrade')
  .description('Upgrade a BMAD-METHOD™ V3 project to V4')
  .option('-p, --project <path>', 'Path to V3 project (defaults to current directory)')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('--no-backup', 'Skip creating backup (not recommended)')
  .action(async (options) => {
    const upgrader = new V3ToV4Upgrader();
    await upgrader.upgrade({
      projectPath: options.project,
      dryRun: options.dryRun,
      backup: options.backup,
    });
  });

// MCP Management Commands
const mcp = program.command('mcp').description('Manage Model Context Protocol servers');

mcp
  .command('list')
  .description('List all configured MCP servers')
  .action(async () => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.list();
  });

mcp
  .command('doctor')
  .description('Run health checks on MCP servers')
  .action(async () => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.doctor();
  });

mcp
  .command('add [name]')
  .description('Add a new MCP server interactively')
  .action(async (name) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.add(name);
  });

mcp
  .command('remove <name>')
  .description('Remove an MCP server')
  .action(async (name) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.remove(name);
  });

mcp
  .command('search <query>')
  .description('Search for MCP servers in the registry')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (query, options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.search(query, options);
  });

mcp
  .command('install <server>')
  .description('Install an MCP server from the registry')
  .option(
    '--config <type>',
    'Target config (claude, aidesigner, or both; bmad is a legacy alias)',
    'claude',
  )
  .action(async (server, options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    const normalizedOptions = {
      ...options,
      config: normalizeConfigTarget(options.config),
    };

    await manager.install(server, normalizedOptions);
  });

mcp
  .command('suggest')
  .description('Get MCP server suggestions based on your project')
  .action(async () => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.suggest();
  });

mcp
  .command('browse')
  .description('Browse all available MCP servers')
  .option('-r, --refresh', 'Refresh the registry cache')
  .action(async (options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.browse(options);
  });

// Profile management commands
const profile = mcp.command('profile').description('Manage MCP configuration profiles');

profile
  .command('list')
  .description('List all available profiles')
  .action(async () => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('list');
  });

profile
  .command('create <name>')
  .description('Create a new profile')
  .option('-d, --description <desc>', 'Profile description')
  .option('-c, --copy-from <profile>', 'Copy from existing profile')
  .option('-i, --inherit-from <profile>', 'Inherit from existing profile')
  .action(async (name, options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('create', name, options);
  });

profile
  .command('switch <name>')
  .description('Switch to a different profile')
  .action(async (name) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('switch', name);
  });

profile
  .command('delete <name>')
  .description('Delete a profile')
  .action(async (name) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('delete', name);
  });

profile
  .command('diff <profile1> <profile2>')
  .description('Compare two profiles')
  .option(
    '-t, --type <type>',
    'Config type (claude or aidesigner; bmad is a legacy alias)',
    'claude',
  )
  .action(async (profile1, profile2, options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    const normalizedOptions = {
      ...options,
      type: normalizeConfigTarget(options.type),
    };

    await manager.manageProfiles('diff', profile1, profile2, normalizedOptions);
  });

profile
  .command('export <name> <file>')
  .description('Export a profile to a file')
  .action(async (name, file) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('export', name, file);
  });

profile
  .command('import <file>')
  .description('Import a profile from a file')
  .option('-n, --name <name>', 'Profile name (defaults to name from file)')
  .action(async (file, options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.manageProfiles('import', file, options);
  });

// Security commands
mcp
  .command('secure')
  .description('Migrate credentials to secure encrypted storage')
  .option('-p, --profile <profile>', 'Target profile (defaults to active profile)')
  .action(async (options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.secure(options);
  });

mcp
  .command('audit')
  .description('Run security audit on MCP configurations')
  .option('-p, --profile <profile>', 'Target profile (defaults to active profile)')
  .action(async (options) => {
    const manager = new McpManager({ rootDir: process.cwd() });
    await manager.audit(options);
  });

const metaAgent = program
  .command('meta-agent')
  .description('Interact with Architect and Quasar meta-agents');

/**
 * Register ts-node to load TypeScript modules
 */
function registerTypeScriptLoader() {
  try {
    const tsconfigPath = path.resolve(__dirname, '..', '..', 'tsconfig.aidesigner-ng.json');
    require('ts-node').register({
      transpileOnly: true,
      project: tsconfigPath,
    });
  } catch (error) {
    throw new Error(
      'ts-node is required to run meta-agent commands. Install it with: npm install --save-dev ts-node',
    );
  }
}

/**
 * Load the meta-agents module
 */
function loadMetaAgentsModule() {
  const metaAgentsModulePath = path.resolve(
    __dirname,
    '..',
    '..',
    'packages',
    'meta-agents',
    'src',
    'index.ts',
  );
  return require(metaAgentsModulePath);
}

/**
 * Read a file with error handling
 */
async function readFileWithErrorHandling(filePath, fileDescription) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(
      `Failed to read ${fileDescription} at ${filePath}. Ensure the file exists and is readable.`,
    );
  }
}

/**
 * Parse JSON with validation
 */
function parseJsonWithValidation(content, filePath) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error.message}`);
  }

  if (!parsed.tasks || !parsed.featureRequest) {
    throw new Error(
      `Invalid handoff format in ${filePath}: missing required fields (tasks, featureRequest)`,
    );
  }

  return parsed;
}

/**
 * Run the Architect meta-agent
 */
async function runArchitectAgent(options, agentImports) {
  const { createArchitectOrchestrator, listDirectiveHeadings } = agentImports;

  if (!options.feature) {
    throw new Error('A feature request is required when running the Architect.');
  }

  const directivePath = path.resolve(
    options.directive ?? path.join(process.cwd(), 'agents', 'meta-agent-developer.md'),
  );
  const directiveMarkdown = await readFileWithErrorHandling(directivePath, 'directive file');

  const orchestrator = await createArchitectOrchestrator({
    directiveMarkdown,
    featureRequest: options.feature,
  });

  const headings = listDirectiveHeadings(orchestrator.getDirective());
  console.log(`Architect meta-agent ready for feature: ${options.feature}`);
  console.log(`Directive title: ${orchestrator.getDirective().title}`);
  console.log(`Key sections: ${headings.join(', ')}`);
  console.log(
    'Use the meta-agents API to register tasks and call execute() to produce a handoff.',
  );
}

/**
 * Run the Quasar meta-agent
 */
async function runQuasarAgent(options, agentImports) {
  const { createQuasarOrchestrator } = agentImports;

  if (!options.handoff) {
    throw new Error('A handoff JSON path is required when running the Quasar.');
  }

  const directivePath = path.resolve(
    options.directive ?? path.join(process.cwd(), 'agents', 'meta-agent-orchestrator.md'),
  );
  const handoffPath = path.resolve(options.handoff);

  const directiveMarkdown = await readFileWithErrorHandling(directivePath, 'directive file');
  const handoffContent = await readFileWithErrorHandling(handoffPath, 'handoff JSON');
  const handoff = parseJsonWithValidation(handoffContent, handoffPath);

  const orchestrator = await createQuasarOrchestrator({
    directiveMarkdown,
    handoff,
  });

  const plan = orchestrator.getTestPlan();
  console.log(`Quasar meta-agent ready. Generated ${plan.items.length} tester missions.`);
  for (const item of plan.items) {
    console.log(`- ${item.id}: ${item.mission}`);
  }
  console.log(
    'Use executeTests() with custom tester executors to produce the Global Quality Report.',
  );
}

metaAgent
  .command('run <agent>')
  .description('Instantiate a meta-agent orchestrator')
  .option('-f, --feature <feature>', 'Feature request to pass to the Architect meta-agent')
  .option('-d, --directive <path>', 'Path to the directive markdown file')
  .option('-h, --handoff <path>', 'Path to an Architect handoff JSON document for Quasar')
  .action(async (agent, options) => {
    try {
      registerTypeScriptLoader();
      const agentImports = loadMetaAgentsModule();

      const normalizedAgent = agent.toLowerCase();
      if (normalizedAgent === 'architect') {
        await runArchitectAgent(options, agentImports);
      } else if (normalizedAgent === 'quasar') {
        await runQuasarAgent(options, agentImports);
      } else {
        throw new Error(`Unknown meta-agent "${agent}". Use "architect" or "quasar".`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Meta-agent command failed:', message);
      process.exitCode = 1;
    }
  });

program.parse();
