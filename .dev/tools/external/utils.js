'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const yaml = require('js-yaml');

const execFileAsync = promisify(execFile);

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_MANIFEST = path.join(
  ROOT_DIR,
  'expansion-packs',
  'external-integrations',
  'manifest.yaml',
);

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'dist',
  'build',
  'out',
  '.turbo',
]);

const DEFAULT_EXTENSIONS = new Set(['.md', '.markdown', '.yaml', '.yml', '.json']);

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function loadManifest(manifestPath = DEFAULT_MANIFEST) {
  const resolvedPath = path.resolve(manifestPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`External integrations manifest not found at ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const manifest = yaml.load(raw, { json: true });

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('External integrations manifest is not a valid object.');
  }

  if (!Array.isArray(manifest.sources)) {
    throw new Error('External integrations manifest is missing the sources array.');
  }

  return {
    ...manifest,
    sources: manifest.sources.map((source) => ({
      ...source,
      id: String(source.id),
    })),
    manifestPath: resolvedPath,
  };
}

function resolveSource(manifest, sourceId) {
  return manifest.sources.find((source) => source.id === sourceId);
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function startCase(value) {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function extractFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { metadata: {}, body: content };
  }

  const matcher = /\n---\s*(?:\r?\n|$)/g;
  matcher.lastIndex = 0;
  const closingIndex = matcher.exec(content);

  if (!closingIndex) {
    return { metadata: {}, body: content };
  }

  const metadataSource = content.slice(3, closingIndex.index);
  const body = content.slice(matcher.lastIndex);

  let metadata = {};
  try {
    metadata = yaml.load(metadataSource, { json: true }) || {};
  } catch (error) {
    metadata = {
      __parseError: `Failed to parse frontmatter: ${error.message}`,
    };
  }

  return { metadata, body };
}

function normaliseWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function toPlaintext(markdown) {
  return normaliseWhitespace(
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/<[^>]+>/g, ' '),
  );
}

function summariseContent(content, limit = 180) {
  const plain = toPlaintext(content).slice(0, limit + 1);
  if (plain.length <= limit) {
    return plain;
  }
  return `${plain.slice(0, limit).trimEnd()}…`;
}

function inferArtifactType(relativePath, metadata = {}, extension = '') {
  const lowerPath = relativePath.toLowerCase();
  const typeFromMetadata = metadata.type || metadata.kind || metadata.category;
  if (typeFromMetadata) {
    return String(typeFromMetadata).toLowerCase();
  }

  if (lowerPath.includes('persona')) {
    return 'persona';
  }

  if (lowerPath.includes('workflow')) {
    return 'workflow';
  }

  if (lowerPath.includes('task')) {
    return 'task';
  }

  if (lowerPath.includes('component')) {
    return 'component';
  }

  if (lowerPath.includes('credential')) {
    return 'credential';
  }

  if (lowerPath.includes('policy')) {
    return 'policy';
  }

  if (lowerPath.includes('recipe')) {
    return 'recipe';
  }

  if (lowerPath.includes('prompt')) {
    return 'prompt';
  }

  if (['.yaml', '.yml'].includes(extension) && lowerPath.includes('manifest')) {
    return 'manifest';
  }

  if (['.json', '.yaml', '.yml'].includes(extension) && lowerPath.includes('registry')) {
    return 'registry';
  }

  return 'file';
}

function inferName(relativePath, metadata = {}) {
  if (metadata.name || metadata.title) {
    return metadata.name || metadata.title;
  }
  if (metadata.id) {
    return startCase(metadata.id);
  }
  const base = path.basename(relativePath, path.extname(relativePath));
  return startCase(base);
}

function inferId(relativePath, metadata = {}) {
  if (metadata.id) {
    return slugify(metadata.id);
  }
  if (metadata.slug) {
    return slugify(metadata.slug);
  }
  if (metadata.name || metadata.title) {
    return slugify(metadata.name || metadata.title);
  }
  const base = path.basename(relativePath, path.extname(relativePath));
  return slugify(base);
}

function inferTags(relativePath, metadata = {}) {
  const tags = new Set();
  if (Array.isArray(metadata.tags)) {
    for (const tag of metadata.tags) {
      if (tag) {
        tags.add(String(tag));
      }
    }
  }
  if (metadata.tag) {
    tags.add(String(metadata.tag));
  }
  const directories = path.dirname(relativePath).split(path.sep).filter(Boolean);
  for (const directory of directories) {
    if (directory.length <= 1) {
      continue;
    }
    tags.add(directory.replace(/[^a-z0-9-]+/gi, '-').toLowerCase());
  }
  return Array.from(tags);
}

function inferCategories(relativePath) {
  return path.dirname(relativePath).split(path.sep).filter(Boolean);
}

async function collectArtifacts(sourceDirectory, options = {}) {
  const allowedExtensions = options.allowedExtensions
    ? new Set(options.allowedExtensions.map((ext) => ext.toLowerCase()))
    : DEFAULT_EXTENSIONS;

  const artifacts = [];
  const diagnostics = [];

  async function walk(currentDirectory) {
    let entries;
    try {
      entries = await fsp.readdir(currentDirectory, { withFileTypes: true });
    } catch (error) {
      diagnostics.push({
        severity: 'error',
        message: `Failed to read directory ${path.relative(sourceDirectory, currentDirectory) || '.'}: ${error.message}`,
      });
      return;
    }

    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(extension)) {
        continue;
      }

      const relativePath = path.relative(sourceDirectory, entryPath);
      if (options.filter && !options.filter(relativePath, entryPath)) {
        continue;
      }

      let content;
      try {
        content = await fsp.readFile(entryPath, 'utf8');
      } catch (error) {
        diagnostics.push({
          severity: 'error',
          message: `Failed to read file ${relativePath}: ${error.message}`,
        });
        continue;
      }

      let metadata = {};
      let body = content;

      if (extension === '.json') {
        try {
          metadata = JSON.parse(content);
        } catch (error) {
          diagnostics.push({
            severity: 'error',
            message: `Failed to parse JSON ${relativePath}: ${error.message}`,
          });
          continue;
        }
      } else if (extension === '.yaml' || extension === '.yml') {
        try {
          metadata = yaml.load(content, { json: true }) || {};
        } catch (error) {
          diagnostics.push({
            severity: 'error',
            message: `Failed to parse YAML ${relativePath}: ${error.message}`,
          });
          continue;
        }
      } else {
        const frontmatter = extractFrontmatter(content);
        metadata = frontmatter.metadata || {};
        body = frontmatter.body;
      }

      const type = inferArtifactType(relativePath, metadata, extension);
      const name = inferName(relativePath, metadata);
      const id = inferId(relativePath, metadata);
      const summary = summariseContent(body);
      const tags = inferTags(relativePath, metadata);
      const categories = inferCategories(relativePath);
      const hash = crypto.createHash('sha1').update(content).digest('hex').slice(0, 12);

      const record = {
        id,
        name,
        type,
        relativePath,
        extension,
        hash,
        summary,
        tags,
        categories,
      };

      if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
        record.metadata = metadata;
      }

      artifacts.push(record);
    }
  }

  await walk(sourceDirectory);

  artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return { artifacts, diagnostics };
}

async function detectGitMetadata(directory) {
  const gitDirectory = path.join(directory, '.git');
  if (!(await pathExists(gitDirectory))) {
    return null;
  }

  try {
    const [{ stdout: head }, { stdout: branch }, remote] = await Promise.all([
      execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: directory }),
      execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: directory }),
      execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd: directory }).catch(() => ({
        stdout: '',
      })),
    ]);

    return {
      commit: head.trim(),
      branch: branch.trim(),
      remote: remote.stdout.trim() || null,
    };
  } catch (error) {
    return {
      error: `Failed to read git metadata: ${error.message}`,
    };
  }
}

async function writeJsonFile(targetPath, data, { pretty = true } = {}) {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await fsp.writeFile(targetPath, `${json}\n`, 'utf8');
}

module.exports = {
  ROOT_DIR,
  DEFAULT_MANIFEST,
  collectArtifacts,
  detectGitMetadata,
  ensureDirectory,
  loadManifest,
  pathExists,
  resolveSource,
  slugify,
  writeJsonFile,
};
