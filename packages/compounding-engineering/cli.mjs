import process from 'node:process';

const DEFAULT_COMMAND = '/create-tasks';

const helpText = `Compounding Engineering CLI\n\nUsage:\n  node packages/compounding-engineering/cli.mjs /create-tasks [--format json]\n\nDescription:\n  Reads a feature brief from STDIN (JSON) and emits a sequenced task plan.\n`;

const readStdin = async () =>
  new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on('error', (error) => reject(error));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const parseFlags = (args) => {
  const flags = { format: 'json' };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }

    if (arg === '--format') {
      const value = args[index + 1];
      if (value) {
        flags.format = value;
        index += 1;
      }
      continue;
    }

    if (arg.startsWith('--format=')) {
      flags.format = arg.split('=')[1] ?? flags.format;
      continue;
    }
  }

  return flags;
};

const sanitizeText = (value, fallback) => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const buildSlug = (value, fallback) => {
  const source = sanitizeText(value, fallback).toLowerCase();
  return (
    source
      .normalize('NFKD')
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .slice(0, 40) || fallback
  );
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
};

const deriveSignals = (request) => {
  const context = ensureArray(request?.context);
  const goals = ensureArray(request?.goals);
  const constraints = ensureArray(request?.constraints);

  const highlights = [];
  if (goals.length > 0) {
    highlights.push(`Goals: ${goals.join('; ')}`);
  }
  if (constraints.length > 0) {
    highlights.push(`Constraints: ${constraints.join('; ')}`);
  }
  if (context.length > 0) {
    highlights.push(`Context: ${context.join('; ')}`);
  }

  return { goals, constraints, context, highlights };
};

const createTasks = (request) => {
  const title = sanitizeText(request?.title, 'Requested capability');
  const summary = sanitizeText(request?.summary, title);
  const slug = buildSlug(title, 'feature');
  const { goals, constraints, context, highlights } = deriveSignals(request);

  const makeId = (suffix) => `comp-eng-${slug}-${suffix}`;

  const discoveryTask = {
    id: makeId('discover'),
    title: `Clarify scope for ${title}`,
    mission: `Consolidate problem framing, success signals, and assumptions so downstream planning stays aligned. ${summary}`,
    persona: 'product_manager',
    lane: 'discovery',
    metadata: {
      confidence: 0.9,
      summary,
      highlights,
    },
  };

  const planningTask = {
    id: makeId('plan'),
    title: `Design delivery approach for ${title}`,
    mission: 'Translate validated goals into phased milestones, exit criteria, and resource needs.',
    persona: 'architect',
    lane: 'planning',
    dependencies: [discoveryTask.id],
    metadata: {
      confidence: 0.85,
      goals,
      constraints,
    },
  };

  const executionTask = {
    id: makeId('execute'),
    title: `Sequence developer workstreams for ${title}`,
    mission:
      'Draft actionable engineering missions, assign lanes, and map dependencies for implementation.',
    persona: 'tech_lead',
    lane: 'implementation',
    dependencies: [planningTask.id],
    metadata: {
      confidence: 0.82,
      context,
      outputs: ['mission-briefs', 'dependency-map'],
    },
  };

  const validationTask = {
    id: makeId('validate'),
    title: `Define validation and rollout for ${title}`,
    mission:
      'Capture QA strategy, success metrics, and rollout guards so the release is observable and safe.',
    persona: 'qa_lead',
    lane: 'validation',
    dependencies: [executionTask.id],
    metadata: {
      confidence: 0.8,
      qa_focus: ['instrumentation', 'regression-coverage', 'launch-checklist'],
    },
  };

  const tasks = [discoveryTask, planningTask, executionTask, validationTask];
  const edges = [
    { from: discoveryTask.id, to: planningTask.id, kind: 'supports' },
    { from: planningTask.id, to: executionTask.id, kind: 'blocks' },
    { from: executionTask.id, to: validationTask.id, kind: 'blocks' },
  ];

  return { tasks, edges };
};

const emitJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

const main = async () => {
  let [commandOrMaybeFlag, ...args] = process.argv.slice(2);

  if (!commandOrMaybeFlag || commandOrMaybeFlag.startsWith('--')) {
    args = commandOrMaybeFlag ? [commandOrMaybeFlag, ...args] : args;
    commandOrMaybeFlag = DEFAULT_COMMAND;
  }

  const command = commandOrMaybeFlag;
  const flags = parseFlags(args);

  if (flags.help) {
    process.stdout.write(helpText);
    return;
  }

  if (command !== DEFAULT_COMMAND) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.exitCode = 1;
    return;
  }

  if (flags.format !== 'json') {
    process.stderr.write(`Unsupported format: ${flags.format}. Only json is available.\n`);
    process.exitCode = 1;
    return;
  }

  let raw;
  try {
    raw = await readStdin();
  } catch (error) {
    process.stderr.write(`Failed to read input: ${(error && error.message) || error}\n`);
    process.exitCode = 1;
    return;
  }

  let request;
  if (raw && raw.trim().length > 0) {
    try {
      request = JSON.parse(raw);
    } catch (error) {
      process.stderr.write(`Invalid JSON input: ${(error && error.message) || error}\n`);
      process.exitCode = 1;
      return;
    }
  } else {
    request = {};
  }

  const { tasks, edges } = createTasks(request);
  emitJson({ tasks, edges });
};

try {
  await main();
} catch (error) {
  process.stderr.write(`Unexpected error: ${(error && error.message) || error}\n`);
  process.exitCode = 1;
}
