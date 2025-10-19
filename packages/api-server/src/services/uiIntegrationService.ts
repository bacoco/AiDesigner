import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'shell-quote';
import { BadRequestError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import {
  projectService,
  ShadcnComponentInstallationRecord,
  TweakcnPaletteRecord,
} from './projectService';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string | null;
}

export interface InstallComponentPayload {
  component: string;
  args?: string[];
  metadata?: Record<string, unknown>;
  cwd?: string;
}

export interface ThemeUpdatePayload {
  palette: {
    name: string;
    tokens: Record<string, string>;
  };
  args?: string[];
  metadata?: Record<string, unknown>;
  cwd?: string;
}

export interface InstallComponentResult {
  success: boolean;
  output: CommandResult;
  record: ShadcnComponentInstallationRecord;
}

export interface ThemeUpdateResult {
  success: boolean;
  output: CommandResult;
  record: TweakcnPaletteRecord;
}

class UIIntegrationService {
  private readonly maxUserArgs: number;
  private readonly maxOutputBytes: number;

  constructor() {
    const configuredArgs = Number(process.env.UI_INTEGRATION_MAX_ARGS ?? 25);
    this.maxUserArgs = Number.isFinite(configuredArgs) && configuredArgs > 0 ? configuredArgs : 25;

    const configuredOutput = Number(
      process.env.UI_INTEGRATION_MAX_OUTPUT_BYTES ?? 10 * 1024 * 1024
    );
    this.maxOutputBytes =
      Number.isFinite(configuredOutput) && configuredOutput > 0
        ? configuredOutput
        : 10 * 1024 * 1024;
  }

  async installComponent(
    projectId: string,
    payload: InstallComponentPayload
  ): Promise<InstallComponentResult> {
    const projectRoot = projectService.getProjectRoot(projectId);
    const sanitizedComponent = this.sanitizeToken(payload.component, 'component');
    const normalizedArgs = this.normalizeArgs(payload.args);
    const cwd = await this.validateCwd(payload.cwd, projectRoot);

    const { command, args } = this.buildShadcnCommand(sanitizedComponent, normalizedArgs);
    const execution = await this.runCommand(command, args, cwd);

    const status = execution.exitCode === 0 ? 'succeeded' : 'failed';
    const timestamp = new Date().toISOString();

    const record = await projectService.recordShadcnComponentInstallation(projectId, {
      component: sanitizedComponent,
      args: normalizedArgs,
      status,
      installedAt: timestamp,
      metadata: payload.metadata,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error ?? null,
    });

    return {
      success: status === 'succeeded',
      output: execution,
      record,
    };
  }

  async updateTheme(
    projectId: string,
    payload: ThemeUpdatePayload
  ): Promise<ThemeUpdateResult> {
    const projectRoot = projectService.getProjectRoot(projectId);
    const paletteName = this.sanitizeToken(payload.palette.name, 'palette');
    const sanitizedTokens = this.sanitizeTokens(payload.palette.tokens);
    const normalizedArgs = this.normalizeArgs(payload.args);
    const cwd = await this.validateCwd(payload.cwd, projectRoot);

    const { command, args } = this.buildTweakcnCommand(
      paletteName,
      sanitizedTokens,
      normalizedArgs
    );
    const execution = await this.runCommand(command, args, cwd);

    const status = execution.exitCode === 0 ? 'succeeded' : 'failed';
    const timestamp = new Date().toISOString();

    const record = await projectService.applyTweakcnPalette(projectId, {
      name: paletteName,
      tokens: sanitizedTokens,
      status,
      appliedAt: timestamp,
      metadata: payload.metadata,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error ?? null,
    });

    return {
      success: status === 'succeeded',
      output: execution,
      record,
    };
  }

  private async runCommand(
    command: string,
    args: string[],
    cwd: string
  ): Promise<CommandResult> {
    logger.info(`Executing command: ${command} ${args.join(' ')}`, { cwd });

    const timeoutMs = Number(process.env.UI_INTEGRATION_TIMEOUT_MS ?? 300_000);
    const maxOutputBytes = this.maxOutputBytes;

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env },
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;
      let errorMessage: string | null = null;
      let totalBytes = 0;
      let outputExceeded = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          logger.warn('Integration command timed out; terminating', { timeoutMs });
          try {
            child.kill('SIGTERM');
          } catch (killError) {
            logger.error('Failed to kill timed out process', {
              error: killError instanceof Error ? killError.message : String(killError),
            });
          }
        }
      }, timeoutMs);

      const handleData = (data: Buffer, target: 'stdout' | 'stderr') => {
        if (outputExceeded) {
          return;
        }

        totalBytes += data.length;
        if (totalBytes > maxOutputBytes) {
          outputExceeded = true;
          errorMessage = `Process output exceeded ${maxOutputBytes} bytes`;
          logger.warn('Integration command output exceeded limit; terminating process', {
            maxOutputBytes,
          });
          try {
            child.kill('SIGTERM');
          } catch (killError) {
            logger.error('Failed to terminate process after exceeding output limit', {
              error: killError instanceof Error ? killError.message : String(killError),
            });
          }
          return;
        }

        if (target === 'stdout') {
          stdout += data.toString();
        } else {
          stderr += data.toString();
        }
      };

      child.stdout?.on('data', (data: Buffer) => handleData(data, 'stdout'));
      child.stderr?.on('data', (data: Buffer) => handleData(data, 'stderr'));

      child.on('error', (error) => {
        errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to spawn integration command', { error: errorMessage });
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr,
            exitCode: null,
            error: errorMessage,
          });
        }
      });

      child.on('close', (exitCode) => {
        if (resolved) {
          clearTimeout(timer);
          return;
        }

        resolved = true;
        clearTimeout(timer);

        if (exitCode === 0) {
          logger.info('Integration command completed successfully', { exitCode });
        } else {
          logger.warn('Integration command completed with non-zero exit code', {
            exitCode,
            stderr,
            error: errorMessage,
          });
        }

        resolve({
          stdout,
          stderr,
          exitCode,
          error: errorMessage,
        });
      });
    });
  }

  private buildShadcnCommand(component: string, extraArgs: string[]) {
    const baseCommand = process.env.SHADCN_MCP_COMMAND || 'npx';
    const command = this.resolveCommand(baseCommand);
    const baseArgs = this.parseArgs(
      process.env.SHADCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call shadcn install-component'
    );

    const args = [...baseArgs, component];

    if (extraArgs.length > 0) {
      args.push(...extraArgs);
    }

    return { command, args };
  }

  private buildTweakcnCommand(
    paletteName: string,
    tokens: Record<string, string>,
    extraArgs: string[]
  ) {
    const baseCommand = process.env.TWEAKCN_MCP_COMMAND || 'npx';
    const command = this.resolveCommand(baseCommand);
    const baseArgs = this.parseArgs(
      process.env.TWEAKCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call tweakcn apply-palette'
    );

    const args = [...baseArgs, paletteName];
    const tokensArg = JSON.stringify(tokens);

    if (tokensArg.length > 20000) {
      throw new BadRequestError('Palette tokens payload is too large');
    }

    args.push('--tokens', tokensArg);

    if (extraArgs.length > 0) {
      args.push(...extraArgs);
    }

    return { command, args };
  }

  private parseArgs(input: string): string[] {
    if (!input) {
      return [];
    }

    const parsed = parse(input);
    const args: string[] = [];

    for (const part of parsed) {
      if (typeof part !== 'string') {
        throw new Error('Unsupported operator in MCP command configuration');
      }

      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }

      this.ensureArgSafe(trimmed, 'system');
      args.push(trimmed);
    }

    return args;
  }

  private async validateCwd(
    requestedCwd: string | undefined,
    projectRoot: string
  ): Promise<string> {
    const resolvedRoot = await this.realpathOrResolve(projectRoot);
    const normalizedRequest =
      typeof requestedCwd === 'string' && requestedCwd.trim().length > 0
        ? requestedCwd.trim()
        : undefined;

    const candidatePath = normalizedRequest
      ? path.resolve(projectRoot, normalizedRequest)
      : resolvedRoot;

    let resolvedCandidate: string;
    try {
      resolvedCandidate = await fs.realpath(candidatePath);
    } catch (error) {
      if (!normalizedRequest) {
        resolvedCandidate = resolvedRoot;
      } else {
        logger.warn('Requested working directory does not exist', {
          requestedCwd: normalizedRequest,
        });
        throw new BadRequestError('Working directory does not exist');
      }
    }

    const relative = path.relative(resolvedRoot, resolvedCandidate);
    if (relative && (relative.startsWith('..') || path.isAbsolute(relative))) {
      logger.warn('Invalid working directory requested, outside project root', {
        requestedCwd: normalizedRequest,
        projectRoot,
      });
      throw new BadRequestError('Invalid working directory');
    }

    const stats = await fs.stat(resolvedCandidate).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      throw new BadRequestError('Working directory must be an existing directory');
    }

    return resolvedCandidate;
  }

  private async realpathOrResolve(target: string): Promise<string> {
    try {
      return await fs.realpath(target);
    } catch {
      return path.resolve(target);
    }
  }

  private sanitizeToken(value: string, field: 'component' | 'palette'): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new BadRequestError(`${field === 'component' ? 'Component' : 'Palette'} name is required`);
    }

    if (trimmed.length > 214) {
      throw new BadRequestError('Name is too long');
    }

    if (trimmed.includes('..')) {
      throw new BadRequestError('Invalid name');
    }

    const pattern = /^(@[a-z0-9][\w.-]*\/)?[a-zA-Z0-9][\w.-]*$/i;
    if (!pattern.test(trimmed)) {
      throw new BadRequestError('Invalid name format');
    }

    return trimmed;
  }

  private normalizeArgs(args?: unknown[]): string[] {
    if (!Array.isArray(args) || args.length === 0) {
      return [];
    }

    if (args.length > this.maxUserArgs) {
      throw new BadRequestError(`Too many command arguments (max ${this.maxUserArgs})`);
    }

    return args.map((arg, index) => {
      if (typeof arg !== 'string') {
        throw new BadRequestError(`Argument at position ${index} must be a string`);
      }

      const trimmed = arg.trim();
      if (!trimmed) {
        throw new BadRequestError('Command arguments cannot be empty');
      }

      if (trimmed.length > 2000) {
        throw new BadRequestError('Command argument is too long');
      }

      this.ensureArgSafe(trimmed, 'user');
      return trimmed;
    });
  }

  private ensureArgSafe(arg: string, source: 'user' | 'system'): void {
    const dangerousPattern = /[;&|`$()<>\\'"\n\r]/;
    const forbiddenPrefixes = ['--eval', '-e', '--require', '-r'];

    if (dangerousPattern.test(arg) || arg.includes('..')) {
      if (source === 'user') {
        throw new BadRequestError(`Invalid argument detected: ${arg}`);
      }
      throw new Error(`Invalid configured argument detected: ${arg}`);
    }

    const lowered = arg.toLowerCase();
    if (forbiddenPrefixes.some((flag) => lowered.startsWith(flag))) {
      if (source === 'user') {
        throw new BadRequestError(`Unsupported argument: ${arg}`);
      }
      throw new Error(`Unsupported configured argument: ${arg}`);
    }
  }

  private sanitizeTokens(tokens: Record<string, string>): Record<string, string> {
    if (!tokens || typeof tokens !== 'object') {
      return {};
    }

    const entries = Object.entries(tokens);
    if (entries.length > 100) {
      throw new BadRequestError('Too many palette tokens (max 100)');
    }

    const sanitized: Record<string, string> = {};
    for (const [rawKey, rawValue] of entries) {
      const key = String(rawKey).trim();
      if (!key) {
        throw new BadRequestError('Palette token keys cannot be empty');
      }
      if (key.length > 100) {
        throw new BadRequestError(`Palette token key "${key}" is too long`);
      }
      if (key === '__proto__' || key === 'constructor') {
        throw new BadRequestError('Invalid palette token key');
      }
      if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
        throw new BadRequestError(`Invalid palette token key: ${key}`);
      }

      if (typeof rawValue !== 'string') {
        throw new BadRequestError(`Palette token value for "${key}" must be a string`);
      }

      const value = rawValue.trim();
      if (!value) {
        throw new BadRequestError(`Palette token value for "${key}" cannot be empty`);
      }
      if (value.length > 500) {
        throw new BadRequestError(`Palette token value for "${key}" is too long`);
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  private resolveCommand(command: string): string {
    if (process.platform === 'win32' && command === 'npx') {
      return 'npx.cmd';
    }
    return command;
  }
}

export const uiIntegrationService = new UIIntegrationService();

