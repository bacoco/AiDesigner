/**
 * Theme Editor CLI - Simple wrapper for theme MCP server tools
 * Usage: node tools/theme-cli.js <command> [args]
 */

const { spawn } = require('node:child_process');
const path = require('node:path');

const mcpServerPath = path.join(
  __dirname,
  '..',
  'dist',
  'mcp',
  'src',
  'mcp-server',
  'theme-editor-server.js',
);

const commands = {
  'set-color': (token, color) => ({
    name: 'theme_set_color',
    arguments: { token, color },
  }),
  'apply-preset': (presetId) => ({
    name: 'theme_apply_preset',
    arguments: { presetId },
  }),
  'generate-palette': (baseColor, style = 'complementary') => ({
    name: 'theme_generate_palette',
    arguments: { baseColor, style },
  }),
  'generate-dark': () => ({
    name: 'theme_generate_dark_mode',
    arguments: {},
  }),
  'get-current': () => ({
    name: 'theme_get_current',
    arguments: {},
  }),
  export: (format = 'json') => ({
    name: 'theme_export',
    arguments: { format },
  }),
  undo: () => ({
    name: 'theme_undo',
    arguments: {},
  }),
  'list-presets': () => ({
    name: 'theme_list_presets',
    arguments: {},
  }),
};

function printHelp() {
  console.log(`
Theme Editor CLI

Usage: node tools/theme-cli.js <command> [args]

Commands:
  set-color <token> <color>         Set a color token (primary, accent, background)
  apply-preset <presetId>           Apply a preset (ocean, sunset, forest, midnight, coral)
  generate-palette <color> [style]  Generate palette from base color
                                    Styles: monochromatic, complementary, analogous, triadic
  generate-dark                     Generate dark mode version
  get-current                       Get current theme
  export [format]                   Export theme (json, css, tailwind)
  undo                              Undo last change
  list-presets                      List available presets
  help                              Show this help

Examples:
  node tools/theme-cli.js set-color primary "#3b82f6"
  node tools/theme-cli.js apply-preset ocean
  node tools/theme-cli.js generate-palette "#ff6b35" complementary
  node tools/theme-cli.js export css
`);
}

async function callMCPTool(toolCall) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let resolved = false;
    let buffer = '';

    const finish = (val, isError = false) => {
      if (resolved) return;
      resolved = true;
      try { server.kill('SIGTERM'); } catch {}
      isError ? reject(val) : resolve(val);
    };

    // Set timeout for MCP responses
    const timeout = setTimeout(() => {
      finish(new Error('MCP server response timeout'), true);
    }, 10000);

    server.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;

        let msg;
        try { msg = JSON.parse(t); } catch { continue; }

        // Handle tool call response (id: 1)
        if (msg.id === 1 && msg.result && Array.isArray(msg.result.content)) {
          clearTimeout(timeout);
          try {
            const text = msg.result.content[0]?.text ?? '{}';
            const payload = JSON.parse(text);
            finish(payload, payload?.isError === true);
          } catch (e) {
            finish(e, true);
          }
        } else if (msg.id === 1 && msg.error) {
          clearTimeout(timeout);
          finish(new Error(msg.error.message || 'MCP error'), true);
        }
      }
    });

    server.stderr.on('data', () => {
      // Ignore stderr from MCP server (contains "Theme Editor MCP Server started")
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      finish(err, true);
    });

    server.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (!resolved) {
        finish(new Error(`MCP server exited before responding (code=${code}, signal=${signal})`), true);
      }
    });

    // 1) Send initialize request
    const init = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '1.0',
        capabilities: {},
        clientInfo: { name: 'theme-cli', version: '1.0.0' },
      },
    };
    server.stdin.write(JSON.stringify(init) + '\n');

    // 2) Send tool call request
    const req = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: toolCall
    };
    server.stdin.write(JSON.stringify(req) + '\n');
  });
}

async function main() {
  const cmd = process.argv[2];
  const cmdArgs = process.argv.slice(3);

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return;
  }

  const handler = commands[cmd];
  if (!handler) {
    console.error(`❌ Unknown command: ${cmd}`);
    printHelp();
    process.exit(1);
  }

  try {
    const toolCall = handler(...cmdArgs);
    const result = await callMCPTool(toolCall);

    // Handle both success flag and read-only operations (no success flag)
    if (result.success !== false) {
      if (result.message) {
        console.log('✓', result.message);
      }
      if (result.theme) {
        console.log('\nCurrent Theme:');
        console.log(JSON.stringify(result.theme, null, 2));
      }
      if (result.exported) {
        console.log('\nExported:');
        console.log(result.exported);
      }
      if (result.presets) {
        console.log('\nAvailable Presets:');
        for (const p of result.presets) {
          console.log(`  ${p.id.padEnd(12)} - ${p.name}: ${p.description}`);
        }
      }
      // Handle historyCount for get-current
      if (typeof result.historyCount === 'number') {
        console.log(`\nHistory entries: ${result.historyCount}`);
      }
    } else {
      console.error('❌ Failed:', result.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { callMCPTool, commands };
