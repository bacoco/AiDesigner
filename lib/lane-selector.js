/**
 * Lane Selector
 * Intelligently routes tasks between complex (multi-agent) and quick (template-based) lanes
 */

const fs = require('fs-extra');
const path = require('node:path');

// Keywords indicating quick fixes (quick lane)
const QUICK_FIX_KEYWORDS = [
  'typo',
  'fix typo',
  'spelling',
  'add flag',
  'add option',
  'add config',
  'update config',
  'change flag',
  'toggle',
  'enable',
  'disable',
  'remove console',
  'comment',
  'rename variable',
  'fix import',
  'update import',
  'small bugfix',
  'quick fix',
  'minor fix',
];

// Keywords indicating complex work (complex lane)
const COMPLEX_KEYWORDS = [
  'new feature',
  'add feature',
  'implement',
  'build',
  'create system',
  'architecture',
  'refactor',
  'redesign',
  'integrate',
  'authentication',
  'authorization',
  'database',
  'api',
  'security',
  'multi-component',
  'cross-cutting',
  'performance',
  'scalability',
];

// File patterns indicating scope
const SINGLE_FILE_PATTERNS = /single file|one file|this file|in \w+\.(js|ts|md|json|yaml)/i;
const MULTI_FILE_PATTERNS = /across|multiple files|several files|throughout|entire/i;

/**
 * Analyze user message to determine appropriate lane
 */
function selectLane(userMessage, context = {}) {
  // Manual override
  if (context.forceLane) {
    return {
      lane: context.forceLane,
      confidence: 1,
      rationale: `Manual override to ${context.forceLane} lane`,
      factors: { override: true },
    };
  }

  const message = userMessage.toLowerCase();
  const factors = {};

  // Factor 1: Quick fix keywords
  const quickFixMatches = QUICK_FIX_KEYWORDS.filter((kw) => message.includes(kw));
  factors.quickFixKeywords = quickFixMatches.length;

  // Factor 2: Complex keywords
  const complexMatches = COMPLEX_KEYWORDS.filter((kw) => message.includes(kw));
  factors.complexKeywords = complexMatches.length;

  // Factor 3: File scope
  factors.singleFileScope = SINGLE_FILE_PATTERNS.test(message);
  factors.multiFileScope = MULTI_FILE_PATTERNS.test(message);

  // Factor 4: Message length (longer = more complex)
  factors.messageLength = userMessage.length;
  factors.isShortMessage = userMessage.length < 100;

  // Factor 5: Question vs statement
  factors.isQuestion = message.includes('?');

  // Factor 6: Action words
  factors.hasActionWords =
    message.includes('add') ||
    message.includes('remove') ||
    message.includes('fix') ||
    message.includes('update') ||
    message.includes('change');

  // Scoring algorithm
  let quickScore = 0;
  let complexScore = 0;

  // Quick fix keywords strongly favor quick lane
  quickScore += factors.quickFixKeywords * 3;

  // Complex keywords strongly favor complex lane
  complexScore += factors.complexKeywords * 3;

  // Single file scope favors quick lane
  if (factors.singleFileScope) {
    quickScore += 2;
  }

  // Multi-file scope favors complex lane
  if (factors.multiFileScope) {
    complexScore += 3;
  }

  // Short messages with action words favor quick lane
  if (factors.isShortMessage && factors.hasActionWords) {
    quickScore += 2;
  }

  // Long messages favor complex lane
  if (factors.messageLength > 200) {
    complexScore += 1;
  }

  // Questions favor complex lane (needs analysis)
  if (factors.isQuestion) {
    complexScore += 1;
  }

  // Context-based factors
  if (context.previousPhase) {
    // If already in complex flow, stay in complex lane
    complexScore += 3;
    factors.inComplexFlow = true;
  }

  if (context.hasExistingPRD) {
    // If PRD exists, likely complex territory
    complexScore += 3;
    factors.hasExistingPRD = true;
  }

  if (context.projectComplexity === 'high') {
    complexScore += 3;
    factors.highComplexity = true;
  }

  // Decision logic
  const totalScore = quickScore + complexScore;
  let confidence = 0;
  let lane = 'complex'; // Default to complex for safety
  let rationale = '';

  if (totalScore === 0) {
    // No clear signals - default to complex
    lane = 'complex';
    confidence = 0.5;
    rationale =
      'No clear classification signals detected. Defaulting to complex lane for comprehensive approach.';
  } else if (quickScore > complexScore * 1.5) {
    // Strong quick lane indicators
    lane = 'quick';
    confidence = Math.min(quickScore / (quickScore + complexScore), 0.95);
    rationale = buildRationale('quick', factors, quickScore, complexScore);
  } else if (complexScore > quickScore) {
    // Complex lane indicators
    lane = 'complex';
    // Boost confidence for complex decisions with strong signals
    const baseConfidence = complexScore / (quickScore + complexScore);
    const boost = factors.complexKeywords > 2 ? 0.1 : 0;
    confidence = Math.min(baseConfidence + boost, 0.95);
    rationale = buildRationale('complex', factors, quickScore, complexScore);
  } else {
    // Close call - default to quick for efficiency
    lane = 'quick';
    confidence = 0.6;
    rationale = 'Task appears small enough for quick lane. Can escalate to complex if needed.';
  }

  return {
    lane,
    confidence,
    rationale,
    factors,
    scores: { quick: quickScore, complex: complexScore },
  };
}

/**
 * Build human-readable rationale
 */
function buildRationale(selectedLane, factors, quickScore, complexScore) {
  const reasons = [];

  if (selectedLane === 'quick') {
    if (factors.quickFixKeywords > 0) {
      reasons.push('detected quick fix keywords');
    }
    if (factors.singleFileScope) {
      reasons.push('single file scope');
    }
    if (factors.isShortMessage) {
      reasons.push('concise request');
    }

    return `Quick lane selected: ${reasons.join(', ')}. (Score: Quick ${quickScore} vs Complex ${complexScore})`;
  }

  // Complex lane rationale
  if (factors.complexKeywords > 0) {
    reasons.push('complex feature indicators');
  }
  if (factors.multiFileScope) {
    reasons.push('multi-file/cross-cutting scope');
  }
  if (factors.messageLength > 200) {
    reasons.push('detailed requirements');
  }
  if (factors.inComplexFlow) {
    reasons.push('already in complex workflow');
  }
  if (factors.isQuestion) {
    reasons.push('exploratory question');
  }

  return `Complex lane selected: ${reasons.join(', ')}. (Score: Complex ${complexScore} vs Quick ${quickScore})`;
}

/**
 * Log lane decision to decisions.jsonl
 */
async function logDecision(projectPath, decision, userMessage) {
  const decisionsFile = path.join(projectPath, '.bmad-invisible', 'decisions.jsonl');

  await fs.ensureDir(path.dirname(decisionsFile));

  const entry = {
    timestamp: new Date().toISOString(),
    userMessage,
    lane: decision.lane,
    confidence: decision.confidence,
    rationale: decision.rationale,
    factors: decision.factors,
    scores: decision.scores,
  };

  await fs.appendFile(decisionsFile, JSON.stringify(entry) + '\n');
}

/**
 * Get lane selection with logging
 */
async function selectLaneWithLog(userMessage, context = {}, projectPath = process.cwd()) {
  const decision = selectLane(userMessage, context);
  await logDecision(projectPath, decision, userMessage);
  return decision;
}

/**
 * Read decision history
 */
async function getDecisionHistory(projectPath = process.cwd(), limit = 10) {
  const decisionsFile = path.join(projectPath, '.bmad-invisible', 'decisions.jsonl');

  if (!(await fs.pathExists(decisionsFile))) {
    return [];
  }

  const content = await fs.readFile(decisionsFile, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());

  const decisions = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  });

  return decisions.filter(Boolean).slice(-limit);
}

module.exports = {
  selectLane,
  selectLaneWithLog,
  logDecision,
  getDecisionHistory,
  QUICK_FIX_KEYWORDS,
  COMPLEX_KEYWORDS,
};
