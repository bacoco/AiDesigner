/* eslint-disable unicorn/prefer-module */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, spawn } = require('node:child_process');
const readline = require('node:readline');

const STATE_DIR_NAME = '.agilai-invisible';
const LEGACY_STATE_DIR_NAME = '.bmad-invisible';
let legacyStateDirNoticeShown = false;

function ensureStateDir(rootDir) {
  const stateDir = path.join(rootDir, STATE_DIR_NAME);
  const legacyDir = path.join(rootDir, LEGACY_STATE_DIR_NAME);

  if (fs.existsSync(stateDir)) {
    return stateDir;
  }

  if (fs.existsSync(legacyDir)) {
    if (!legacyStateDirNoticeShown) {
      legacyStateDirNoticeShown = true;
      console.warn(
        '⚠️  Agilai compatibility: reusing legacy .bmad-invisible state directory. Rename to .agilai-invisible when convenient.',
      );
    }
    return legacyDir;
  }

  // Try creating in rootDir first
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    return stateDir;
  } catch (error) {
    // If rootDir is read-only (e.g., global npm install, CI artifact), fall back to user home
    if (error.code === 'EACCES' || error.code === 'EROFS' || error.code === 'EPERM') {
      const fallbackDir = path.join(os.homedir(), STATE_DIR_NAME);
      const legacyFallbackDir = path.join(os.homedir(), LEGACY_STATE_DIR_NAME);

      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
          console.warn(
            `Note: Using ${fallbackDir} for Agilai cache (installation directory is read-only)`,
          );
          return fallbackDir;
        } catch (fallbackError) {
          if (fs.existsSync(legacyFallbackDir)) {
            if (!legacyStateDirNoticeShown) {
              legacyStateDirNoticeShown = true;
              console.warn(
                '⚠️  Agilai compatibility: falling back to legacy ~/.bmad-invisible cache directory.',
              );
            }
            return legacyFallbackDir;
          }

          console.warn('Warning: unable to create state directory:', fallbackError.message);
          return fallbackDir; // Return path anyway, saveState will handle write failures gracefully
        }
      }

      console.warn(
        `Note: Using ${fallbackDir} for Agilai cache (installation directory is read-only)`,
      );
      return fallbackDir;
    }

    if (fs.existsSync(legacyDir)) {
      if (!legacyStateDirNoticeShown) {
        legacyStateDirNoticeShown = true;
        console.warn(
          '⚠️  Agilai compatibility: reusing legacy .bmad-invisible state directory after creation failure.',
        );
      }
      return legacyDir;
    }

    // For other errors, log and return the path anyway (saveState handles write failures)
    console.warn('Warning: unable to create state directory:', error.message);
    return stateDir;
  }
}

function getStateFile(rootDir) {
  const dir = ensureStateDir(rootDir);
  return path.join(dir, 'cli-state.json');
}

function loadState(rootDir) {
  const stateFile = getStateFile(rootDir);
  if (!fs.existsSync(stateFile)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Warning: unable to read CLI state cache:', error.message);
    return {};
  }
}

function saveState(rootDir, state) {
  const stateFile = getStateFile(rootDir);
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    console.warn('Warning: unable to persist CLI state cache:', error.message);
  }
}

function findBinaryPath(binaryName) {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const lookup = spawnSync(command, [binaryName], { stdio: 'pipe' });
  if (lookup.status === 0) {
    const output = lookup.stdout.toString().split(/\r?\n/).find(Boolean);
    if (output) {
      const binaryPath = output.trim();
      // Validate that the binary is actually executable by running --version
      const validation = spawnSync(binaryPath, ['--version'], {
        stdio: 'pipe',
        timeout: 5000, // 5 second timeout for validation
      });
      // If --version succeeds (exit code 0), the binary is executable
      if (validation.status === 0) {
        return binaryPath;
      }
    }
  }
  return null;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface();
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printManualInstructions(friendlyName, manualSteps = []) {
  if (manualSteps.length === 0) {
    return;
  }

  console.log(`\nManual installation options for ${friendlyName}:`);
  for (const step of manualSteps) {
    const parts = [];
    if (step.command) {
      parts.push(step.command);
    }
    if (step.url) {
      parts.push(step.url);
    }
    const suffix = parts.length > 0 ? `: ${parts.join(' | ')}` : '';
    console.log(` - ${step.label}${suffix}`);
    if (step.description) {
      console.log(`   ${step.description}`);
    }
  }
  console.log();
}

function nonInteractiveMode() {
  return Boolean(
    // Detect common CI environment variables
    process.env.CI === 'true' ||
      process.env.CI === '1' ||
      process.env.CONTINUOUS_INTEGRATION === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.GITLAB_CI === 'true' ||
      process.env.CIRCLECI === 'true' ||
      process.env.TRAVIS === 'true' ||
      process.env.BUILD_NUMBER || // Jenkins
      !process.stdin.isTTY ||
      !process.stdout.isTTY,
  );
}

function buildOptions(installGuide) {
  const options = [];
  let index = 1;
  if (installGuide.autoInstallCommand) {
    options.push({
      key: String(index++),
      type: 'auto',
      label: `Run "${installGuide.autoInstallCommand}" now`,
    });
  }

  if (installGuide.manualSteps && installGuide.manualSteps.length > 0) {
    options.push({
      key: String(index++),
      type: 'manual',
      label: 'Show manual installation commands',
    });
  }

  options.push({ key: String(index++), type: 'abort', label: 'Cancel and exit' });
  return options;
}

function printOptions(options) {
  console.log('\nInstallation options:');
  for (const option of options) {
    console.log(` ${option.key}) ${option.label}`);
  }
}

function runShellCommand(command, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('exit', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

async function ensureCliBinary({ rootDir, binaryName, friendlyName, installGuide = {} }) {
  // Validate required parameters
  if (!rootDir || typeof rootDir !== 'string') {
    throw new Error('ensureCliBinary: rootDir parameter is required and must be a string');
  }
  if (!binaryName || typeof binaryName !== 'string') {
    throw new Error('ensureCliBinary: binaryName parameter is required and must be a string');
  }
  if (!friendlyName || typeof friendlyName !== 'string') {
    throw new Error('ensureCliBinary: friendlyName parameter is required and must be a string');
  }

  const state = loadState(rootDir);
  const now = new Date().toISOString();
  const existingRecord = state[binaryName] || {};

  const initialPath = findBinaryPath(binaryName);
  if (initialPath) {
    state[binaryName] = {
      installed: true,
      binaryPath: initialPath,
      lastChecked: now,
    };
    saveState(rootDir, state);
    return { ok: true, binaryPath: initialPath };
  }

  state[binaryName] = {
    ...existingRecord,
    installed: false,
    lastPrompted: now,
  };
  saveState(rootDir, state);

  console.error(`\n⚠️  ${friendlyName} (${binaryName}) is not available on your PATH.`);
  if (existingRecord.installed && existingRecord.binaryPath) {
    console.error(
      `The previous installation recorded at ${existingRecord.binaryPath} is no longer reachable.`,
    );
  }

  const manualSteps = installGuide.manualSteps || [];
  if (nonInteractiveMode()) {
    if (installGuide.autoInstallCommand) {
      console.error(
        `Run "${installGuide.autoInstallCommand}" to launch a local copy, or use one of the manual options below.`,
      );
    }
    printManualInstructions(friendlyName, manualSteps);
    return { ok: false, exitCode: 1 };
  }

  while (true) {
    const options = buildOptions(installGuide);
    printOptions(options);
    const defaultOption = options.find((option) => option.type === 'manual') || options[0];
    const answer = await ask(`Select an option [default: ${defaultOption.key}]: `);
    const selectionKey = answer.trim() || defaultOption.key;
    const selection = options.find((option) => option.key === selectionKey);

    if (!selection) {
      console.log('Unrecognised option. Please try again.');
      continue;
    }

    if (selection.type === 'abort') {
      return { ok: false, exitCode: 1 };
    }

    if (selection.type === 'auto') {
      const success = await runShellCommand(
        installGuide.autoInstallCommand,
        installGuide.cwd || rootDir,
      );
      if (!success) {
        const retry = await ask('Automatic installation failed. Try another option? (y/N) ');
        if (retry.trim().toLowerCase() === 'y') {
          continue;
        }
        return { ok: false, exitCode: 1 };
      }
    }

    if (selection.type === 'manual') {
      printManualInstructions(friendlyName, manualSteps);
      const ready = await ask(
        'Press Enter once installation is complete to retry detection, or type "skip" to cancel: ',
      );
      if (ready.trim().toLowerCase() === 'skip') {
        return { ok: false, exitCode: 1 };
      }
    }

    const resolvedPath = findBinaryPath(binaryName);
    if (resolvedPath) {
      state[binaryName] = {
        installed: true,
        binaryPath: resolvedPath,
        lastChecked: new Date().toISOString(),
      };
      saveState(rootDir, state);
      return { ok: true, binaryPath: resolvedPath };
    }

    console.error(`${friendlyName} is still not available. Let's try another option.\n`);
  }
}

module.exports = {
  ensureCliBinary,
};
