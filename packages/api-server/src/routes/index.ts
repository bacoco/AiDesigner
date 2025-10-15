import { Express, Router } from 'express';
import { projectController } from '../controllers/projectController';
import { agentController } from '../controllers/agentController';
import { uiIntegrationController } from '../controllers/uiIntegrationController';

export function setupRoutes(app: Express): void {
  const router = Router();

  router.post('/projects', projectController.createProject.bind(projectController));
  router.get('/projects/:projectId/state', projectController.getState.bind(projectController));
  router.patch('/projects/:projectId/state', projectController.updateState.bind(projectController));
  
  router.get('/projects/:projectId/conversation', projectController.getConversation.bind(projectController));
  router.post('/projects/:projectId/conversation', projectController.addMessage.bind(projectController));
  
  router.get('/projects/:projectId/deliverables', projectController.getDeliverables.bind(projectController));
  router.get('/projects/:projectId/deliverables/:type', projectController.getDeliverable.bind(projectController));
  router.post('/projects/:projectId/deliverables', projectController.createDeliverable.bind(projectController));
  
  router.get('/projects/:projectId/decisions', projectController.getDecisions.bind(projectController));
  router.post('/projects/:projectId/decisions', projectController.recordDecision.bind(projectController));

  router.get('/agents', agentController.listAgents.bind(agentController));
  router.get('/agents/:agentId', agentController.getAgent.bind(agentController));
  router.post('/agents/:agentId/execute', agentController.executeAgent.bind(agentController));

  router.post(
    '/projects/:projectId/ui/components',
    uiIntegrationController.installComponent.bind(uiIntegrationController)
  );
  router.patch(
    '/projects/:projectId/ui/theme',
    uiIntegrationController.updateTheme.bind(uiIntegrationController)
  );

  app.use('/api', router);
}
