import path from 'path';
import { logger } from '../index';

const projectStatePath = path.resolve(__dirname, '../../../../.dev/lib/project-state.js');
const { ProjectState: ProjectStateClass } = require(projectStatePath);

export interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, any>;
  decisions?: Record<string, any>;
  nextSteps?: string;
  phaseHistory?: any[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: string;
  metadata?: any;
}

export interface Deliverable {
  type: string;
  phase?: string;
  content: string;
  metadata?: any;
  createdAt: Date;
}

class ProjectService {
  private projects: Map<string, any> = new Map();

  async createProject(name?: string): Promise<{ projectId: string; state: ProjectState }> {
    try {
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const projectState = new ProjectStateClass();
      await projectState.initialize();
      
      if (name) {
        await projectState.updateState({ projectName: name });
      }
      
      this.projects.set(projectId, projectState);
      
      logger.info(`Created project: ${projectId}`);
      
      return {
        projectId,
        state: projectState.getState(),
      };
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<any> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    return project;
  }

  async getState(projectId: string): Promise<ProjectState> {
    const project = await this.getProject(projectId);
    return project.getState();
  }

  async updateState(projectId: string, updates: Partial<ProjectState>): Promise<ProjectState> {
    const project = await this.getProject(projectId);
    await project.updateState(updates);
    return project.getState();
  }

  async getConversation(projectId: string, limit?: number): Promise<Message[]> {
    const project = await this.getProject(projectId);
    return project.getConversation(limit);
  }

  async addMessage(
    projectId: string,
    role: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.addMessage(role, content, metadata);
  }

  async getDeliverables(projectId: string): Promise<Deliverable[]> {
    const project = await this.getProject(projectId);
    const state = project.getState();
    
    if (state.deliverables && Array.isArray(state.deliverables)) {
      return state.deliverables;
    }
    
    return [];
  }

  async getDeliverable(projectId: string, type: string): Promise<Deliverable | null> {
    const deliverables = await this.getDeliverables(projectId);
    return deliverables.find(d => d.type === type) || null;
  }

  async storeDeliverable(
    projectId: string,
    type: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.storeDeliverable(type, content, metadata);
  }

  async recordDecision(
    projectId: string,
    key: string,
    value: any,
    rationale?: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.recordDecision(key, value, rationale);
  }

  async getDecisions(projectId: string): Promise<Record<string, any>> {
    const project = await this.getProject(projectId);
    const state = project.getState();
    return state.decisions || {};
  }
}

export const projectService = new ProjectService();
