import path from 'node:path';
import { BaseMetaAgent } from './base';
import type { MetaAgentRuntimeOptions, RefactorInput } from './types';
import { slidingWindow, tokenizeLines } from './utils';

interface SourceFile {
  path: string;
  content: string;
}

interface DuplicateBlock {
  snippet: string;
  occurrences: Array<{ file: string; index: number }>;
}

interface ComplexityFinding {
  file: string;
  score: number;
  length: number;
  reason: string;
}

interface DependencyFinding {
  name: string;
  version: string;
  reason: string;
}

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py'];

export class RefactorMetaAgent extends BaseMetaAgent<RefactorInput> {
  constructor(input: RefactorInput, options?: MetaAgentRuntimeOptions) {
    super(
      'refactor',
      'Refactor Technical Debt Inspector',
      'Identifies duplication, complexity hot spots, and dependency risks.',
      input,
      options,
    );
  }

  private async listFiles(relativeDir: string): Promise<string[]> {
    const baseDir = path.join(this.projectRoot, relativeDir);
    try {
      const entries = await this.options.fileSystem?.readdir(baseDir);
      if (!entries) {
        return [];
      }
      const files: string[] = [];
      for (const entry of entries) {
        const absolutePath = path.join(baseDir, entry);
        const stats = await this.options.fileSystem?.stat(absolutePath);
        if (!stats) {
          continue;
        }
        if (stats.isDirectory()) {
          const nested = await this.listFiles(path.relative(this.projectRoot, absolutePath));
          files.push(...nested);
        } else {
          files.push(path.relative(this.projectRoot, absolutePath));
        }
      }
      return files;
    } catch (error) {
      this.logger(`⚠️  Unable to read scope ${relativeDir}: ${(error as Error).message}`);
      return [];
    }
  }

  private async loadSourceFiles(): Promise<SourceFile[]> {
    const files: SourceFile[] = [];
    for (const scope of this.input.scopePaths) {
      const discovered = await this.listFiles(scope);
      for (const relative of discovered) {
        if (!SOURCE_EXTENSIONS.some((extension) => relative.endsWith(extension))) {
          continue;
        }
        const absolute = path.join(this.projectRoot, relative);
        try {
          const content = await this.options.fileSystem?.readFile(absolute, 'utf8');
          if (content) {
            files.push({ path: relative, content });
          }
        } catch (error) {
          this.logger(`⚠️  Failed to read ${relative}: ${(error as Error).message}`);
        }
      }
    }
    return files;
  }

  private detectDuplications(files: SourceFile[]): DuplicateBlock[] {
    const blocks = new Map<string, DuplicateBlock>();
    for (const file of files) {
      const lines = tokenizeLines(file.content);
      const windows = slidingWindow(lines, 5);
      windows.forEach((window, index) => {
        const snippet = window.join('\n');
        if (snippet.length < 40) {
          return;
        }
        const block = blocks.get(snippet) ?? { snippet, occurrences: [] };
        block.occurrences.push({ file: file.path, index });
        blocks.set(snippet, block);
      });
    }
    return Array.from(blocks.values()).filter((block) => block.occurrences.length > 1);
  }

  private analyzeComplexity(files: SourceFile[]): ComplexityFinding[] {
    const findings: ComplexityFinding[] = [];
    for (const file of files) {
      const tokens = tokenizeLines(file.content);
      const controlFlowMatches = file.content.match(/\b(if|for|while|switch|case|catch)\b|&&|\|\|/g);
      const score = controlFlowMatches ? controlFlowMatches.length : 0;
      const longFunctions = (file.content.match(/function\s+\w+|=>\s*\(/g) ?? []).length;
      const reasonParts: string[] = [];
      if (score > 12) {
        reasonParts.push(`High branch count (${score})`);
      }
      if (tokens.length > 250) {
        reasonParts.push(`Large file (${tokens.length} significant lines)`);
      }
      if (longFunctions > 8) {
        reasonParts.push(`Many function declarations (${longFunctions})`);
      }
      if (reasonParts.length > 0) {
        findings.push({
          file: file.path,
          score,
          length: tokens.length,
          reason: reasonParts.join('; '),
        });
      }
    }
    return findings;
  }

  private async auditDependencies(): Promise<DependencyFinding[]> {
    const findings: DependencyFinding[] = [];
    const files = this.input.dependencyFiles ?? ['package.json', 'requirements.txt'];
    for (const dependencyFile of files) {
      const absolute = path.join(this.projectRoot, dependencyFile);
      try {
        const exists = await this.options.fileSystem?.pathExists(absolute);
        if (!exists) {
          continue;
        }
        if (dependencyFile.endsWith('package.json')) {
          const raw = await this.options.fileSystem?.readFile(absolute, 'utf8');
          if (raw) {
            const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
            const all = { ...pkg.dependencies, ...pkg.devDependencies };
            for (const [name, version] of Object.entries(all)) {
              if (/beta|alpha|rc/.test(version)) {
                findings.push({ name, version, reason: 'Pre-release version detected' });
              } else if (/^\^?0\./.test(version)) {
                findings.push({ name, version, reason: 'Major version 0 indicates unstable API' });
              }
            }
          }
        } else if (dependencyFile.endsWith('requirements.txt')) {
          const raw = await this.options.fileSystem?.readFile(absolute, 'utf8');
          if (raw) {
            for (const line of raw.split(/\r?\n/)) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('#')) {
                continue;
              }
              if (/(alpha|beta|rc)/i.test(trimmed)) {
                findings.push({ name: trimmed, version: 'prerelease', reason: 'Pre-release dependency in requirements.txt' });
              }
            }
          }
        }
      } catch (error) {
        this.logger(`⚠️  Failed to audit ${dependencyFile}: ${(error as Error).message}`);
      }
    }
    return findings;
  }

  private renderDuplicationReport(blocks: DuplicateBlock[]): string {
    const lines = ['# Duplication Report', ''];
    if (!blocks.length) {
      lines.push('No duplicated blocks detected in the analyzed scope.');
      return lines.join('\n');
    }

    for (const block of blocks) {
      lines.push('---', '', '```', block.snippet, '```', '', 'Occurrences:');
      for (const occurrence of block.occurrences) {
        lines.push(`- ${occurrence.file} (window ${occurrence.index + 1})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private renderComplexityReport(findings: ComplexityFinding[]): string {
    const lines = ['# Complexity Analysis', ''];
    if (!findings.length) {
      lines.push('No complexity hotspots detected.');
      return lines.join('\n');
    }

    for (const finding of findings) {
      lines.push(`- **${finding.file}** → ${finding.reason} (score: ${finding.score}, lines: ${finding.length})`);
    }

    return lines.join('\n');
  }

  private renderDependencyReport(findings: DependencyFinding[]): string {
    const lines = ['# Dependency Audit', ''];
    if (!findings.length) {
      lines.push('No risky dependencies detected.');
      return lines.join('\n');
    }

    for (const finding of findings) {
      lines.push(`- **${finding.name}** @ ${finding.version} — ${finding.reason}`);
    }

    return lines.join('\n');
  }

  protected async execute(): Promise<string> {
    const files = await this.loadSourceFiles();
    const duplications = this.detectDuplications(files);
    const complexity = this.analyzeComplexity(files);
    const dependencies = await this.auditDependencies();

    await this.runStage('duplication', 'Detect structural duplication', async () => {
      const artifactPath = this.createArtifactPath('reports/refactor', 'duplication', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderDuplicationReport(duplications),
        'Duplicated code blocks detected by Refactor agent',
      );

      return {
        summary: duplications.length ? `Identified ${duplications.length} duplicate blocks.` : 'No duplicate blocks found.',
        artifacts: [artifact],
      };
    });

    await this.runStage('complexity', 'Analyze cyclomatic complexity heuristics', async () => {
      const artifactPath = this.createArtifactPath('reports/refactor', 'complexity', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderComplexityReport(complexity),
        'Complexity hotspots summary',
      );

      return {
        summary: complexity.length ? `Flagged ${complexity.length} complex files.` : 'No complexity hotspots detected.',
        artifacts: [artifact],
      };
    });

    await this.runStage('dependencies', 'Audit dependency obsolescence', async () => {
      const artifactPath = this.createArtifactPath('reports/refactor', 'dependencies', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderDependencyReport(dependencies),
        'Dependency risk assessment',
      );

      return {
        summary: dependencies.length ? `Found ${dependencies.length} risky dependencies.` : 'Dependencies look healthy.',
        artifacts: [artifact],
      };
    });

    const summaryPath = this.createArtifactPath('reports/refactor', 'technical-debt', 'md');
    const summaryLines = [
      '# Technical Debt Summary',
      '',
      `- Duplicate blocks: ${duplications.length}`,
      `- Complexity findings: ${complexity.length}`,
      `- Dependency risks: ${dependencies.length}`,
      '',
      'Review the linked reports for remediation recommendations.',
    ];

    await this.artifactManager.write(
      summaryPath,
      summaryLines.join('\n'),
      'Executive summary of technical debt analysis',
    );

    return 'Technical debt assessment completed.';
  }
}
