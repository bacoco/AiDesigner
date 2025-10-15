
export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface ShadcnComponentInstallation {
  id: string;
  component: string;
  args: string[];
  status: 'succeeded' | 'failed';
  installedAt: string;
  metadata: Record<string, any>;
  stdout?: string;
  stderr?: string;
  error?: string | null;
}

export interface TweakcnPaletteRecord {
  id: string;
  name: string;
  tokens: Record<string, string>;
  status: 'succeeded' | 'failed';
  appliedAt: string;
  metadata: Record<string, any>;
  stdout?: string;
  stderr?: string;
  error?: string | null;
}

export interface ProjectIntegrationsState {
  drawbridge?: Record<string, any>;
  shadcn?: {
    components: ShadcnComponentInstallation[];
    lastInstalledAt?: string | null;
  };
  tweakcn?: {
    palettes: TweakcnPaletteRecord[];
    lastUpdatedAt?: string | null;
  };
  [key: string]: any;
}

export interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, any>;
  decisions?: Record<string, any>;
  nextSteps?: string;
  phaseHistory?: any[];
  createdAt?: string;
  updatedAt?: string;
  integrations?: ProjectIntegrationsState;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  phase?: string;
  metadata?: any;
  toolCalls?: ToolCall[];
}

export interface Deliverable {
  type: string;
  phase?: string;
  content: string;
  metadata?: any;
  createdAt: Date | string;
}

export interface Agent {
  id: string;
  role: string;
  persona?: string;
  dependencies?: {
    templates?: string[];
    tasks?: string[];
    checklists?: string[];
    data?: string[];
  };
}

export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: string;
  duration?: number;
}

export interface GeneratedUI {
  id: string;
  name: string;
  html: string;
  timestamp: Date;
  phase?: string;
}

export interface WSStateUpdatedEvent {
  changes: Partial<ProjectState>;
  timestamp: string;
}

export interface WSMessageAddedEvent {
  role: string;
  content: string;
  phase?: string;
  timestamp: string;
}

export interface WSDeliverableCreatedEvent {
  type: string;
  phase?: string;
  timestamp: string;
}

export interface WSDecisionRecordedEvent {
  key: string;
  value: any;
  rationale?: string;
  timestamp: string;
}

export interface WSAgentExecutedEvent {
  agentId: string;
  command: string;
  duration: number;
  success: boolean;
  timestamp: string;
}

export interface WSUIComponentInstalledEvent {
  projectId: string;
  component: string;
  record: ShadcnComponentInstallation;
  success: boolean;
  stdout?: string;
  stderr?: string;
  timestamp: string;
}

export interface WSUIThemeUpdatedEvent {
  projectId: string;
  record: TweakcnPaletteRecord;
  success: boolean;
  stdout?: string;
  stderr?: string;
  timestamp: string;
}

export interface InstallComponentRequest {
  component: string;
  args?: string[];
  metadata?: Record<string, any>;
  cwd?: string;
}

export interface InstallComponentResponse {
  success: boolean;
  output: CommandExecutionResult;
  record: ShadcnComponentInstallation;
}

export interface UpdateThemeRequest {
  palette: {
    name: string;
    tokens: Record<string, string>;
  };
  args?: string[];
  metadata?: Record<string, any>;
  cwd?: string;
}

export interface UpdateThemeResponse {
  success: boolean;
  output: CommandExecutionResult;
  record: TweakcnPaletteRecord;
}
