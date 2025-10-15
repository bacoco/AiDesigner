import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../index';
import {
  projectService,
  ShadcnComponentInstallationRecord,
  TweakcnPaletteRecord,
} from './projectService';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: Error;
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
  async installComponent(
    projectId: string,
    payload: InstallComponentPayload
  ): Promise<InstallComponentResult> {
    const project = await projectService.getProject(projectId);

    const projectRoot = this.resolveWorkingDirectory();
    const requestedCwd = payload.cwd || projectRoot;
    const cwd = this.validateCwd(requestedCwd, projectRoot);

    const { command, args } = this.buildShadcnCommand(payload);
    const execution = await this.runCommand(command, args, cwd);

    const status = execution.exitCode === 0 ? 'succeeded' : 'failed';
    const record = await project.recordShadcnComponentInstallation({
      component: payload.component,
      args: payload.args,
      status,
      installedAt: new Date().toISOString(),
      metadata: payload.metadata,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error ? execution.error.message : undefined,
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
    const project = await projectService.getProject(projectId);

    const projectRoot = this.resolveWorkingDirectory();
    const requestedCwd = payload.cwd || projectRoot;
    const cwd = this.validateCwd(requestedCwd, projectRoot);

    const { command, args } = this.buildTweakcnCommand(payload);
    const execution = await this.runCommand(command, args, cwd);

    const status = execution.exitCode === 0 ? 'succeeded' : 'failed';
    const record = await project.applyTweakcnPalette({
      name: payload.palette.name,
      tokens: payload.palette.tokens,
      status,
      appliedAt: new Date().toISOString(),
      metadata: payload.metadata,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error ? execution.error.message : undefined,
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

    const timeoutMs = Number(process.env.UI_INTEGRATION_TIMEOUT_MS ?? 300_000); // 5 minutes default

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env },
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let spawnedError: Error | undefined;
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          logger.warn('Integration command timed out; terminating', { timeoutMs });
          try {
            child.kill('SIGTERM');
          } catch (killError) {
            logger.error('Failed to kill timed out process', { killError });
          }
        }
      }, timeoutMs);

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        spawnedError = error;
        logger.error('Failed to spawn integration command', { error: error.message });
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({
            stdout,
            stderr,
            exitCode: null,
            error,
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
          });
        }

        resolve({
          stdout,
          stderr,
          exitCode,
          ...(spawnedError ? { error: spawnedError } : {}),
        });
      });
    });
  }

  private buildShadcnCommand(payload: InstallComponentPayload) {
    const baseCommand = process.env.SHADCN_MCP_COMMAND || 'npx';
    const command = this.resolveCommand(baseCommand);
    const baseArgs = this.parseArgs(
      process.env.SHADCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call shadcn install-component'
    );

    const component = this.sanitizeToken(payload.component);
    const args = [...baseArgs, component];

    if (Array.isArray(payload.args) && payload.args.length > 0) {
      this.validateArgs(payload.args);
      args.push(...payload.args);
    }

    return { command, args };
  }

  private buildTweakcnCommand(payload: ThemeUpdatePayload) {
    const baseCommand = process.env.TWEAKCN_MCP_COMMAND || 'npx';
    const command = this.resolveCommand(baseCommand);
    const baseArgs = this.parseArgs(
      process.env.TWEAKCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call tweakcn apply-palette'
    );

    const paletteName = this.sanitizeToken(payload.palette.name);
    const args = [...baseArgs, paletteName];
    const tokensArg = JSON.stringify(payload.palette.tokens || {});
    args.push('--tokens', tokensArg);

    if (Array.isArray(payload.args) && payload.args.length > 0) {
      this.validateArgs(payload.args);
      args.push(...payload.args);
    }

    return { command, args };
  }

  private parseArgs(input: string): string[] {
    // Simple quote-aware parser to handle arguments with spaces
    const args: string[] = [];
    let current = '';
    let quote: '"' | "'" | null = null;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (!quote && (char === '"' || char === "'")) {
        quote = char;
        continue;
      }

      if (quote && char === quote) {
        quote = null;
        continue;
      }

      if (!quote && /\s/.test(char)) {
        if (current) {
          args.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) {
      args.push(current);
    }

    return args;
  }

  private resolveWorkingDirectory(): string {
    const projectRoot = process.env.AIDESIGNER_PROJECT_ROOT;
    if (projectRoot) {
      return path.resolve(projectRoot);
    }
    return process.cwd();
  }

  private validateCwd(requestedCwd: string, projectRoot: string): string {
    const resolvedCwd = path.resolve(requestedCwd);
    const resolvedRoot = path.resolve(projectRoot);

    // Ensure the requested cwd is within the project root
    if (resolvedCwd !== resolvedRoot && !resolvedCwd.startsWith(resolvedRoot + path.sep)) {
      logger.warn('Invalid working directory requested, using project root', {
        requestedCwd,
        projectRoot,
      });
      return resolvedRoot;
    }

    return resolvedCwd;
  }

  private sanitizeToken(token: string): string {
    // Only allow alphanumeric, hyphens, underscores, dots, slashes, and @ for scoped packages
    if (!/^[\w@./-]+$/.test(token)) {
      throw new Error(`Invalid token: ${token}`);
    }
    return token;
  }

  private validateArgs(args: string[]): void {
    const dangerousPatterns = /[;&|`$()]/;
    for (const arg of args) {
      if (dangerousPatterns.test(arg)) {
        throw new Error(`Invalid argument detected: ${arg}`);
      }
    }
  }

  private resolveCommand(command: string): string {
    // On Windows, npx needs .cmd extension when not using shell
    if (process.platform === 'win32' && command === 'npx') {
      return 'npx.cmd';
    }
    return command;
  }
}

export const uiIntegrationService = new UIIntegrationService();

