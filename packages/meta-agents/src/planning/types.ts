export interface FeatureRequest {
  title: string;
  summary?: string;
  goals?: string[];
  constraints?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface ArchitectTaskNode {
  id: string;
  title: string;
  mission: string;
  persona: string;
  lane?: string;
  dependencies: string[];
  metadata?: Record<string, unknown>;
}

export type ArchitectDependencyKind = 'blocks' | 'relates_to' | 'unblocks';

export interface ArchitectDependencyEdge {
  from: string;
  to: string;
  kind: ArchitectDependencyKind;
}

export interface ArchitectTaskGraph {
  tasks: ArchitectTaskNode[];
  edges: ArchitectDependencyEdge[];
  manifest: {
    name: string;
    version?: string;
    path: string;
    fetchedAt: string;
  };
  rawResponse: unknown;
}

export interface SubAgentDefinition {
  id: string;
  agent: string;
  mission: string;
  dependencies: string[];
  metadata?: Record<string, unknown>;
}

export interface ArchitectPlanningResult {
  graph: ArchitectTaskGraph;
  developerSubAgents: SubAgentDefinition[];
}
