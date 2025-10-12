import fs from 'fs-extra';
import path from 'node:path';
import type { FileSystem, ArtifactRecord, SupabaseClientLike, SupabaseColumnRow } from './types';

export class NodeFileSystem implements FileSystem {
  async ensureDir(target: string): Promise<void> {
    await fs.ensureDir(target);
  }

  async writeFile(target: string, data: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    await fs.writeFile(target, data, { encoding });
  }

  async readFile(target: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    return fs.readFile(target, { encoding });
  }

  async pathExists(target: string): Promise<boolean> {
    return fs.pathExists(target);
  }

  async readdir(target: string): Promise<string[]> {
    return fs.readdir(target);
  }

  async stat(target: string): Promise<fs.Stats> {
    return fs.stat(target);
  }
}

export class ArtifactManager {
  private readonly artifacts: ArtifactRecord[] = [];

  constructor(private readonly projectRoot: string, private readonly fileSystem: FileSystem) {}

  get records(): ArtifactRecord[] {
    return [...this.artifacts];
  }

  async write(relativePath: string, contents: string, description: string): Promise<ArtifactRecord> {
    const destination = path.join(this.projectRoot, relativePath);
    const normalized = path.normalize(destination);
    const normalizedRoot = path.normalize(this.projectRoot);

    // Ensure the resolved path is within projectRoot (prevent path traversal)
    if (!normalized.startsWith(normalizedRoot + path.sep) && normalized !== normalizedRoot) {
      throw new Error(`Path traversal detected: ${relativePath} escapes project root`);
    }

    await this.fileSystem.ensureDir(path.dirname(destination));
    await this.fileSystem.writeFile(destination, contents, 'utf8');
    const record: ArtifactRecord = { path: relativePath, description };
    this.artifacts.push(record);
    return record;
  }
}

export interface StageExecutionResult {
  summary: string;
  artifacts?: ArtifactRecord[];
}

export const formatTimestamp = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export interface SupabaseTableDefinition {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string | null;
  }>;
}

export async function fetchSupabasePublicSchema(
  client?: SupabaseClientLike,
): Promise<SupabaseTableDefinition[]> {
  if (!client) {
    return [];
  }

  const result = await client
    .from('information_schema.columns')
    .select('table_name,column_name,data_type,is_nullable,column_default')
    .eq('table_schema', 'public');

  if (result.error) {
    throw new Error(`Supabase schema query failed: ${result.error.message ?? 'Unknown error'}`);
  }

  const rows: SupabaseColumnRow[] = result.data ?? [];
  const grouped = new Map<string, SupabaseTableDefinition>();

  for (const row of rows) {
    const table = grouped.get(row.table_name) ?? {
      name: row.table_name,
      columns: [],
    };
    table.columns.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default ?? undefined,
    });
    grouped.set(row.table_name, table);
  }

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const renderMermaidComponentMap = (components: Array<{
  name: string;
  type: string;
  relations: string[];
}>): string => {
  const lines = ['graph TD'];
  for (const component of components) {
    const label = `${component.name}[${component.type}]`;
    if (component.relations.length === 0) {
      lines.push(`  ${label}`);
      continue;
    }
    for (const relation of component.relations) {
      lines.push(`  ${component.name} --> ${relation}`);
    }
  }
  return lines.join('\n');
};

export const tokenizeLines = (contents: string): string[] =>
  contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export const slidingWindow = <T,>(values: T[], size: number): T[][] => {
  const windows: T[][] = [];
  for (let index = 0; index <= values.length - size; index += 1) {
    windows.push(values.slice(index, index + size));
  }
  return windows;
};

export interface CommandCheckResult {
  command: string;
  status: 'ok' | 'skipped';
  note?: string;
}

export const extractShellCommands = (guideContent: string): string[] => {
  const commands: string[] = [];
  const lines = guideContent.split(/\r?\n/);
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (line.startsWith('$ ')) {
      commands.push(line.slice(2).trim());
      continue;
    }

    if (inCodeBlock && /^(npm|yarn|pnpm|pip|python|node|docker)/.test(line)) {
      commands.push(line);
    }
  }

  return commands;
};

export const summarizeCommands = (commands: string[]): CommandCheckResult[] =>
  commands.map((command) => ({ command, status: 'skipped', note: 'Dry-run validation (not executed)' }));

export const normalizeTechnologyStack = (stack: string[]): string[] =>
  stack.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
