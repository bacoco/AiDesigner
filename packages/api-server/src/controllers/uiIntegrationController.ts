import { Request, Response, NextFunction } from 'express';
import { uiIntegrationService } from '../services/uiIntegrationService';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { io } from '../index';

class UIIntegrationController {
  async installComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { component, args, metadata, cwd } = req.body || {};

      if (!component || typeof component !== 'string') {
        throw new BadRequestError('Component name is required');
      }

      const result = await uiIntegrationService.installComponent(projectId, {
        component,
        args,
        metadata,
        cwd,
      });

      io.to(`project:${projectId}`).emit('ui:component-installed', {
        projectId,
        component,
        record: result.record,
        success: result.success,
        stdout: result.output.stdout,
        stderr: result.output.stderr,
        timestamp: new Date().toISOString(),
      });

      res.status(202).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async updateTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { palette, args, metadata, cwd } = req.body || {};

      if (!palette || typeof palette !== 'object') {
        throw new BadRequestError('Palette information is required');
      }

      if (!palette.name || typeof palette.name !== 'string') {
        throw new BadRequestError('Palette name is required');
      }

      if (!palette.tokens || typeof palette.tokens !== 'object') {
        throw new BadRequestError('Palette tokens are required');
      }

      const result = await uiIntegrationService.updateTheme(projectId, {
        palette: {
          name: palette.name,
          tokens: palette.tokens,
        },
        args,
        metadata,
        cwd,
      });

      io.to(`project:${projectId}`).emit('ui:theme-updated', {
        projectId,
        record: result.record,
        success: result.success,
        stdout: result.output.stdout,
        stderr: result.output.stderr,
        timestamp: new Date().toISOString(),
      });

      res.status(202).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export const uiIntegrationController = new UIIntegrationController();

