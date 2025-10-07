/**
 * Add Quick Designer to Claude CLI config
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CLAUDE_CONFIG = path.join(os.homedir(), '.claude.json');
const SERVER_PATH = path.join(process.cwd(), 'quick-designer-standalone.mjs');

async function addToConfig() {
  console.log('🔧 Adding Quick Designer to Claude CLI config...\n');

  try {
    // Read existing config
    let config;
    try {
      const data = await fs.readFile(CLAUDE_CONFIG, 'utf8');
      config = JSON.parse(data);
    } catch {
      console.log('⚠️  No existing config found, creating new one');
      config = {};
    }

    // Ensure mcpServers exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add Quick Designer
    config.mcpServers['quick-designer'] = {
      command: 'node',
      args: [SERVER_PATH],
    };

    // Write config
    await fs.writeFile(CLAUDE_CONFIG, JSON.stringify(config, null, 2));

    console.log('✅ Quick Designer added to Claude CLI config!\n');
    console.log('Config location:', CLAUDE_CONFIG);
    console.log('Server path:', SERVER_PATH);
    console.log('\n📋 Next steps:');
    console.log("1. Restart Claude CLI if it's running");
    console.log('2. Test with: claude "Use quick_designer_generate to test"');
    console.log('\n📖 Full usage guide: QUICK-DESIGNER-USAGE.md');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

await addToConfig();
