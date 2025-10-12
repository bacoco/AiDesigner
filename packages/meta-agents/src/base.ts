import path from 'node:path';
import type {
  ArtifactRecord,
  FileSystem,
  MetaAgentResult,
  MetaAgentRuntimeOptions,
  StageProgress,
  StageStatus,
} from './types';
import { ArtifactManager, formatTimestamp, type StageExecutionResult } from './utils';
import { NodeFileSystem } from './utils';

export abstract class BaseMetaAgent<Input, Result extends MetaAgentResult = MetaAgentResult> {
  protected readonly id: string;
  protected readonly title: string;
  protected readonly description: string;

  protected readonly artifactManager: ArtifactManager;
  protected readonly fileSystem: FileSystem;
  protected readonly projectRoot: string;
  protected readonly logger: (message: string) => void;
  protected readonly clock: () => Date;

  private readonly stages: StageProgress[] = [];
  private readonly stageOrder: string[] = [];
  private startedAt?: Date;
  private completedAt?: Date;
  private runStamp = '';
  private artifactCounter = 0;

  constructor(
    id: string,
    title: string,
    description: string,
    protected readonly input: Input,
    protected readonly options: MetaAgentRuntimeOptions = {},
  ) {
    this.id = id;
    this.title = title;
    this.description = description;

    this.projectRoot = options.projectRoot ?? process.cwd();
    this.fileSystem = options.fileSystem ?? new NodeFileSystem();
    this.artifactManager = new ArtifactManager(this.projectRoot, this.fileSystem);

    this.logger = options.logger ?? (() => undefined);
    this.clock = options.clock ?? (() => new Date());
  }

  protected registerStage(id: string, title: string): void {
    if (this.stageOrder.includes(id)) {
      return;
    }

    const stage: StageProgress = { id, title, status: 'pending', artifacts: [] };
    this.stageOrder.push(id);
    this.stages.push(stage);
  }

  private updateStageStatus(id: string, status: StageStatus, summary?: string): StageProgress {
    const stage = this.stages.find((entry) => entry.id === id);
    if (!stage) {
      throw new Error(`Unknown stage: ${id}`);
    }

    stage.status = status;
    if (summary) {
      stage.summary = summary;
    }
    return stage;
  }

  protected async runStage(
    id: string,
    title: string,
    handler: () => Promise<StageExecutionResult>,
  ): Promise<void> {
    this.registerStage(id, title);
    this.updateStageStatus(id, 'running');
    this.logger(`▶️  ${this.title}: ${title}`);

    const result = await handler();
    const stage = this.updateStageStatus(id, 'complete', result.summary);

    if (result.artifacts) {
      stage.artifacts.push(...result.artifacts);
    }

    this.logger(`✅ ${this.title}: ${title}`);
  }

  protected createArtifactPath(baseDirectory: string, prefix: string, extension: string): string {
    const sequence = `${this.artifactCounter + 1}`.padStart(2, '0');
    const fileName = `${prefix}-${this.runStamp}-${sequence}.${extension}`;
    this.artifactCounter += 1;
    return path.posix.join(baseDirectory, fileName);
  }

  protected abstract execute(): Promise<string>;

  async run(): Promise<Result> {
    this.startedAt = this.clock();
    this.runStamp = formatTimestamp(this.startedAt);

    const summary = await this.execute();

    this.completedAt = this.clock();
    const artifacts = this.artifactManager.records;

    const result: MetaAgentResult = {
      id: this.id,
      title: this.title,
      description: this.description,
      summary,
      startedAt: this.startedAt.toISOString(),
      completedAt: this.completedAt.toISOString(),
      artifacts,
      stages: this.stageOrder.map((stageId) => {
        const stage = this.stages.find((entry) => entry.id === stageId);
        if (!stage) {
          throw new Error(`Stage not registered: ${stageId}`);
        }
        return { ...stage, artifacts: [...stage.artifacts] };
      }),
    };

    return result as Result;
  }
}
