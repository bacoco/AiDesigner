import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { io } from '../index';

export class ProjectController {
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const result = await projectService.createProject(name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getState(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const state = await projectService.getState(projectId);
      res.json(state);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async updateState(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const updates = req.body;
      
      const state = await projectService.updateState(projectId, updates);
      
      io.to(`project:${projectId}`).emit('state:updated', {
        changes: updates,
        timestamp: new Date().toISOString(),
      });
      
      res.json(state);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const messages = await projectService.getConversation(projectId, limit);
      res.json({ messages });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { role, content, metadata } = req.body;
      
      if (!role || !content) {
        throw new BadRequestError('Role and content are required');
      }
      
      await projectService.addMessage(projectId, role, content, metadata);
      
      io.to(`project:${projectId}`).emit('message:added', {
        role,
        content,
        phase: metadata?.phase,
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async getDeliverables(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const deliverables = await projectService.getDeliverables(projectId);
      res.json({ deliverables });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async getDeliverable(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, type } = req.params;
      const deliverable = await projectService.getDeliverable(projectId, type);
      
      if (!deliverable) {
        throw new NotFoundError(`Deliverable ${type}`);
      }
      
      res.json(deliverable);
    } catch (error) {
      next(error);
    }
  }

  async createDeliverable(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { type, content, metadata } = req.body;
      
      if (!type || !content) {
        throw new BadRequestError('Type and content are required');
      }
      
      await projectService.storeDeliverable(projectId, type, content, metadata);
      
      io.to(`project:${projectId}`).emit('deliverable:created', {
        type,
        phase: metadata?.phase,
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async getDecisions(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const decisions = await projectService.getDecisions(projectId);
      res.json({ decisions });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }

  async recordDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { key, value, rationale } = req.body;
      
      if (!key || value === undefined) {
        throw new BadRequestError('Key and value are required');
      }
      
      await projectService.recordDecision(projectId, key, value, rationale);
      
      io.to(`project:${projectId}`).emit('decision:recorded', {
        key,
        value,
        rationale,
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('Project'));
      } else {
        next(error);
      }
    }
  }
}

export const projectController = new ProjectController();
