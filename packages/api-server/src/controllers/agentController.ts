import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agentService';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { io } from '../index';

export class AgentController {
  async listAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await agentService.listAgents();
      res.json({ agents });
    } catch (error) {
      next(error);
    }
  }

  async getAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const agent = await agentService.getAgent(agentId);
      res.json(agent);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError(`Agent ${req.params.agentId}`));
      } else {
        next(error);
      }
    }
  }

  async executeAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const { command, context, projectId } = req.body;
      
      if (!command) {
        throw new BadRequestError('Command is required');
      }
      
      const result = await agentService.executeAgent(agentId, command, context);
      
      if (projectId) {
        io.to(`project:${projectId}`).emit('agent:executed', {
          agentId,
          command,
          duration: result.duration,
          success: result.success,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        next(new NotFoundError(`Agent ${req.params.agentId}`));
      } else {
        next(error);
      }
    }
  }
}

export const agentController = new AgentController();
