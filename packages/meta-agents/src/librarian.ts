import path from 'node:path';
import { BaseMetaAgent } from './base';
import type { LibrarianInput, MetaAgentRuntimeOptions } from './types';
import {
  extractShellCommands,
  fetchSupabasePublicSchema,
  renderMermaidComponentMap,
  summarizeCommands,
  tokenizeLines,
} from './utils';

interface ArchitectureComponent {
  name: string;
  type: string;
  relations: string[];
}

interface ApiEndpoint {
  method: string;
  path: string;
  summary: string;
}

export class LibrarianMetaAgent extends BaseMetaAgent<LibrarianInput> {
  constructor(input: LibrarianInput = {}, options?: MetaAgentRuntimeOptions) {
    super(
      'librarian',
      'Librarian Documentation Steward',
      'Synchronizes project documentation with the current codebase and database schema.',
      input,
      options,
    );
  }

  private async listFiles(relativeDir: string): Promise<string[]> {
    const absoluteDir = path.join(this.projectRoot, relativeDir);
    try {
      const entries = await this.fileSystem.readdir(absoluteDir);
      const files: string[] = [];
      for (const entry of entries) {
        const absolutePath = path.join(absoluteDir, entry);
        const stats = await this.fileSystem.stat(absolutePath);
        if (stats.isDirectory()) {
          const nested = await this.listFiles(path.relative(this.projectRoot, absolutePath));
          files.push(...nested);
        } else {
          files.push(path.relative(this.projectRoot, absolutePath));
        }
      }
      return files;
    } catch (error) {
      this.logger(`⚠️  Unable to traverse ${relativeDir}: ${(error as Error).message}`);
      return [];
    }
  }

  private async deriveArchitecture(scopePaths: string[]): Promise<ArchitectureComponent[]> {
    const components: ArchitectureComponent[] = [];
    for (const scope of scopePaths) {
      const files = await this.listFiles(scope);
      if (!files.length) {
        continue;
      }
      components.push({
        name: scope.replace(/\//g, '_'),
        type: 'Module',
        relations: files
          .filter((file) => file.includes('/'))
          .slice(0, 5)
          .map((file) => file.split('/')[0].replace(/[^a-zA-Z0-9]/g, '_')),
      });
    }
    return components;
  }

  private async generateArchitectureDoc(scopePaths: string[]): Promise<string> {
    const components = await this.deriveArchitecture(scopePaths);
    const mermaid = renderMermaidComponentMap(
      components.map((component) => ({
        name: component.name,
        type: component.type,
        relations: component.relations,
      })),
    );

    const lines = [
      '# System Architecture',
      '',
      '## Component Map',
      '',
      '```mermaid',
      mermaid,
      '```',
      '',
      '## Components',
      '',
    ];

    for (const component of components) {
      lines.push(`### ${component.name}`, '', `Type: ${component.type}`, 'Responsibilities:');
      lines.push('- Maintain module boundaries');
      if (component.relations.length) {
        lines.push('', 'Relations:');
        for (const relation of component.relations) {
          lines.push(`- ${component.name} → ${relation}`);
        }
      }
      lines.push('');
    }

    if (components.length === 0) {
      lines.push('No components detected in configured scopes.');
    }

    return lines.join('\n');
  }

  private parseEndpointLine(line: string): ApiEndpoint | undefined {
    const httpMatch = line.match(/(get|post|put|delete|patch|options|head)\(['"`](.*?)['"`]/i);
    if (httpMatch) {
      return {
        method: httpMatch[1].toUpperCase(),
        path: httpMatch[2],
        summary: 'Detected from routing declaration',
      };
    }

    const fastApiMatch = line.match(/@app\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/i);
    if (fastApiMatch) {
      return {
        method: fastApiMatch[1].toUpperCase(),
        path: fastApiMatch[2],
        summary: 'FastAPI endpoint',
      };
    }

    return undefined;
  }

  private async collectApiEndpoints(apiFiles: string[]): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    for (const file of apiFiles) {
      const absolutePath = path.join(this.projectRoot, file);
      try {
        const content = await this.fileSystem.readFile(absolutePath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const endpoint = this.parseEndpointLine(line.trim());
          if (endpoint) {
            endpoints.push(endpoint);
          }
        }
      } catch (error) {
        this.logger(`⚠️  Failed to read ${file}: ${(error as Error).message}`);
      }
    }
    return endpoints;
  }

  private renderApiReference(endpoints: ApiEndpoint[]): string {
    const lines = ['# API Reference', '', '## Endpoints', ''];
    if (!endpoints.length) {
      lines.push('_No API endpoints detected in supplied scope._');
      return lines.join('\n');
    }

    for (const endpoint of endpoints) {
      lines.push(`### ${endpoint.method} ${endpoint.path}`, '', endpoint.summary, '');
      lines.push(
        'Request:',
        '',
        '- Body: _Describe body schema_',
        '',
        'Response:',
        '',
        '- Status: 200 OK',
        '- Body: _Describe response_',
      );
      lines.push('');
    }

    return lines.join('\n');
  }

  private renderDatabaseSchema(tables: Awaited<ReturnType<typeof fetchSupabasePublicSchema>>): string {
    const lines = ['# Database Schema', ''];
    if (!tables.length) {
      lines.push('No Supabase schema information available.');
      return lines.join('\n');
    }

    for (const table of tables) {
      lines.push(`## ${table.name}`, '', '| Column | Type | Nullable | Default |', '| --- | --- | --- | --- |');
      for (const column of table.columns) {
        lines.push(
          `| ${column.name} | ${column.type} | ${column.nullable ? 'Yes' : 'No'} | ${column.defaultValue ?? ''} |`,
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private renderSetupValidation(commands: string[]): string {
    const checks = summarizeCommands(commands);
    const lines = ['# Setup Validation Report', '', '## Commands'];
    if (!checks.length) {
      lines.push('', 'No commands discovered in development guide.');
      return lines.join('\n');
    }

    for (const check of checks) {
      lines.push('', `- \`${check.command}\` — ${check.status.toUpperCase()} (${check.note})`);
    }

    return lines.join('\n');
  }

  protected async execute(): Promise<string> {
    // Validate inputs (scopePaths has a default but should be non-empty)
    const scopePaths = this.input.scopePaths ?? ['src'];
    if (scopePaths.length === 0) {
      throw new Error('scopePaths must contain at least one directory');
    }

    const architectureDoc = await this.generateArchitectureDoc(scopePaths);

    await this.runStage('architecture', 'Generate architecture documentation', async () => {
      const artifactPath = this.createArtifactPath('docs', 'architecture', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        architectureDoc,
        'High-level architecture map generated by Librarian agent',
      );

      return {
        summary: 'Architecture overview refreshed.',
        artifacts: [artifact],
      };
    });

    const apiFiles = this.input.apiFiles ?? scopePaths.map((scope) => path.join(scope, 'index.ts'));
    const endpoints = await this.collectApiEndpoints(apiFiles);

    await this.runStage('api', 'Generate API reference', async () => {
      const artifactPath = this.createArtifactPath('docs', 'api-reference', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderApiReference(endpoints),
        'Generated API endpoint documentation',
      );

      return {
        summary: `Documented ${endpoints.length} API endpoints.`,
        artifacts: [artifact],
      };
    });

    const tables = await fetchSupabasePublicSchema(this.options.supabaseClient);

    await this.runStage('database', 'Export Supabase schema', async () => {
      const artifactPath = this.createArtifactPath('docs', 'database-schema', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderDatabaseSchema(tables),
        'Database schema exported from Supabase',
      );

      return {
        summary: tables.length ? `Documented ${tables.length} tables.` : 'No tables returned by Supabase.',
        artifacts: [artifact],
      };
    });

    const developmentGuidePath = this.input.developmentGuidePath ?? 'DEVELOPMENT_GUIDE.md';
    let commands: string[] = [];
    try {
      const fullPath = path.join(this.projectRoot, developmentGuidePath);
      const content = await this.fileSystem.readFile(fullPath, 'utf8');
      const tokens = tokenizeLines(content).join('\n');
      commands = extractShellCommands(tokens);
    } catch (error) {
      this.logger(`⚠️  Unable to analyze development guide: ${(error as Error).message}`);
    }

    await this.runStage('setup-validation', 'Validate setup guide commands', async () => {
      const artifactPath = this.createArtifactPath('docs', 'setup-validation', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderSetupValidation(commands),
        'Dry-run validation of setup commands',
      );

      return {
        summary: `Analyzed ${commands.length} setup commands.`,
        artifacts: [artifact],
      };
    });

    return 'Documentation refreshed by Librarian meta-agent.';
  }
}
