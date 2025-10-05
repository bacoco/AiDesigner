const AUTO_COMMAND_PREFIX = 'auto-';

const COMMAND_PHASE_MAP = {
  analyst: 'analyst',
  analyze: 'analyst',
  pm: 'pm',
  plan: 'pm',
  architect: 'architect',
  architecture: 'architect',
  sm: 'sm',
  stories: 'sm',
  dev: 'dev',
  qa: 'qa',
  ux: 'ux',
  po: 'po',
};

function resolveAutoCommandPhase(command) {
  if (typeof command !== 'string') {
    throw new TypeError(`Invalid command type: ${typeof command}`);
  }

  if (!command.startsWith(AUTO_COMMAND_PREFIX)) {
    throw new TypeError(`Unsupported command: ${command}`);
  }

  const key = command.slice(AUTO_COMMAND_PREFIX.length);
  const phase = COMMAND_PHASE_MAP[key];

  if (!phase) {
    throw new Error(`Unknown auto-command phase for: ${command}`);
  }

  return phase;
}

async function executeAutoCommand(command, context, bridge) {
  const phase = resolveAutoCommandPhase(command);

  if (!bridge || typeof bridge.executePhaseWorkflow !== 'function') {
    throw new Error('aidesigner bridge is not initialized');
  }

  return bridge.executePhaseWorkflow(phase, context);
}

module.exports = {
  COMMAND_PHASE_MAP,
  executeAutoCommand,
  resolveAutoCommandPhase,
};
