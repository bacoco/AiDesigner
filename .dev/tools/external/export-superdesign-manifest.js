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

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      source: { type: 'string', default: 'superdesign' },
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
  const sourceId = values.source || 'superdesign';
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
      path.join(
        'expansion-packs',
        'external-integrations',
        'generated',
        sourceId,
        'asset-manifest.json',
      ),
  );

  const manifestReport = {
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
      recipes: 0,
      prompts: 0,
      assets: 0,
      palettes: 0,
    },
    recipes: [],
    prompts: [],
    assets: [],
    palettes: [],
    diagnostics: [],
  };

  const directoryExists = await pathExists(sourceDirectory);
  if (!directoryExists) {
    manifestReport.status = 'missing-source-directory';
    manifestReport.diagnostics.push({
      severity: 'error',
      message: `Source directory ${manifestReport.source.targetDirectory} does not exist. Run sync tooling first.`,
    });
  } else {
    const { artifacts, diagnostics } = await collectArtifacts(sourceDirectory);
    manifestReport.diagnostics.push(...diagnostics);
    manifestReport.stats.totalArtifacts = artifacts.length;

    const recipeArtifacts = artifacts.filter((artifact) => {
      const lower = artifact.relativePath.toLowerCase();
      return artifact.type === 'recipe' || lower.includes('recipe');
    });
    const promptArtifacts = artifacts.filter((artifact) => {
      const lower = artifact.relativePath.toLowerCase();
      return artifact.type === 'prompt' || lower.includes('prompt');
    });
    const assetArtifacts = artifacts.filter((artifact) => {
      const lower = artifact.relativePath.toLowerCase();
      return (
        artifact.type === 'asset' ||
        artifact.type === 'template' ||
        lower.includes('asset') ||
        lower.includes('template')
      );
    });

    const paletteArtifacts = artifacts.filter((artifact) => {
      const lower = artifact.relativePath.toLowerCase();
      return lower.includes('palette') || (artifact.metadata && artifact.metadata.palette);
    });

    manifestReport.stats.recipes = recipeArtifacts.length;
    manifestReport.stats.prompts = promptArtifacts.length;
    manifestReport.stats.assets = assetArtifacts.length;
    manifestReport.stats.palettes = paletteArtifacts.length;

    manifestReport.recipes = recipeArtifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      variants: Array.isArray(artifact.metadata?.variants) ? artifact.metadata.variants : undefined,
    }));

    manifestReport.prompts = promptArtifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      personas: artifact.metadata?.personas,
      guardrails: artifact.metadata?.guardrails,
    }));

    manifestReport.assets = assetArtifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      summary: artifact.summary,
      tags: artifact.tags,
      path: artifact.relativePath,
      output: artifact.metadata?.output,
      resolution: artifact.metadata?.resolution || artifact.metadata?.size,
      format: artifact.metadata?.format,
    }));

    manifestReport.palettes = dedupe(
      paletteArtifacts.flatMap((artifact) => {
        const metadata = artifact.metadata || {};
        if (Array.isArray(metadata.palette)) {
          return metadata.palette;
        }
        if (Array.isArray(metadata.palettes)) {
          return metadata.palettes;
        }
        if (metadata.palette) {
          return [metadata.palette];
        }
        return [];
      }),
    );

    const gitMetadata = await detectGitMetadata(sourceDirectory);
    if (gitMetadata) {
      manifestReport.git = gitMetadata;
    }

    if (
      manifestReport.recipes.length === 0 &&
      manifestReport.prompts.length === 0 &&
      manifestReport.assets.length === 0
    ) {
      manifestReport.diagnostics.push({
        severity: 'warning',
        message:
          'No SuperDesign artifacts detected. Ensure the repository is synced and structured as expected.',
      });
    }
  }

  if (values.verbose) {
    console.log(chalk.gray(`Manifest: ${manifestPath}`));
    console.log(chalk.gray(`Source directory: ${path.relative(ROOT_DIR, sourceDirectory)}`));
    console.log(chalk.gray(`Output: ${path.relative(ROOT_DIR, outputPath)}`));
  }

  console.log(
    chalk.green(
      `SuperDesign manifest summary → ${manifestReport.stats.recipes} recipes · ${manifestReport.stats.prompts} prompts · ${manifestReport.stats.assets} assets`,
    ),
  );

  for (const diagnostic of manifestReport.diagnostics) {
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
    await writeJsonFile(outputPath, manifestReport, { pretty: !values.compact });
    console.log(chalk.blue(`Wrote SuperDesign manifest to ${path.relative(ROOT_DIR, outputPath)}`));
  } else {
    console.log(chalk.gray('Dry run enabled – skipping manifest write.'));
  }

  if (manifestReport.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(chalk.red(error.stack || error.message));
  process.exitCode = 1;
});
