'use strict';

/**
 * Postinstall script to synchronise MCP (Model Context Protocol) assets.
 *
 * The primary build now happens during `prepack`/`prepublish` so this script
 * only needs to ensure the runtime assets are present when the prebuilt files
 * already exist. If no prebuilt server is found we skip the copy step and
 * advise the user to run the MCP build manually.
 */

const { existsSync, mkdirSync, readdirSync, copyFileSync } = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distMcpDir = path.join(rootDir, 'dist', 'mcp');
const serverEntry = path.join(distMcpDir, 'mcp', 'server.js');

const hasPrebuiltServer = existsSync(serverEntry);

if (!hasPrebuiltServer) {
  console.warn('⚠️  Prebuilt MCP server not found at dist/mcp/mcp/server.js.');
  console.warn('    Skipping MCP asset sync. Run "npm run build:mcp" to generate the build.');
  process.exit(0);
}

ensureDir(distMcpDir);

copyDirectory(path.join(rootDir, '.dev', 'lib'), path.join(distMcpDir, 'lib'));
copyDirectory(path.join(rootDir, 'hooks'), path.join(distMcpDir, 'hooks'));
copyToolModules();

function copyToolModules() {
  const toolFiles = ['mcp-registry.js', 'mcp-manager.js', 'mcp-profiles.js', 'mcp-security.js'];

  const sourceDir = path.join(rootDir, '.dev', 'tools');
  const destinationDir = path.join(distMcpDir, 'tools');

  ensureDir(destinationDir);

  for (const file of toolFiles) {
    const sourcePath = path.join(sourceDir, file);
    const destinationPath = path.join(destinationDir, file);

    if (!existsSync(sourcePath)) {
      console.warn(`Missing MCP tool module during copy: ${sourcePath}`);
      continue;
    }

    copyFileSync(sourcePath, destinationPath);
  }
}

/**
 * Ensures a directory exists, creating it recursively if needed
 * @param {string} dirPath - Path to the directory to ensure
 */
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Recursively copies a directory and its contents
 * Skips symbolic links for security and to avoid circular references.
 * This is intentional as build artifacts should not contain symlinks.
 * @param {string} source - Source directory path
 * @param {string} destination - Destination directory path
 */
function copyDirectory(source, destination) {
  if (!existsSync(source)) {
    console.warn(`Source directory not found: ${source}`);
    return;
  }

  ensureDir(destination);

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, destinationPath);
    } else if (entry.isSymbolicLink()) {
      // Intentionally skipping symlinks to avoid circular references
      // and because build artifacts should not contain symlinks
      console.warn(`Skipping symbolic link during copy: ${sourcePath}`);
    }
  }
}
