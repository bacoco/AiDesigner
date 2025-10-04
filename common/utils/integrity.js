/* eslint-disable unicorn/prefer-module */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const CRITICAL_PATHS = [
  {
    path: 'bmad-core/core-config.yaml',
    description: 'Core configuration that routes tasks to BMAD lanes',
  },
  {
    path: 'bmad-core/checklists',
    description: 'Safety and quality checklists used across workflows',
  },
  {
    path: 'bmad-core/templates',
    description: 'Primary document and task templates',
  },
  {
    path: 'expansion-packs',
    description: 'Expansion packs shipped with the distribution',
  },
  {
    path: 'codex-config.toml.example',
    description: 'Default Codex CLI configuration template',
  },
];

const BASELINE_FILENAME = 'critical-hashes.json';

const getBaselinePath = (rootDir) => path.join(rootDir, '.agilai', BASELINE_FILENAME);

const computeFileHash = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const shouldSkipFile = (filePath) => {
  const basename = path.basename(filePath);
  return basename === '.DS_Store' || basename === 'Thumbs.db';
};

const walkDirectory = (dirPath, files) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, files);
    } else if (entry.isFile() && !shouldSkipFile(fullPath)) {
      files.push(fullPath);
    }
  }
};

const collectCriticalFiles = (rootDir) => {
  const files = [];
  for (const target of CRITICAL_PATHS) {
    const absolute = path.join(rootDir, target.path);
    if (!fs.existsSync(absolute)) continue;

    const stats = fs.statSync(absolute);
    if (stats.isDirectory()) {
      walkDirectory(absolute, files);
    } else if (stats.isFile() && !shouldSkipFile(absolute)) {
      files.push(absolute);
    }
  }

  const relativeFiles = files
    .map((absolute) => path.relative(rootDir, absolute))
    .sort((a, b) => a.localeCompare(b));

  return relativeFiles;
};

const computeCriticalHashes = (rootDir) => {
  const files = collectCriticalFiles(rootDir);
  const hashes = {};
  for (const relativePath of files) {
    const absolutePath = path.join(rootDir, relativePath);
    hashes[relativePath] = computeFileHash(absolutePath);
  }
  return hashes;
};

const readBaseline = (baselinePath) => {
  const raw = fs.readFileSync(baselinePath, 'utf8');
  return JSON.parse(raw);
};

const loadPackageVersion = (rootDir) => {
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return pkg.version || null;
  } catch {
    return null;
  }
};

const buildBaselinePayload = (rootDir, hashes) => ({
  version: loadPackageVersion(rootDir),
  generatedAt: new Date().toISOString(),
  criticalPaths: CRITICAL_PATHS.map((item) => ({
    path: item.path,
    description: item.description,
  })),
  files: hashes,
});

const writeBaseline = (rootDir, hashes) => {
  const baselinePath = getBaselinePath(rootDir);
  const dir = path.dirname(baselinePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const payload = buildBaselinePayload(rootDir, hashes);
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
  return baselinePath;
};

const ensureBaseline = (rootDir) => {
  const baselinePath = getBaselinePath(rootDir);
  if (!fs.existsSync(baselinePath)) {
    const hashes = computeCriticalHashes(rootDir);
    writeBaseline(rootDir, hashes);
    return { created: true, baselinePath };
  }

  return { created: false, baselinePath };
};

const refreshBaseline = (rootDir) => {
  const hashes = computeCriticalHashes(rootDir);
  const baselinePath = writeBaseline(rootDir, hashes);
  return { baselinePath, hashes };
};

const compareHashes = (baselineHashes, currentHashes) => {
  const changed = [];
  const missing = [];
  const unexpected = [];

  for (const [relativePath, hash] of Object.entries(baselineHashes)) {
    if (!Object.prototype.hasOwnProperty.call(currentHashes, relativePath)) {
      missing.push(relativePath);
      continue;
    }

    if (currentHashes[relativePath] !== hash) {
      changed.push(relativePath);
    }
  }

  for (const [relativePath] of Object.entries(currentHashes)) {
    if (!Object.prototype.hasOwnProperty.call(baselineHashes, relativePath)) {
      unexpected.push(relativePath);
    }
  }

  return { changed, missing, unexpected };
};

const checkForCriticalFileChanges = (rootDir) => {
  const baselinePath = getBaselinePath(rootDir);
  if (!fs.existsSync(baselinePath)) {
    return {
      status: 'missing-baseline',
      baselinePath,
    };
  }

  let baseline;
  try {
    baseline = readBaseline(baselinePath);
  } catch (error) {
    return {
      status: 'invalid-baseline',
      baselinePath,
      error,
    };
  }

  const baselineHashes = baseline?.files ?? {};
  const currentHashes = computeCriticalHashes(rootDir);
  const { changed, missing, unexpected } = compareHashes(baselineHashes, currentHashes);

  return {
    status: 'ok',
    baselinePath,
    changed,
    missing,
    unexpected,
    hasChanges: changed.length > 0 || missing.length > 0,
  };
};

const summariseDifferences = (differences, limit = 5) => {
  const sample = differences.slice(0, limit);
  if (differences.length <= limit) return sample.join(', ');
  return `${sample.join(', ')} … (+${differences.length - limit} more)`;
};

const runIntegrityPreflight = (rootDir, { logger = console, silentOnMatch = true } = {}) => {
  ensureBaseline(rootDir);
  const report = checkForCriticalFileChanges(rootDir);

  if (report.status === 'missing-baseline') {
    logger.warn(
      `⚠️  BMAD safeguard: baseline hashes missing at ${path.relative(rootDir, report.baselinePath)}. ` +
        'Re-run after generating the baseline with `node tools/update-critical-hashes.js`.',
    );
    return report;
  }

  if (report.status === 'invalid-baseline') {
    logger.warn(
      `⚠️  BMAD safeguard: could not read baseline hash file at ${path.relative(rootDir, report.baselinePath)}.`,
    );
    logger.warn(
      '    Resolve JSON errors or regenerate with `node tools/update-critical-hashes.js`.',
    );
    return report;
  }

  if (report.hasChanges || report.unexpected.length > 0) {
    const messages = [];
    if (report.changed.length > 0) {
      messages.push(`changed: ${summariseDifferences(report.changed)}`);
    }
    if (report.missing.length > 0) {
      messages.push(`missing: ${summariseDifferences(report.missing)}`);
    }
    if (report.unexpected.length > 0) {
      messages.push(`new: ${summariseDifferences(report.unexpected)}`);
    }

    logger.warn('⚠️  BMAD safeguard: critical resources diverged from recorded baseline.');
    logger.warn(`    ${messages.join(' | ')}`);
    logger.warn(
      `    Baseline: ${path.relative(rootDir, report.baselinePath)} (update via \`node tools/update-critical-hashes.js\`).`,
    );
    logger.warn('    Review intentional customisations before proceeding.');
  } else if (!silentOnMatch) {
    logger.log('✅ BMAD safeguard: critical resources match recorded baseline.');
  }

  return report;
};

module.exports = {
  BASELINE_FILENAME,
  CRITICAL_PATHS,
  checkForCriticalFileChanges,
  collectCriticalFiles,
  computeCriticalHashes,
  ensureBaseline,
  getBaselinePath,
  refreshBaseline,
  runIntegrityPreflight,
};
