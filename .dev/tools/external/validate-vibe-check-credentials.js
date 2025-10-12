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
  ensureDirectory,
  loadManifest,
  pathExists,
  resolveSource,
  writeJsonFile,
} = require('./utils');

const PLACEHOLDER_PATTERNS = [/changeme/i, /replace/i, /todo/i, /sample/i, /dummy/i];

function extractCredentialPayload(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const candidates = [
    metadata.credentials,
    metadata.credential,
    metadata.auth,
    metadata.secrets,
  ].filter((value) => value && typeof value === 'object');

  if (candidates.length > 0) {
    return candidates[0];
  }

  const fields = {};
  for (const key of Object.keys(metadata)) {
    if (/(client|token|secret|key|credential)/i.test(key)) {
      fields[key] = metadata[key];
    }
  }
  return fields;
}

function normaliseDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function analyseCredentialArtifact(artifact) {
  const metadata = artifact.metadata || {};
  const payload = extractCredentialPayload(metadata);
  const payloadKeys = Object.keys(payload || {});
  const issues = [];

  if (payloadKeys.length === 0) {
    issues.push({ severity: 'error', message: 'No credential payload detected.' });
  }

  const normalisedKeys = payloadKeys.map((key) => key.toLowerCase());
  const hasClientId = normalisedKeys.some((key) => key === 'clientid' || key === 'client_id');
  const hasClientSecret = normalisedKeys.some(
    (key) => key === 'clientsecret' || key === 'client_secret',
  );
  const hasApiKey = normalisedKeys.some((key) => key === 'apikey' || key === 'api_key');
  const hasToken = normalisedKeys.some((key) => key === 'token' || key === 'access_token');

  if (!(hasClientId && hasClientSecret) && !hasApiKey && !hasToken) {
    issues.push({
      severity: 'error',
      message: 'Credential payload is missing client credentials, API key, or token fields.',
    });
  }

  for (const key of payloadKeys) {
    const value = payload[key];
    if (typeof value === 'string' && PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
      issues.push({
        severity: 'error',
        message: `Credential field ${key} contains a placeholder value.`,
      });
    }
  }

  const expiry =
    metadata.expiresAt || metadata.expiry || metadata.expires_on || metadata.expiration;
  const expiryDate = normaliseDate(expiry);
  if (!expiry) {
    issues.push({
      severity: 'warning',
      message: 'Credential metadata does not specify an expiry date.',
    });
  } else if (!expiryDate) {
    issues.push({
      severity: 'error',
      message: `Expiry value "${expiry}" is not a valid ISO-8601 date.`,
    });
  } else if (expiryDate <= new Date()) {
    issues.push({
      severity: 'error',
      message: `Credential expired on ${expiryDate.toISOString()}.`,
    });
  }

  const scopes = metadata.scopes || metadata.scope;
  if (!Array.isArray(scopes) || scopes.length === 0) {
    issues.push({ severity: 'warning', message: 'Scopes are not defined for this credential.' });
  }

  const owner = metadata.owner || metadata.contact || metadata.responsible || null;
  if (!owner) {
    issues.push({
      severity: 'warning',
      message: 'Credential metadata is missing an owner/contact field.',
    });
  }

  const environment = metadata.environment || metadata.env || 'unspecified';

  return {
    environment,
    expiresAt: expiryDate ? expiryDate.toISOString() : null,
    scopes: Array.isArray(scopes) ? scopes : [],
    owner: owner || null,
    fields: payloadKeys,
    issues,
  };
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      source: { type: 'string', default: 'vibe-check' },
      output: { type: 'string' },
      dryRun: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
    allowPositionals: false,
    args: rawArgs,
  });

  const manifestPath = values.manifest || DEFAULT_MANIFEST;
  const manifest = loadManifest(manifestPath);
  const sourceId = values.source || 'vibe-check';
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
        'credential-audit.json',
      ),
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
      totalCredentials: 0,
      errors: 0,
      warnings: 0,
    },
    credentials: [],
    diagnostics: [],
  };

  const directoryExists = await pathExists(sourceDirectory);
  if (!directoryExists) {
    report.status = 'error';
    report.diagnostics.push({
      severity: 'error',
      message: `Source directory ${report.source.targetDirectory} does not exist. Run sync tooling first.`,
    });
  } else {
    const { artifacts, diagnostics } = await collectArtifacts(sourceDirectory, {
      allowedExtensions: ['.json', '.yaml', '.yml', '.md'],
      filter: (relativePath) => {
        const lower = relativePath.toLowerCase();
        return lower.includes('credential') || lower.includes('secret') || lower.includes('token');
      },
    });

    report.diagnostics.push(...diagnostics);
    report.stats.totalArtifacts = artifacts.length;

    if (artifacts.length === 0) {
      report.status = 'error';
      report.diagnostics.push({
        severity: 'error',
        message: 'No credential artifacts detected inside the Vibe Check integration directory.',
      });
    }

    for (const artifact of artifacts) {
      const analysis = analyseCredentialArtifact(artifact);
      const entry = {
        id: artifact.id,
        name: artifact.name,
        path: artifact.relativePath,
        environment: analysis.environment,
        expiresAt: analysis.expiresAt,
        scopes: analysis.scopes,
        owner: analysis.owner,
        fields: analysis.fields,
        issues: analysis.issues,
      };
      report.credentials.push(entry);
    }

    report.stats.totalCredentials = report.credentials.length;
    for (const credential of report.credentials) {
      for (const issue of credential.issues) {
        if (issue.severity === 'error') {
          report.stats.errors += 1;
        } else if (issue.severity === 'warning') {
          report.stats.warnings += 1;
        }
      }
    }

    if (report.stats.errors > 0) {
      report.status = 'error';
    } else if (report.stats.warnings > 0) {
      report.status = 'warning';
    }
  }

  if (values.verbose) {
    console.log(chalk.gray(`Manifest: ${manifestPath}`));
    console.log(chalk.gray(`Source directory: ${path.relative(ROOT_DIR, sourceDirectory)}`));
    console.log(chalk.gray(`Output: ${path.relative(ROOT_DIR, outputPath)}`));
  }

  console.log(
    chalk.green(
      `Credential audit summary → ${report.stats.totalCredentials} credential files · ${report.stats.errors} errors · ${report.stats.warnings} warnings`,
    ),
  );

  for (const diagnostic of report.diagnostics) {
    const colour =
      diagnostic.severity === 'error'
        ? chalk.red
        : diagnostic.severity === 'warning'
          ? chalk.yellow
          : chalk.gray;
    console.log(colour(`${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`));
  }

  for (const credential of report.credentials) {
    const issues = credential.issues;
    if (issues.length === 0) {
      console.log(chalk.green(`OK ${credential.path}`));
      continue;
    }

    const hasError = issues.some((issue) => issue.severity === 'error');
    const colour = hasError ? chalk.red : chalk.yellow;
    console.log(colour(`${hasError ? 'ERROR' : 'WARN'} ${credential.path}`));
    for (const issue of issues) {
      const issueColour = issue.severity === 'error' ? chalk.red : chalk.yellow;
      console.log(issueColour(`  - ${issue.message}`));
    }
  }

  const dryRun = values.dryRun ?? false;

  if (!dryRun) {
    ensureDirectory(path.dirname(outputPath));
    await writeJsonFile(outputPath, report, { pretty: true });
    console.log(chalk.blue(`Wrote credential audit to ${path.relative(ROOT_DIR, outputPath)}`));
  } else {
    console.log(chalk.gray('Dry run enabled – skipping credential audit write.'));
  }

  if (report.status === 'error') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(chalk.red(error.stack || error.message));
  process.exitCode = 1;
});
