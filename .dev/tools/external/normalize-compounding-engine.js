#!/usr/bin/env node

'use strict';

const path = require('node:path');
const { parseArgs } = require('node:util');
const chalk = (() => {
  try {
    return require('chalk');
  } catch {
    return new Proxy(
      {},
      {
        get: () => (value) => value,
      },
    );
  }
})();

const {
  ROOT_DIR,
  DEFAULT_MANIFEST,
  collectArtifacts,
  detectGitMetadata,
  ensureDirectory,
  loadManifest,
  pathExists,
  resolveSource,
  writeJsonFile,
} = require('./utils');

function formatCount(label, count) {
  const suffix = count === 1 ? '' : 's';
  return `${count} ${label}${suffix}`;
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      source: { type: 'string', default: 'compounding-engine' },
      output: { type: 'string' },
      dryRun: { type: 'boolean', default: false },
      compact: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
    allowPositionals: false,
    args: rawArgs,
  });

  const manifestPath = values.manifest || DEFAULT_MANIFEST;
  const manifest = loadManifest(manifestPath);
  const sourceId = values.source || 'compounding-engine';
  const source = resolveSource(manifest, sourceId);

  if (!source) {
    console.error(chalk.red(`Source ${sourceId} not found in manifest ${manifestPath}`));
    process.exitCode = 1;
    return;
  }

  if (!source.targetDirectory) {
    console.error(chalk.red(`Source ${sourceId} is missing a targetDirectory in the manifest.`));
    process.exitCode = 1;
    return;
  }

  const sourceDirectory = path.resolve(ROOT_DIR, source.targetDirectory);
  const outputPath = path.resolve(
    ROOT_DIR,
    values.output ||
      path.join('expansion-packs', 'external-integrations', 'generated', sourceId, 'registry.json'),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      id: source.id,
      name: source.name,
      repository: source.repository || null,
      targetDirectory: path.relative(ROOT_DIR, sourceDirectory),
    },
    status: 'ok',
    stats: {
      totalArtifacts: 0,
      personas: 0,
      workflows: 0,
      tasks: 0,
      registries: 0,
      policies: 0,
    },
    personas: [],
    workflows: [],
    tasks: [],
    registries: [],
    policies: [],
    files: [],
    diagnostics: [],
  };

  const directoryExists = await pathExists(sourceDirectory);
  if (!directoryExists) {
    report.status = 'missing-source-directory';
    report.diagnostics.push({
      severity: 'error',
      message: `Source directory ${report.source.targetDirectory} does not exist. Run sync tooling first.`,
    });
  } else {
    const expectedSubdirectories = ['personas', 'workflows', 'tasks'];
    for (const subdirectory of expectedSubdirectories) {
      const target = path.join(sourceDirectory, subdirectory);
      const exists = await pathExists(target);
      if (!exists) {
        report.diagnostics.push({
          severity: 'warning',
          message: `Expected subdirectory ${path.relative(ROOT_DIR, target)} is missing.`,
        });
      }
    }

    const { artifacts, diagnostics } = await collectArtifacts(sourceDirectory);
    report.files = artifacts;
    report.diagnostics.push(...diagnostics);
    report.stats.totalArtifacts = artifacts.length;

    const personas = artifacts.filter((artifact) => artifact.type === 'persona');
    const workflows = artifacts.filter((artifact) => artifact.type === 'workflow');
    const tasks = artifacts.filter((artifact) => artifact.type === 'task');
    const registries = artifacts.filter((artifact) => artifact.type === 'registry');
    const policies = artifacts.filter((artifact) => artifact.type === 'policy');

    report.stats.personas = personas.length;
    report.stats.workflows = workflows.length;
    report.stats.tasks = tasks.length;
    report.stats.registries = registries.length;
    report.stats.policies = policies.length;

    report.personas = personas.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      metadata: artifact.metadata,
    }));
    report.workflows = workflows.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      metadata: artifact.metadata,
    }));
    report.tasks = tasks.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      metadata: artifact.metadata,
    }));
    report.registries = registries.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      path: artifact.relativePath,
      metadata: artifact.metadata,
    }));
    report.policies = policies.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      path: artifact.relativePath,
      metadata: artifact.metadata,
    }));

    const gitMetadata = await detectGitMetadata(sourceDirectory);
    if (gitMetadata) {
      report.git = gitMetadata;
    }
  }

  if (values.verbose) {
    console.log(chalk.gray(`Manifest: ${manifestPath}`));
    console.log(chalk.gray(`Source directory: ${path.relative(ROOT_DIR, sourceDirectory)}`));
    console.log(chalk.gray(`Output: ${path.relative(ROOT_DIR, outputPath)}`));
  }

  if (report.files.length > 0) {
    console.log(
      chalk.green(
        `Discovered ${formatCount('artifact', report.stats.totalArtifacts)} · ${formatCount('persona', report.stats.personas)} · ${formatCount('workflow', report.stats.workflows)} · ${formatCount('task', report.stats.tasks)}`,
      ),
    );
  } else {
    console.log(chalk.yellow('No artifacts discovered for compounding engine source.'));
  }

  for (const diagnostic of report.diagnostics) {
    const colour =
      diagnostic.severity === 'error'
        ? chalk.red
        : diagnostic.severity === 'warning'
          ? chalk.yellow
          : chalk.gray;
    console.log(colour(`${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`));
  }

  const dryRun = values.dryRun ?? false;

  if (!dryRun) {
    ensureDirectory(path.dirname(outputPath));
    await writeJsonFile(outputPath, report, { pretty: !values.compact });
    console.log(chalk.blue(`Wrote registry to ${path.relative(ROOT_DIR, outputPath)}`));
  } else {
    console.log(chalk.gray('Dry run enabled – skipping registry write.'));
  }

  if (report.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(chalk.red(error.stack || error.message));
  process.exitCode = 1;
});
