import { Request, Response, NextFunction } from 'express';
import { uiIntegrationService } from '../services/uiIntegrationService';
import { BadRequestError } from '../middleware/errorHandler';
import { getSocketIO } from '../config/socketio';

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

      getSocketIO()
        .to(`project:${projectId}`)
        .emit('ui:component-installed', {
          projectId,
          component: result.record.component,
          record: result.record,
          success: result.success,
          timestamp: result.record.installedAt,
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

      getSocketIO()
        .to(`project:${projectId}`)
        .emit('ui:theme-updated', {
          projectId,
          record: result.record,
          success: result.success,
          timestamp: result.record.appliedAt,
        });

      res.status(202).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export const uiIntegrationController = new UIIntegrationController();

