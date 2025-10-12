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

function groupBy(array, selector) {
  const map = new Map();
  for (const item of array) {
    const key = selector(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort());
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      source: { type: 'string', default: 'awesome-ui' },
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
  const sourceId = values.source || 'awesome-ui';
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
        'ui-components.registry.json',
      ),
  );

  const registry = {
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
      totalComponents: 0,
      statuses: {},
      categories: {},
    },
    components: [],
    unmappedArtifacts: [],
    diagnostics: [],
  };

  const directoryExists = await pathExists(sourceDirectory);
  if (!directoryExists) {
    registry.status = 'missing-source-directory';
    registry.diagnostics.push({
      severity: 'error',
      message: `Source directory ${registry.source.targetDirectory} does not exist. Run sync tooling first.`,
    });
  } else {
    const { artifacts, diagnostics } = await collectArtifacts(sourceDirectory);
    registry.diagnostics.push(...diagnostics);
    registry.stats.totalArtifacts = artifacts.length;

    const componentArtifacts = artifacts.filter((artifact) => {
      const lowerPath = artifact.relativePath.toLowerCase();
      return artifact.type === 'component' || lowerPath.includes('component');
    });

    const components = componentArtifacts.map((artifact) => {
      const metadata = artifact.metadata || {};
      const variants = Array.isArray(metadata.variants)
        ? metadata.variants
        : Array.isArray(metadata.states)
          ? metadata.states
          : [];
      const tokens = metadata.tokens || metadata.designTokens || null;
      const documentation = metadata.docs || metadata.documentation || metadata.url || null;
      const accessibility = metadata.accessibility || metadata.a11y || null;
      const category = artifact.categories.join(' / ') || null;
      const status = metadata.status || metadata.lifecycle || 'unknown';

      const entry = {
        id: artifact.id,
        name: artifact.name,
        description: artifact.summary,
        category,
        status,
        tags: artifact.tags,
        sourcePath: artifact.relativePath,
      };

      if (variants.length > 0) {
        entry.variants = variants;
      }
      if (tokens) {
        entry.tokens = tokens;
      }
      if (documentation) {
        entry.documentation = documentation;
      }
      if (accessibility) {
        entry.accessibility = accessibility;
      }
      if (metadata.props) {
        entry.props = metadata.props;
      }
      if (metadata.examples) {
        entry.examples = metadata.examples;
      }

      return entry;
    });

    registry.components = components.sort((a, b) => a.name.localeCompare(b.name));
    registry.stats.totalComponents = registry.components.length;

    registry.stats.statuses = groupBy(
      registry.components,
      (component) => component.status || 'unknown',
    );
    registry.stats.categories = groupBy(
      registry.components,
      (component) => component.category || 'uncategorised',
    );

    const knownComponentPaths = new Set(
      componentArtifacts.map((artifact) => artifact.relativePath),
    );
    registry.unmappedArtifacts = artifacts
      .filter((artifact) => !knownComponentPaths.has(artifact.relativePath))
      .map((artifact) => ({
        path: artifact.relativePath,
        type: artifact.type,
      }));

    const gitMetadata = await detectGitMetadata(sourceDirectory);
    if (gitMetadata) {
      registry.git = gitMetadata;
    }

    if (registry.components.length === 0) {
      registry.diagnostics.push({
        severity: 'warning',
        message: 'No component artifacts detected. Ensure the Awesome UI repository is synced.',
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
      `Component registry summary → ${registry.stats.totalComponents} components · ${Object.keys(registry.stats.statuses).length} statuses · ${Object.keys(registry.stats.categories).length} categories`,
    ),
  );

  for (const diagnostic of registry.diagnostics) {
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
    await writeJsonFile(outputPath, registry, { pretty: !values.compact });
    console.log(chalk.blue(`Wrote component registry to ${path.relative(ROOT_DIR, outputPath)}`));
  } else {
    console.log(chalk.gray('Dry run enabled – skipping registry write.'));
  }

  if (registry.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(chalk.red(error.stack || error.message));
  process.exitCode = 1;
});
