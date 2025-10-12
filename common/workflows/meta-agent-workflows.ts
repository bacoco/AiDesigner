
import { GenesisMetaAgent, LibrarianMetaAgent, RefactorMetaAgent } from '../../packages/meta-agents/src';
import type {
  GenesisInput,
  LibrarianInput,
  MetaAgentRuntimeOptions,
  RefactorInput,
  WorkflowSession,
} from '../../packages/meta-agents/src/types';
import { NodeFileSystem } from '../../packages/meta-agents/src/utils';

export type MetaAgentWorkflowId = 'genesis' | 'librarian' | 'refactor';

interface WorkflowDefinition {
  id: MetaAgentWorkflowId;
  title: string;
  description: string;
}

interface WorkflowStartResult {
  sessionId: string;
  result: WorkflowSession;
}

interface WorkflowServiceOptions extends MetaAgentRuntimeOptions {
  projectRoot?: string;
}

type WorkflowInputMap = {
  genesis: GenesisInput;
  librarian: LibrarianInput;
  refactor: RefactorInput;
};

const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: 'genesis',
    title: 'Genesis Project Bootstrap',
    description: 'Decompose a project brief into scaffolding sub-agents and execution plan.',
  },
  {
    id: 'librarian',
    title: 'Librarian Documentation Sync',
    description: 'Regenerate architecture, API, and setup documentation for the current codebase.',
  },
  {
    id: 'refactor',
    title: 'Refactor Technical Debt Survey',
    description: 'Detect duplication, complexity hotspots, and risky dependencies.',
  },
];

export class MetaAgentWorkflowService {
  private readonly sessions = new Map<string, WorkflowSession>();
  private readonly fileSystem = this.options.fileSystem ?? new NodeFileSystem();

  constructor(private readonly options: WorkflowServiceOptions = {}) {}

  listWorkflows(): WorkflowDefinition[] {
    return [...WORKFLOW_DEFINITIONS];
  }

  getSession(sessionId: string): WorkflowSession | undefined {
    return this.sessions.get(sessionId);
  }

  private createRuntime(): MetaAgentRuntimeOptions {
    return {
      ...this.options,
      fileSystem: this.fileSystem,
    };
  }

  private buildAgent(workflowId: 'genesis', input: GenesisInput): GenesisMetaAgent;
  private buildAgent(workflowId: 'librarian', input: LibrarianInput): LibrarianMetaAgent;
  private buildAgent(workflowId: 'refactor', input: RefactorInput): RefactorMetaAgent;
  private buildAgent(workflowId: MetaAgentWorkflowId, input: unknown) {
    const runtime = this.createRuntime();
    switch (workflowId) {
      case 'genesis':
        return new GenesisMetaAgent(input as GenesisInput, runtime);
      case 'librarian':
        return new LibrarianMetaAgent(input as LibrarianInput, runtime);
      case 'refactor':
        return new RefactorMetaAgent(input as RefactorInput, runtime);
      default:
        throw new Error(`Unsupported workflow: ${workflowId}`);
    }
  }

  async start<K extends MetaAgentWorkflowId>(workflowId: K, input: WorkflowInputMap[K]): Promise<WorkflowStartResult> {
    const agent = this.buildAgent(workflowId, input);
    const result = (await agent.run()) as WorkflowSession;
    const sessionId = `${workflowId}-${Date.now()}`;
    this.sessions.set(sessionId, result);
    return { sessionId, result };
  }

  getActiveSessions(): WorkflowSession[] {
    return [...this.sessions.values()];
  }
}

export type { WorkflowDefinition, WorkflowStartResult };
