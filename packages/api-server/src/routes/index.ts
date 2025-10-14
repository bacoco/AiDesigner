import { Express, Router } from 'express';
import { projectController } from '../controllers/projectController';
import { agentController } from '../controllers/agentController';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createProjectSchema,
  updateStateSchema,
  addMessageSchema,
  createDeliverableSchema,
  recordDecisionSchema,
  projectIdParamSchema,
  deliverableTypeParamSchema,
  conversationQuerySchema,
} from '../validators/projectSchemas';

export function setupRoutes(app: Express): void {
  const router = Router();

  router.post('/projects', validateBody(createProjectSchema), projectController.createProject.bind(projectController));
  router.get('/projects/:projectId/state', validateParams(projectIdParamSchema), projectController.getState.bind(projectController));
  router.patch('/projects/:projectId/state', validateParams(projectIdParamSchema), validateBody(updateStateSchema), projectController.updateState.bind(projectController));
  
  router.get('/projects/:projectId/conversation', validateParams(projectIdParamSchema), validateQuery(conversationQuerySchema), projectController.getConversation.bind(projectController));
  router.post('/projects/:projectId/conversation', validateParams(projectIdParamSchema), validateBody(addMessageSchema), projectController.addMessage.bind(projectController));
  
  router.get('/projects/:projectId/deliverables', validateParams(projectIdParamSchema), projectController.getDeliverables.bind(projectController));
  router.get('/projects/:projectId/deliverables/:type', validateParams(projectIdParamSchema.merge(deliverableTypeParamSchema)), projectController.getDeliverable.bind(projectController));
  router.post('/projects/:projectId/deliverables', validateParams(projectIdParamSchema), validateBody(createDeliverableSchema), projectController.createDeliverable.bind(projectController));
  
  router.get('/projects/:projectId/decisions', validateParams(projectIdParamSchema), projectController.getDecisions.bind(projectController));
  router.post('/projects/:projectId/decisions', validateParams(projectIdParamSchema), validateBody(recordDecisionSchema), projectController.recordDecision.bind(projectController));
  
  router.get('/agents', agentController.listAgents.bind(agentController));
  router.get('/agents/:agentId', agentController.getAgent.bind(agentController));
  router.post('/agents/:agentId/execute', agentController.executeAgent.bind(agentController));

  app.use('/api', router);
}
