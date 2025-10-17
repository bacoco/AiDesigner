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
      stdio: ['pipe', 'pipe', process.stderr],
    });

    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}`));
        return;
      }

      try {
        const lines = output.split('\n').filter((l) => l.trim());
        const result = lines.find((l) => {
          try {
            const parsed = JSON.parse(l);
            return parsed.content || parsed.error;
          } catch {
            return false;
          }
        });

        if (result) {
          const parsed = JSON.parse(result);
          if (parsed.content && parsed.content[0]) {
            const content = JSON.parse(parsed.content[0].text);
            resolve(content);
          } else if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(parsed);
          }
        } else {
          reject(new Error('No valid response from MCP server'));
        }
      } catch (error) {
        reject(error);
      }
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: toolCall,
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
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
    const success = typeof result.success === 'boolean' ? result.success : !result.error;

    if (success) {
      console.log('✓', result.message || 'Success');
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
