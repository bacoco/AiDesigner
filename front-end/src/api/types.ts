
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
  requirements?: Record<string, any>;
  decisions?: Record<string, any>;
  nextSteps?: string;
  phaseHistory?: any[];
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
  timestamp: string;
}

export interface WSUIThemeUpdatedEvent {
  projectId: string;
  record: TweakcnPaletteRecord;
  success: boolean;
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
