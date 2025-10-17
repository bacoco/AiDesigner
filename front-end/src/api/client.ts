import type {
  ProjectState,
  Message,
  Deliverable,
  Agent,
  AgentExecutionResult,
  InstalledComponent,
  UIRegistryComponent,
  UIPreview,
  UITheme,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createProject(name?: string): Promise<{ projectId: string; state: ProjectState }> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async listUIRegistry(): Promise<{ components: UIRegistryComponent[] }> {
    return this.request('/api/ui/registry');
  }

  async getUIComponents(projectId: string): Promise<{
    components: InstalledComponent[];
    preview?: UIPreview;
  }> {
    return this.request(`/api/projects/${projectId}/ui/components`);
  }

  async installUIComponent(
    projectId: string,
    componentId: string
  ): Promise<{ success: boolean; component?: InstalledComponent }> {
    return this.request(`/api/projects/${projectId}/ui/components`, {
      method: 'POST',
      body: JSON.stringify({ componentId }),
    });
  }

  async getUITheme(projectId: string): Promise<{ theme: UITheme }> {
    return this.request(`/api/projects/${projectId}/ui/theme`);
  }

  async updateUITheme(
    projectId: string,
    theme: UITheme
  ): Promise<{ theme: UITheme }> {
    return this.request(`/api/projects/${projectId}/ui/theme`, {
      method: 'PATCH',
      body: JSON.stringify(theme),
    });
  }

  async getUIPreview(projectId: string): Promise<UIPreview> {
    return this.request(`/api/projects/${projectId}/ui/preview`);
  }

  async getState(projectId: string): Promise<ProjectState> {
    return this.request(`/api/projects/${projectId}/state`);
  }

  async updateState(
    projectId: string,
    updates: Partial<ProjectState>
  ): Promise<ProjectState> {
    return this.request(`/api/projects/${projectId}/state`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getConversation(
    projectId: string,
    limit?: number
  ): Promise<{ messages: Message[] }> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/api/projects/${projectId}/conversation${query}`);
  }

  async addMessage(
    projectId: string,
    role: string,
    content: string,
    metadata?: any
  ): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${projectId}/conversation`, {
      method: 'POST',
      body: JSON.stringify({ role, content, metadata }),
    });
  }

  async getDeliverables(projectId: string): Promise<{ deliverables: Deliverable[] }> {
    return this.request(`/api/projects/${projectId}/deliverables`);
  }

  async getDeliverable(projectId: string, type: string): Promise<Deliverable> {
    return this.request(`/api/projects/${projectId}/deliverables/${type}`);
  }

  async createDeliverable(
    projectId: string,
    type: string,
    content: string,
    metadata?: any
  ): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${projectId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify({ type, content, metadata }),
    });
  }

  async getDecisions(projectId: string): Promise<{ decisions: Record<string, any> }> {
    return this.request(`/api/projects/${projectId}/decisions`);
  }

  async recordDecision(
    projectId: string,
    key: string,
    value: any,
    rationale?: string
  ): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${projectId}/decisions`, {
      method: 'POST',
      body: JSON.stringify({ key, value, rationale }),
    });
  }

  async listAgents(): Promise<{ agents: Agent[] }> {
    return this.request('/api/agents');
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request(`/api/agents/${agentId}`);
  }

  async executeAgent(
    agentId: string,
    command: string,
    context: any,
    projectId?: string
  ): Promise<AgentExecutionResult> {
    return this.request(`/api/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ command, context, projectId }),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  async saveThemeConfiguration(
    projectId: string,
    theme: any
  ): Promise<{ id: string; theme: any }> {
    return this.request(`/api/projects/${projectId}/themes`, {
      method: 'POST',
      body: JSON.stringify(theme),
    });
  }

  async listThemeConfigurations(projectId: string): Promise<{ themes: any[] }> {
    return this.request(`/api/projects/${projectId}/themes`);
  }

  async getThemeConfiguration(
    projectId: string,
    themeId: string
  ): Promise<{ theme: any }> {
    return this.request(`/api/projects/${projectId}/themes/${themeId}`);
  }

  async updateThemeConfiguration(
    projectId: string,
    themeId: string,
    theme: any
  ): Promise<{ theme: any }> {
    return this.request(`/api/projects/${projectId}/themes/${themeId}`, {
      method: 'PATCH',
      body: JSON.stringify(theme),
    });
  }

  async deleteThemeConfiguration(
    projectId: string,
    themeId: string
  ): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${projectId}/themes/${themeId}`, {
      method: 'DELETE',
    });
  }

  async shareTheme(
    projectId: string,
    themeId: string,
    isPublic: boolean
  ): Promise<{ shareUrl?: string; success: boolean }> {
    return this.request(`/api/projects/${projectId}/themes/${themeId}/share`, {
      method: 'POST',
      body: JSON.stringify({ isPublic }),
    });
  }

  async listPublicThemes(): Promise<{ themes: any[] }> {
    return this.request('/api/themes/public');
  }

  async generateColorSuggestions(baseColor: string): Promise<{ suggestions: any }> {
    return this.request('/api/ai/color-suggestions', {
      method: 'POST',
      body: JSON.stringify({ baseColor }),
    });
  }

  async generateDarkModeVariant(theme: any): Promise<{ darkTheme: any }> {
    return this.request('/api/ai/generate-dark-mode', {
      method: 'POST',
      body: JSON.stringify({ theme }),
    });
  }
}

export const apiClient = new APIClient();
