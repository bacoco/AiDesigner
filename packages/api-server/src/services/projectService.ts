import path from 'path';
import crypto from 'crypto';
import { logger } from '../config/logger';
import { NotFoundError } from '../middleware/errorHandler';

const projectStatePath = process.env.PROJECT_STATE_PATH
  ?? path.resolve(__dirname, '../../../../.dev/lib/project-state.js');

interface StoredDeliverableRecord {
  content?: string;
  timestamp?: string;
  [key: string]: unknown;
}

type DeliverablesByPhase = Record<string, Record<string, StoredDeliverableRecord>>;

interface ProjectStateInstance {
  initialize(): Promise<void>;
  updateState(updates: Partial<ProjectState>): Promise<void>;
  getState(): ProjectState & {
    deliverables?: DeliverablesByPhase;
    decisions?: Record<string, unknown>;
  };
  getConversation(limit?: number): Promise<Message[]>;
  addMessage(
    role: Message['role'],
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  storeDeliverable(
    type: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  recordDecision(
    key: string,
    value: unknown,
    rationale?: string
  ): Promise<void>;
  getAllDeliverables?(): DeliverablesByPhase;
  getDeliverable?(phase: string, type: string): StoredDeliverableRecord | undefined;
}

type ProjectStateConstructor = new () => ProjectStateInstance;

const { ProjectState: ProjectStateClass } = require(projectStatePath) as {
  ProjectState: ProjectStateConstructor;
};

export interface ProjectState {
  projectId?: string;
  projectName?: string;
  currentPhase?: string;
  requirements?: Record<string, unknown>;
  decisions?: Record<string, unknown>;
  nextSteps?: string;
  phaseHistory?: Array<Record<string, unknown>>;
  deliverables?: DeliverablesByPhase;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: string;
  metadata?: Record<string, unknown>;
}

export interface Deliverable {
  type: string;
  phase?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

class ProjectService {
  private projects: Map<string, ProjectStateInstance> = new Map();
  private projectLastAccessed: Map<string, number> = new Map();
  private readonly MAX_PROJECTS = 1000; // Maximum number of projects to keep in memory
  private readonly PROJECT_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanupStaleProjects(), 60 * 60 * 1000);
    // Don't keep the event loop alive solely for cleanup
    this.cleanupTimer.unref?.();
  }

  private cleanupStaleProjects(): void {
    const now = Date.now();
    const projectsToDelete = new Set<string>();

    // Mark TTL-expired projects
    for (const [projectId, lastAccessed] of this.projectLastAccessed.entries()) {
      if (now - lastAccessed > this.PROJECT_TIMEOUT_MS) {
        projectsToDelete.add(projectId);
      }
    }

    // Compute size after TTL; then enforce MAX with LRU
    const sizeAfterTTL = this.projects.size - projectsToDelete.size;
    if (sizeAfterTTL > this.MAX_PROJECTS) {
      const lru = Array.from(this.projectLastAccessed.entries())
        .filter(([id]) => !projectsToDelete.has(id))
        .sort((a, b) => a[1] - b[1]);
      const excess = sizeAfterTTL - this.MAX_PROJECTS;
      for (let i = 0; i < excess && i < lru.length; i++) {
        projectsToDelete.add(lru[i][0]);
      }
    }

    for (const projectId of projectsToDelete) {
      this.projects.delete(projectId);
      this.projectLastAccessed.delete(projectId);
      logger.info(`Cleaned up stale project: ${projectId}`);
    }

    if (projectsToDelete.size > 0) {
      logger.info(`Cleaned up ${projectsToDelete.size} stale projects. Current count: ${this.projects.size}`);
    }
  }

  public shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async createProject(name?: string): Promise<{ projectId: string; state: ProjectState }> {
    try {
      const projectId = `proj-${crypto.randomUUID()}`;

      const projectState = new ProjectStateClass();
      await projectState.initialize();
      
      if (name) {
        await projectState.updateState({ projectName: name });
      }
      
      this.projects.set(projectId, projectState);
      this.projectLastAccessed.set(projectId, Date.now());
      
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

  async getProject(projectId: string): Promise<ProjectStateInstance> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new NotFoundError(`Project ${projectId}`);
    }
    this.projectLastAccessed.set(projectId, Date.now());
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
    role: Message['role'],
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.addMessage(role, content, metadata);
  }

  async getDeliverables(projectId: string): Promise<Deliverable[]> {
    const project = await this.getProject(projectId);

    const deliverablesByPhase: DeliverablesByPhase =
      typeof project.getAllDeliverables === 'function'
        ? project.getAllDeliverables()
        : (project.getState().deliverables ?? {});

    const deliverables: Deliverable[] = [];

    for (const [phase, phaseDeliverables] of Object.entries(deliverablesByPhase)) {
      if (!phaseDeliverables || typeof phaseDeliverables !== 'object') {
        continue;
      }

      for (const [type, rawRecord] of Object.entries(phaseDeliverables)) {
        if (!rawRecord || typeof rawRecord !== 'object') {
          continue;
        }

        const record = rawRecord as StoredDeliverableRecord;
        if (typeof record.content !== 'string') {
          continue;
        }

        const { content, timestamp, ...rest } = record;
        const parsedDate = timestamp ? new Date(timestamp) : new Date();
        const createdAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const metadataEntries = Object.entries(rest);
        const metadata = metadataEntries.length > 0
          ? (Object.fromEntries(metadataEntries) as Record<string, unknown>)
          : undefined;

        deliverables.push({
          type,
          phase,
          content,
          metadata,
          createdAt,
        });
      }
    }

    deliverables.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return deliverables;
  }

  async getDeliverable(projectId: string, type: string): Promise<Deliverable | null> {
    const deliverables = await this.getDeliverables(projectId);
    let latest: Deliverable | null = null;

    for (const deliverable of deliverables) {
      if (deliverable.type !== type) {
        continue;
      }

      if (!latest || deliverable.createdAt > latest.createdAt) {
        latest = deliverable;
      }
    }

    return latest;
  }

  async storeDeliverable(
    projectId: string,
    type: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.storeDeliverable(type, content, metadata);
  }

  async recordDecision(
    projectId: string,
    key: string,
    value: unknown,
    rationale?: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    await project.recordDecision(key, value, rationale);
  }

  async getDecisions(projectId: string): Promise<Record<string, unknown>> {
    const project = await this.getProject(projectId);
    const state = project.getState();
    return state.decisions || {};
  }
}

export const projectService = new ProjectService();
