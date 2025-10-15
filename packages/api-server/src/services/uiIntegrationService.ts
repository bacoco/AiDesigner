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

    const cwd = payload.cwd || (project as any).projectPath || this.resolveWorkingDirectory();
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

    const cwd = payload.cwd || (project as any).projectPath || this.resolveWorkingDirectory();
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

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env },
        shell: process.platform === 'win32',
      });

      let stdout = '';
      let stderr = '';
      let spawnedError: Error | undefined;
      let resolved = false;

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
          return;
        }
        resolved = true;
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
    const command = process.env.SHADCN_MCP_COMMAND || 'npx';
    const baseArgs = this.parseArgs(
      process.env.SHADCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call shadcn install-component'
    );

    const args = [...baseArgs, payload.component];
    if (Array.isArray(payload.args) && payload.args.length > 0) {
      args.push(...payload.args);
    }

    return { command, args };
  }

  private buildTweakcnCommand(payload: ThemeUpdatePayload) {
    const command = process.env.TWEAKCN_MCP_COMMAND || 'npx';
    const baseArgs = this.parseArgs(
      process.env.TWEAKCN_MCP_ARGS ||
        '--yes @modelcontextprotocol/cli call tweakcn apply-palette'
    );

    const args = [...baseArgs, payload.palette.name];
    const tokensArg = JSON.stringify(payload.palette.tokens || {});
    args.push('--tokens', tokensArg);

    if (Array.isArray(payload.args) && payload.args.length > 0) {
      args.push(...payload.args);
    }

    return { command, args };
  }

  private parseArgs(input: string): string[] {
    return input
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private resolveWorkingDirectory(): string {
    const projectRoot = process.env.AIDESIGNER_PROJECT_ROOT;
    if (projectRoot) {
      return path.resolve(projectRoot);
    }
    return process.cwd();
  }
}

export const uiIntegrationService = new UIIntegrationService();

