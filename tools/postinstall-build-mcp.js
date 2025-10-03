'use strict';

const { existsSync, mkdirSync, readdirSync, copyFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const distMcpDir = path.join(rootDir, 'dist', 'mcp');

if (existsSync(distMcpDir)) {
  console.log('MCP assets already exist in dist/mcp; skipping postinstall build.');
  process.exit(0);
}

const tscBin = findTscBinary();

if (tscBin) {
  runTsc(tscBin, path.join(rootDir, 'mcp', 'tsconfig.json'));
  runTsc(tscBin, path.join(rootDir, 'tsconfig.codex.json'));
} else {
  console.warn('TypeScript is not installed; skipping MCP TypeScript build.');
}

ensureDir(distMcpDir);

copyDirectory(path.join(rootDir, 'lib'), path.join(distMcpDir, 'lib'));
copyDirectory(path.join(rootDir, 'hooks'), path.join(distMcpDir, 'hooks'));

function findTscBinary() {
  try {
    return require.resolve('typescript/bin/tsc', { paths: [rootDir] });
  } catch {
    return null;
  }
}

function runTsc(tscPath, projectPath) {
  console.log(`Running TypeScript compiler for ${projectPath}`);
  const result = spawnSync(process.execPath, [tscPath, '-p', projectPath], {
    stdio: 'inherit',
    cwd: rootDir,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`TypeScript compilation failed for ${projectPath}`);
  }
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

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
      console.warn(`Skipping symbolic link during copy: ${sourcePath}`);
    }
  }
}
