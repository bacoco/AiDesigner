import path from 'node:path';
import { GenesisMetaAgent } from '../../packages/meta-agents/src/genesis';
import { LibrarianMetaAgent } from '../../packages/meta-agents/src/librarian';
import { RefactorMetaAgent } from '../../packages/meta-agents/src/refactor';
import { MetaAgentWorkflowService } from '../../common/workflows/meta-agent-workflows';
import type { FileSystem } from '../../packages/meta-agents/src/types';

describe('meta-agent workflows', () => {
  class MemoryStats {
    constructor(private readonly kind: 'file' | 'dir') {}

    isDirectory() {
      return this.kind === 'dir';
    }

    isFile() {
      return this.kind === 'file';
    }
  }

  class MemoryFileSystem implements FileSystem {
    private readonly files = new Map<string, string>();
    private readonly directories = new Map<string, Set<string>>();

    constructor(initialFiles: Record<string, string> = {}, private readonly root = '/project') {
      this.ensureDirSync('/');
      this.ensureDirSync(this.root);
      for (const [relative, content] of Object.entries(initialFiles)) {
        this.writeFileSync(this.absolute(relative), content);
      }
    }

    private absolute(target: string): string {
      return path.posix.normalize(target.startsWith('/') ? target : path.posix.join(this.root, target));
    }

    private ensureDirSync(target: string) {
      const normalized = path.posix.normalize(target);
      if (this.directories.has(normalized)) {
        return;
      }
      const parent = path.posix.dirname(normalized);
      if (normalized !== parent) {
        this.ensureDirSync(parent);
      }
      this.directories.set(normalized, new Set());
      if (normalized !== '/') {
        this.directories.get(parent)?.add(path.posix.basename(normalized));
      }
    }

    private writeFileSync(filePath: string, data: string) {
      const normalized = path.posix.normalize(filePath);
      const directory = path.posix.dirname(normalized);
      this.ensureDirSync(directory);
      this.files.set(normalized, data);
      this.directories.get(directory)?.add(path.posix.basename(normalized));
    }

    async ensureDir(dirPath: string) {
      this.ensureDirSync(dirPath);
    }

    async writeFile(filePath: string, data: string, _encoding: BufferEncoding = 'utf8') {
      // Data is already a string, no need to convert through Buffer
      this.writeFileSync(filePath, data);
    }

    async readFile(filePath: string, encoding: BufferEncoding = 'utf8') {
      const normalized = this.absolute(filePath);
      const contents = this.files.get(normalized);
      if (contents === undefined) {
        throw new Error(`ENOENT: ${normalized}`);
      }
      // Only convert encoding if needed
      return encoding === 'utf8' ? contents : Buffer.from(contents, 'utf8').toString(encoding);
    }

    async pathExists(target: string) {
      const normalized = this.absolute(target);
      return this.files.has(normalized) || this.directories.has(normalized);
    }

    async readdir(target: string) {
      const normalized = this.absolute(target);
      const children = this.directories.get(normalized);
      if (!children) {
        throw new Error(`ENOTDIR: ${normalized}`);
      }
      return Array.from(children);
    }

    async stat(target: string) {
      const normalized = this.absolute(target);
      if (this.directories.has(normalized)) {
        return new MemoryStats('dir');
      }
      if (this.files.has(normalized)) {
        return new MemoryStats('file');
      }
      throw new Error(`ENOENT: ${normalized}`);
    }
  }

  const fixedClock = () => new Date('2025-01-02T03:04:05Z');

  it('generates genesis scaffolding artifacts', async () => {
    const fs = new MemoryFileSystem();
    const agent = new GenesisMetaAgent(
      {
        projectName: 'orion',
        projectType: 'AI research notebook',
        technologyStack: ['Next.js', 'Supabase', 'Playwright'],
      },
      { projectRoot: '/project', fileSystem: fs, clock: fixedClock },
    );

    const result = await agent.run();

    expect(result.artifacts).toHaveLength(4);
    const blueprint = result.artifacts.find((artifact) => artifact.path.includes('blueprint'));
    expect(blueprint?.path).toContain('reports/genesis/blueprint-20250102-030405-01.md');
    await expect(fs.readFile(path.posix.join('/project', blueprint!.path))).resolves.toContain('# Genesis Blueprint');
  });

  it('refreshes documentation with mocked Supabase data', async () => {
    const fs = new MemoryFileSystem({
      'src/api/index.ts': "router.get('/health', handler);",
      'src/ui/component.ts': 'export const Component = () => null;',
      'DEVELOPMENT_GUIDE.md': '```\nnpm install\nnpm run build\n```',
    });

    const supabaseClient = {
      from() {
        return {
          select() {
            return {
              async eq() {
                return {
                  data: [
                    {
                      table_name: 'profiles',
                      column_name: 'id',
                      data_type: 'uuid',
                      is_nullable: 'NO',
                      column_default: null,
                    },
                  ],
                };
              },
            };
          },
        };
      },
    };

    const agent = new LibrarianMetaAgent(
      { scopePaths: ['src'], apiFiles: ['src/api/index.ts'] },
      { projectRoot: '/project', fileSystem: fs, supabaseClient, clock: fixedClock },
    );

    const result = await agent.run();

    expect(result.artifacts).toHaveLength(4);
    const schema = result.artifacts.find((artifact) => artifact.path.includes('database-schema'));
    await expect(fs.readFile(path.posix.join('/project', schema!.path))).resolves.toContain('## profiles');
  });

  it('produces technical debt reports', async () => {
    const duplicatedSnippet = [
      'function sample() {',
      "  console.log('alpha');",
      "  console.log('beta');",
      "  console.log('gamma');",
      "  console.log('delta');",
      '}',
      '',
    ].join('\n');
    const fs = new MemoryFileSystem({
      'src/a.ts': `${duplicatedSnippet}\nexport const a = 1;\n`,
      'src/b.ts': `${duplicatedSnippet}\nexport const b = 2;\n`,
      'src/complex.ts': 'function heavy() { if (true) { for (let i = 0; i < 10; i++) { if (i % 2) { console.log(i); } } } }',
      'package.json': JSON.stringify({ dependencies: { lodash: '^0.1.0', express: '^4.18.0' } }),
    });

    const agent = new RefactorMetaAgent(
      { scopePaths: ['src'], dependencyFiles: ['package.json'] },
      { projectRoot: '/project', fileSystem: fs, clock: fixedClock },
    );

    const result = await agent.run();

    expect(result.artifacts).toHaveLength(4);
    const duplicationReport = await fs.readFile(path.posix.join('/project', result.artifacts[0].path));
    expect(duplicationReport).toContain('Duplication Report');
    const dependencyReport = await fs.readFile(path.posix.join('/project', result.artifacts[2].path));
    expect(dependencyReport).toContain('lodash');
  });

  it('orchestrates workflows through the service', async () => {
    const fs = new MemoryFileSystem({
      'src/index.ts': 'export const noop = () => null;',
      'DEVELOPMENT_GUIDE.md': '$ npm install',
    });
    const supabaseClient = {
      from() {
        return {
          select() {
            return {
              async eq() {
                return { data: [] };
              },
            };
          },
        };
      },
    };

    const service = new MetaAgentWorkflowService({
      projectRoot: '/project',
      fileSystem: fs,
      supabaseClient,
      clock: fixedClock,
    });

    const { sessionId, result } = await service.start('librarian', { scopePaths: ['src'] });

    expect(sessionId).toMatch(/^librarian-/);
    expect(result.stages).toHaveLength(4);
    expect(service.getSession(sessionId)?.summary).toContain('Documentation refreshed');
  });
});
