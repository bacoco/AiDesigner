import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ProjectState } = require('../lib/project-state.js');

const DEFAULT_MODE = 'batch';
const VALID_MODES = new Set(['step', 'batch', 'yolo']);

const toPosix = (value) => value.replaceAll('\\', '/');

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const resolveProjectPath = (projectRoot, candidate) => {
  if (!candidate) {
    return null;
  }

  const resolved = path.isAbsolute(candidate)
    ? candidate
    : path.join(projectRoot, candidate);

  // Prevent path traversal attacks using proper relative path checks
  const normalizedRoot = path.resolve(projectRoot);
  const normalized = path.resolve(resolved);
  const rel = path.relative(normalizedRoot, normalized);

  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path traversal detected: ${candidate}`);
  }

  // Return normalized path; callers handle missing files
  return normalized;
};

const parseArgs = (argv = []) => {
  const options = {
    input: null,
    project: process.cwd(),
    output: null,
    mode: DEFAULT_MODE,
    packId: null,
  };

  const rest = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--input' || arg === '-i') {
      options.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--project') {
      options.project = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--output' || arg === '-o') {
      options.output = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--mode') {
      options.mode = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--pack-id') {
      options.packId = argv[index + 1];
      index += 1;
      continue;
    }

    rest.push(arg);
  }

  return { options, rest };
};

const readJsonIfExists = async (filePath) => {
  if (!(await pathExists(filePath))) {
    return null;
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      throw new TypeError('Invalid JSON format: expected an object');
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON from ${filePath}: ${error.message}`);
    }
    throw error;
  }
};

const readTextIfExists = async (filePath) => {
  if (!(await pathExists(filePath))) {
    return null;
  }

  return fs.readFile(filePath, 'utf8');
};

const extractTaskRecords = (detail) => {
  if (!detail) {
    return [];
  }

  if (Array.isArray(detail)) {
    return detail;
  }

  if (Array.isArray(detail.tasks)) {
    return detail.tasks;
  }

  if (Array.isArray(detail.items)) {
    return detail.items;
  }

  if (Array.isArray(detail.entries)) {
    return detail.entries;
  }

  if (typeof detail === 'object') {
    const values = Object.values(detail).filter((value) => Array.isArray(value));
    if (values.length === 1) {
      return values[0];
    }
  }

  return [];
};

const escapeRegExp = (value) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const extractMarkdownSnippet = (markdown, identifier, fallback) => {
  if (!markdown) {
    return fallback || null;
  }

  if (!identifier) {
    return fallback || markdown.slice(0, 400).trim();
  }

  const escaped = escapeRegExp(identifier);
  const sectionPattern = new RegExp(
    String.raw`^##[^\n]*${escaped}[^\n]*\n([^]*?)(?=^## |\n?^---|\n?^# |\n?$)`,
    'gmi',
  );
  const sectionMatch = sectionPattern.exec(markdown);

  if (sectionMatch && sectionMatch[0]) {
    return sectionMatch[0].trim();
  }

  const index = markdown.toLowerCase().indexOf(String(identifier).toLowerCase());
  if (index !== -1) {
    return markdown.slice(index, index + 400).trim();
  }

  return fallback || null;
};

const inferLane = (task, selectors) => {
  const textParts = [
    task.category,
    task.action,
    task.intent,
    task.type,
    task.label,
    Array.isArray(task.labels) ? task.labels.join(' ') : null,
    task.summary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const selectorString = selectors.join(' ').toLowerCase();

  if (textParts.includes('copy') || textParts.includes('content') || textParts.includes('tone')) {
    return 'copy-edit';
  }

  if (
    textParts.includes('style') ||
    textParts.includes('ux') ||
    textParts.includes('ui') ||
    textParts.includes('design') ||
    selectorString.includes('color') ||
    selectorString.includes('font') ||
    selectorString.includes('padding')
  ) {
    return 'ui-tuning';
  }

  return 'engineering-fix';
};

const uniqueArray = (values) => {
  const set = new Set();
  const results = [];

  for (const value of values) {
    if (!value || typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || set.has(trimmed)) {
      continue;
    }
    set.add(trimmed);
    results.push(trimmed);
  }

  return results;
};

const collectSelectorValues = (task) => {
  const selectors = [];

  if (Array.isArray(task.selectors)) {
    selectors.push(...task.selectors);
  }

  if (Array.isArray(task.selector)) {
    selectors.push(...task.selector);
  }

  if (typeof task.selector === 'string') {
    selectors.push(task.selector);
  }

  if (task.domPath) {
    selectors.push(task.domPath);
  }

  if (task.cssSelector) {
    selectors.push(task.cssSelector);
  }

  return uniqueArray(selectors);
};

const collectReferenceLinks = (task) => {
  const references = [];

  if (Array.isArray(task.links)) {
    references.push(...task.links);
  }

  if (Array.isArray(task.references)) {
    references.push(...task.references);
  }

  if (task.url) {
    references.push(task.url);
  }

  if (task.link) {
    references.push(task.link);
  }

  return uniqueArray(references);
};

const normaliseScreenshotCandidates = (task) => {
  const candidates = [];

  const push = (value) => {
    if (typeof value === 'string' && value.trim()) {
      candidates.push(value.trim());
    }
  };

  push(task.screenshot);
  push(task.screenshotPath);
  push(task.image);
  push(task.imagePath);
  push(task.asset);

  if (Array.isArray(task.screenshots)) {
    for (const item of task.screenshots) {
      push(item);
    }
  }

  if (task.assets && typeof task.assets === 'object') {
    for (const value of Object.values(task.assets)) {
      push(value);
    }
  }

  return candidates;
};

const findScreenshotForTask = (task, screenshotDir, fallbackId) => {
  if (!screenshotDir || !fsSync.existsSync(screenshotDir)) {
    return null;
  }

  const screenshotsRoot = path.resolve(screenshotDir);
  const candidates = normaliseScreenshotCandidates(task);

  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate)
      ? path.resolve(candidate)
      : path.resolve(screenshotsRoot, candidate);

    // Ensure resolved path is within screenshotsRoot
    const rel = path.relative(screenshotsRoot, resolved);
    const withinBase = !rel.startsWith('..') && !path.isAbsolute(rel);

    if (withinBase && fsSync.existsSync(resolved)) {
      return resolved;
    }

    // Try with just the basename
    const basenameCandidate = path.resolve(screenshotsRoot, path.basename(candidate));
    const basenameRel = path.relative(screenshotsRoot, basenameCandidate);
    const basenameWithinBase = !basenameRel.startsWith('..') && !path.isAbsolute(basenameRel);

    if (basenameWithinBase && fsSync.existsSync(basenameCandidate)) {
      return basenameCandidate;
    }
  }

  if (fallbackId) {
    try {
      const files = fsSync.readdirSync(screenshotDir);
      const match = files.find((file) =>
        file.toLowerCase().includes(String(fallbackId).toLowerCase()),
      );
      if (match) {
        const matchedPath = path.resolve(screenshotsRoot, match);
        const matchedRel = path.relative(screenshotsRoot, matchedPath);
        const matchedWithinBase = !matchedRel.startsWith('..') && !path.isAbsolute(matchedRel);

        if (matchedWithinBase) {
          return matchedPath;
        }
      }
    } catch {
      // ignore directory read errors
    }
  }

  return null;
};

const normaliseTasks = (detail, markdown, screenshotDir) => {
  const rawTasks = extractTaskRecords(detail);

  return rawTasks.map((task, index) => {
    const taskId = task.id || task.taskId || task.key || `task-${index + 1}`;
    const selectors = collectSelectorValues(task);
    const references = collectReferenceLinks(task);
    const lane = inferLane(task, selectors);
    const markdownExcerpt = extractMarkdownSnippet(
      markdown,
      taskId,
      task.comment || task.summary || null,
    );
    const screenshotPath = findScreenshotForTask(task, screenshotDir, taskId);

    return {
      id: taskId,
      summary: task.summary || task.title || task.comment || 'Visual feedback item',
      description: task.description || task.details || null,
      action: task.action || task.intent || null,
      severity: task.severity || task.level || null,
      status: task.status || task.state || 'pending',
      selectors,
      references,
      markdownExcerpt,
      lane,
      raw: task,
      screenshotPath,
    };
  });
};

const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const sanitiseForFilename = (value) =>
  String(value || 'asset')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 60) || 'asset';

const copyScreenshots = async (tasks, packDir, projectRoot) => {
  const screenshotsDir = path.join(packDir, 'screenshots');
  await ensureDirectory(screenshotsDir);

  const updated = [];
  const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  for (const task of tasks) {
    if (!task.screenshotPath || !fsSync.existsSync(task.screenshotPath)) {
      updated.push({ ...task, screenshot: null });
      continue;
    }

    try {
      // Validate file extension
      const extension = path.extname(task.screenshotPath).toLowerCase() || '.png';
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        console.error(`⚠️ Skipping invalid file type: ${task.screenshotPath}`);
        updated.push({ ...task, screenshot: null });
        continue;
      }

      // Validate file size
      const stats = fsSync.statSync(task.screenshotPath);
      if (stats.size > MAX_FILE_SIZE) {
        console.error(`⚠️ Skipping file exceeding size limit: ${task.screenshotPath}`);
        updated.push({ ...task, screenshot: null });
        continue;
      }

      const safeName = sanitiseForFilename(task.id || task.raw?.id || 'feedback');
      const filename = `${safeName}${extension}`;
      const destination = path.join(screenshotsDir, filename);

      await fs.copyFile(task.screenshotPath, destination);

      updated.push({
        ...task,
        screenshot: toPosix(path.relative(projectRoot, destination)),
      });
    } catch (error) {
      console.error(`⚠️ Failed to copy screenshot ${task.screenshotPath}: ${error.message}`);
      updated.push({ ...task, screenshot: null });
    }
  }

  return updated;
};

const summariseStats = (tasks) => ({
  total: tasks.length,
  withScreenshots: tasks.filter((task) => Boolean(task.screenshot)).length,
  withoutScreenshots: tasks.filter((task) => !task.screenshot).length,
  withSelectors: tasks.filter((task) => task.selectors.length > 0).length,
});

const escapeTableCell = (value) => value.replaceAll('|', String.raw`\|`);

const renderPrdSection = (packId, mode, stats, tasks) => {
  const lines = [];

  lines.push(
    `### Drawbridge Visual Feedback (${packId})`,
    '',
    `- Mode: \`${mode}\``,
    `- Total annotations: ${stats.total}`,
    `- With selectors: ${stats.withSelectors}`,
    `- With screenshots: ${stats.withScreenshots}`,
    '',
  );

  if (tasks.length === 0) {
    lines.push('_No Drawbridge annotations processed in this batch._');
    return lines.join('\n');
  }

  lines.push('| ID | Summary | Lane | Status | Screenshot |', '| --- | --- | --- | --- | --- |');

  for (const task of tasks) {
    const screenshotCell = task.screenshot
      ? `[${path.basename(task.screenshot)}](${toPosix(task.screenshot)})`
      : '—';
    const summaryCell = escapeTableCell(task.summary.replaceAll(/\n+/g, ' '));
    lines.push(
      `| ${task.id || '—'} | ${summaryCell} | ${task.lane || '—'} | ${task.status || 'pending'} | ${screenshotCell} |`,
    );
  }

  lines.push('', '#### Selector Routing Notes', '');

  for (const task of tasks) {
    lines.push(
      `- **${task.id || task.summary}** → selectors: ${task.selectors.join(', ') || 'none'}`,
    );
  }

  return lines.join('\n');
};

const updatePrdDocument = async (projectRoot, tasks, packId, mode, stats) => {
  const prdPath = path.join(projectRoot, 'docs', 'prd.md');
  if (!(await pathExists(prdPath))) {
    return null;
  }

  const startMarker = '<!-- DRAWBRIDGE_FEEDBACK_START -->';
  const endMarker = '<!-- DRAWBRIDGE_FEEDBACK_END -->';
  const section = renderPrdSection(packId, mode, stats, tasks);

  let content = await fs.readFile(prdPath, 'utf8');
  const block = `${startMarker}\n${section}\n${endMarker}`;

  if (content.includes(startMarker) && content.includes(endMarker)) {
    const pattern = new RegExp(
      String.raw`${escapeRegExp(startMarker)}[^]*?${escapeRegExp(endMarker)}`,
      'gm',
    );
    content = content.replace(pattern, block);
  } else {
    content = `${content.trim()}\n\n${block}\n`;
  }

  await fs.writeFile(prdPath, content, 'utf8');
  return prdPath;
};

const renderArchitectureDoc = (projectRoot, tasks, mode, stats) => {
  const lines = [
    '# Drawbridge Visual Feedback Mapping',
    '',
    `Generated for mode \`${mode}\` with ${stats.total} annotations.`,
    '',
    '| ID | Lane | Selectors | Action | Severity | Screenshot |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const task of tasks) {
    const screenshotCell = task.screenshot
      ? `[${path.basename(task.screenshot)}](${toPosix(
          path.relative(
            path.join(projectRoot, 'docs', 'implementation'),
            path.join(projectRoot, task.screenshot),
          ),
        )})`
      : '—';

    lines.push(
      `| ${task.id || '—'} | ${task.lane || '—'} | ${
        task.selectors.join('<br>') || '—'
      } | ${task.action || '—'} | ${task.severity || '—'} | ${screenshotCell} |`,
    );
  }

  lines.push('', '## Annotation Details', '');

  for (const task of tasks) {
    const detailLines = [
      `### ${task.id || task.summary}`,
      '',
      `- **Summary:** ${task.summary}`,
      `- **Lane:** ${task.lane || '—'}`,
      `- **Status:** ${task.status || 'pending'}`,
      `- **Selectors:** ${task.selectors.join(', ') || '—'}`,
      `- **References:** ${task.references.join(', ') || '—'}`,
    ];

    if (task.markdownExcerpt) {
      detailLines.push('', task.markdownExcerpt);
    }

    detailLines.push('');
    lines.push(...detailLines);
  }

  return lines.join('\n');
};

const writeArchitectureDoc = async (projectRoot, tasks, mode, stats) => {
  const implementationDir = path.join(projectRoot, 'docs', 'implementation');
  await ensureDirectory(implementationDir);
  const docPath = path.join(implementationDir, 'drawbridge-visual-feedback.md');
  const content = renderArchitectureDoc(projectRoot, tasks, mode, stats);
  await fs.writeFile(docPath, content, 'utf8');
  return docPath;
};

const updateContextIndex = async (indexPath, packRecord) => {
  let existing = [];

  if (await pathExists(indexPath)) {
    const raw = await fs.readFile(indexPath, 'utf8');
    try {
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) {
        existing = [];
      }
    } catch {
      existing = [];
    }
  }

  const filtered = existing.filter((record) => record.packId !== packRecord.packId);
  filtered.unshift({
    packId: packRecord.packId,
    generatedAt: packRecord.generatedAt,
    mode: packRecord.mode,
    stats: packRecord.stats,
    packPath: packRecord.packPath,
  });

  await fs.writeFile(indexPath, JSON.stringify(filtered, null, 2), 'utf8');
};

const main = async () => {
  const { options } = parseArgs(process.argv.slice(2));

  if (!options.input) {
    throw new Error('Missing required --input argument pointing to a Drawbridge export directory');
  }

  if (options.mode && !VALID_MODES.has(options.mode)) {
    throw new Error(`Invalid --mode value. Expected one of: ${[...VALID_MODES].join(', ')}`);
  }

  const projectRoot = path.resolve(options.project || process.cwd());
  const inputDir = resolveProjectPath(projectRoot, options.input);

  if (!(await pathExists(inputDir))) {
    throw new Error(`Unable to locate Drawbridge export at: ${inputDir}`);
  }

  const detailPath = path.join(inputDir, 'moat-tasks-detail.json');
  const markdownPath = path.join(inputDir, 'moat-tasks.md');
  const screenshotsDir = path.join(inputDir, 'screenshots');

  const detail = await readJsonIfExists(detailPath);
  const markdown = await readTextIfExists(markdownPath);

  if (!detail && !markdown) {
    throw new Error('Drawbridge export is missing moat-tasks-detail.json and moat-tasks.md');
  }

  const tasks = normaliseTasks(detail, markdown, screenshotsDir);
  const mode = options.mode || DEFAULT_MODE;

  const packBaseDir = options.output
    ? resolveProjectPath(projectRoot, options.output)
    : path.join(projectRoot, '.aidesigner', 'drawbridge', 'context-packs');
  await ensureDirectory(packBaseDir);

  const packId = options.packId || `drawbridge-pack-${Date.now()}`;
  const packDir = path.join(packBaseDir, packId);
  await ensureDirectory(packDir);

  const tasksWithAssets = await copyScreenshots(tasks, packDir, projectRoot);
  const stats = summariseStats(tasksWithAssets);

  const packPayload = {
    packId,
    generatedAt: new Date().toISOString(),
    mode,
    stats,
    tasks: tasksWithAssets.map((task) => ({
      id: task.id,
      summary: task.summary,
      description: task.description,
      action: task.action,
      severity: task.severity,
      status: task.status,
      selectors: task.selectors,
      references: task.references,
      screenshot: task.screenshot,
      markdownExcerpt: task.markdownExcerpt,
      lane: task.lane,
    })),
    source: {
      exportRoot: toPosix(path.relative(projectRoot, inputDir)),
      detail: (await pathExists(detailPath))
        ? toPosix(path.relative(projectRoot, detailPath))
        : null,
      markdown: (await pathExists(markdownPath))
        ? toPosix(path.relative(projectRoot, markdownPath))
        : null,
    },
  };

  const packPath = path.join(packDir, 'pack.json');
  await fs.writeFile(packPath, JSON.stringify(packPayload, null, 2), 'utf8');

  const indexPath = path.join(packBaseDir, 'index.json');
  await updateContextIndex(indexPath, {
    packId,
    generatedAt: packPayload.generatedAt,
    mode,
    stats,
    packPath: toPosix(path.relative(projectRoot, packPath)),
  });

  const prdPath = await updatePrdDocument(projectRoot, tasksWithAssets, packId, mode, stats);
  const architectureDocPath = await writeArchitectureDoc(projectRoot, tasksWithAssets, mode, stats);

  const projectState = new ProjectState(projectRoot);
  await projectState.initialize();
  await projectState.recordDrawbridgeIngestion({
    packId,
    mode,
    tasks: packPayload.tasks,
    stats,
    source: packPayload.source,
    metadata: {
      contextPack: toPosix(path.relative(projectRoot, packPath)),
      index: toPosix(path.relative(projectRoot, indexPath)),
    },
    docs: {
      prd: prdPath ? toPosix(path.relative(projectRoot, prdPath)) : null,
      architecture: architectureDocPath
        ? toPosix(path.relative(projectRoot, architectureDocPath))
        : null,
    },
  });

  console.log('✅ Drawbridge context pack generated');
  console.log(`   Pack ID: ${packId}`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Tasks: ${stats.total}`);
  console.log(`   With selectors: ${stats.withSelectors}`);
  console.log(`   Pack saved to: ${packPath}`);

  if (prdPath) {
    console.log(`   PRD updated: ${prdPath}`);
  } else {
    console.log('   ⚠️ PRD not found, skipped documentation update.');
  }

  console.log(`   Architecture doc: ${architectureDocPath}`);
  console.log(`   Index updated: ${indexPath}`);
};

try {
  await main();
} catch (error) {
  console.error(`❌ Error: ${error.message || error}`);
  if (error.stack && process.env.DEBUG) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exitCode = 1;
}
