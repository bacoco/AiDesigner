
export interface UITheme {
  primary: string;
  accent: string;
  background: string;
  updatedAt?: string;
}

export interface UIRegistryComponent {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  source?: string;
  category?: string;
  previewUrl?: string;
  framework?: string;
}

export interface InstalledComponent extends UIRegistryComponent {
  version?: string;
  installedAt?: string;
  status?: 'installed' | 'pending' | 'failed';
  previewHtml?: string;
}

export interface UIPreview {
  html?: string;
  url?: string;
  updatedAt?: string;
}

export interface ProjectUIState {
  components?: InstalledComponent[];
  preview?: UIPreview;
  theme?: UITheme;
}

export interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, unknown>;
  decisions?: Record<string, unknown>;
  nextSteps?: string;
  phaseHistory?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  ui?: ProjectUIState;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  phase?: string;
  metadata?: Record<string, unknown>;
  toolCalls?: ToolCall[];
}

export interface Deliverable {
  type: string;
  phase?: string;
  content: string;
  metadata?: Record<string, unknown>;
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
  output?: unknown;
  error?: string;
  duration: number;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
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

export interface WSUIComponentsEvent {
  components?: InstalledComponent[];
  preview?: UIPreview;
  timestamp: string;
}

export interface WSUIThemeEvent {
  theme: UITheme;
  timestamp: string;
}

export interface WSDecisionRecordedEvent {
  key: string;
  value: unknown;
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
