'use strict';

/**
 * Postinstall script to build MCP (Model Context Protocol) assets.
 * This script compiles TypeScript and copies necessary files to dist/mcp.
 * It exits early if assets already exist (unless --force is used) and
 * gracefully handles missing TypeScript or compilation failures.
 */

const { existsSync, mkdirSync, readdirSync, copyFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const distMcpDir = path.join(rootDir, 'dist', 'mcp');

// Check for --force flag
const forceRebuild = process.argv.includes('--force');

/**
 * Checks if the MCP build is complete by verifying required files exist
 * @returns {boolean} True if all required MCP assets are present
 */
function isMcpBuildComplete() {
  const requiredPaths = [
    path.join(distMcpDir, 'lib'),
    path.join(distMcpDir, 'hooks'),
    path.join(distMcpDir, 'mcp', 'server.js'), // Key output file from TypeScript compilation
  ];
  return requiredPaths.every((p) => existsSync(p));
}

if (existsSync(distMcpDir) && !forceRebuild) {
  if (isMcpBuildComplete()) {
    console.log('✓ MCP assets already exist in dist/mcp, skipping rebuild.');
    console.log('  (Use --force to rebuild anyway)');
    process.exit(0);
  } else {
    console.warn('⚠ Incomplete MCP build detected; rebuilding...');
  }
}

const tscBin = findTscBinary();
let hadCompilationErrors = false;

if (tscBin) {
  hadCompilationErrors = !runTsc(tscBin, path.join(rootDir, 'mcp', 'tsconfig.json')) || hadCompilationErrors;
  hadCompilationErrors =
    !runTsc(tscBin, path.join(rootDir, 'tsconfig.codex.json')) || hadCompilationErrors;

  if (hadCompilationErrors) {
    console.warn('\n⚠️  Some TypeScript compilation issues occurred during postinstall.');
    console.warn('   Run "npm run build:mcp" to see detailed errors.\n');
  }
} else {
  console.warn('TypeScript is not installed; skipping MCP TypeScript build.');
}

ensureDir(distMcpDir);

copyDirectory(path.join(rootDir, 'lib'), path.join(distMcpDir, 'lib'));
copyDirectory(path.join(rootDir, 'hooks'), path.join(distMcpDir, 'hooks'));

/**
 * Attempts to locate the TypeScript compiler binary
 * @returns {string|null} Path to tsc binary, or null if not found
 */
function findTscBinary() {
  try {
    return require.resolve('typescript/bin/tsc', { paths: [rootDir] });
  } catch {
    return null;
  }
}

/**
 * Runs the TypeScript compiler on a specific project configuration
 * @param {string} tscPath - Path to the TypeScript compiler binary
 * @param {string} projectPath - Path to the tsconfig.json file
 * @returns {boolean} True if compilation succeeded, false otherwise
 */
function runTsc(tscPath, projectPath) {
  console.log(`Running TypeScript compiler for ${projectPath}`);
  const result = spawnSync(process.execPath, [tscPath, '-p', projectPath], {
    stdio: 'inherit',
    cwd: rootDir,
  });

  if (result.error) {
    console.warn(`TypeScript compilation error for ${projectPath}:`, result.error.message);
    console.warn('Continuing with postinstall despite compilation error...');
    return false;
  }

  if (result.status !== 0) {
    console.warn(`TypeScript compilation failed for ${projectPath} (exit code ${result.status})`);
    console.warn('Continuing with postinstall, but you may need to run: npm run build:mcp');
    return false;
  }

  return true;
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
