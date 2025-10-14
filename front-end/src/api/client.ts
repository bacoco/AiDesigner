import type {
  ProjectState,
  Message,
  Deliverable,
  Agent,
  AgentExecutionResult,
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
}

export const apiClient = new APIClient();
