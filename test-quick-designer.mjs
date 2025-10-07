/**
 * Test Quick Designer Standalone MCP Server
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

console.log('🚀 Testing Quick Designer V4 MCP Server\n');

const server = spawn('node', ['quick-designer-standalone.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

const rl = createInterface({
  input: server.stdout,
  terminal: false,
});

let requestId = 1;

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params,
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

let initialized = false;

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);

    if (response.id === 1 && !initialized) {
      console.log('✅ Server initialized\n');
      initialized = true;

      // List tools
      sendRequest('tools/list');
    } else if (response.result && response.result.tools) {
      console.log('📋 Available Tools:');
      for (const [i, tool] of response.result.tools.entries()) {
        console.log(`   ${i + 1}. ${tool.name}`);
        console.log(`      ${tool.description}\n`);
      }

      console.log('---\n');
      console.log('🧪 Test 1: Generating dashboard with 3 variations\n');

      // Test generation
      sendRequest('tools/call', {
        name: 'quick_designer_generate',
        arguments: {
          prompt: 'modern SaaS dashboard with analytics and metrics',
          count: 3,
        },
      });

      setTimeout(() => {
        console.log('\n🧪 Test 2: Adding a new variation\n');
        sendRequest('tools/call', {
          name: 'quick_designer_add',
          arguments: {
            prompt: 'pricing page with 3 tiers',
          },
        });

        setTimeout(() => {
          console.log('\n🧪 Test 3: Showing all variations\n');
          sendRequest('tools/call', {
            name: 'quick_designer_show',
            arguments: {},
          });

          setTimeout(() => {
            console.log('\n✨ Tests completed!\n');
            server.kill();
          }, 2000);
        }, 2000);
      }, 2000);
    } else if (response.result && response.result.content) {
      console.log('📦 Result:');
      for (const item of response.result.content) {
        console.log(item.text);
      }
      console.log('');
    }
  } catch {
    // Ignore parse errors for non-JSON output
  }
});

server.stderr.on('data', (data) => {
  console.log('ℹ️', data.toString());
});

// Initialize
setTimeout(() => {
  sendRequest('initialize', {
    protocolVersion: '0.1.0',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  });
}, 100);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  server.kill();
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.kill();
});
