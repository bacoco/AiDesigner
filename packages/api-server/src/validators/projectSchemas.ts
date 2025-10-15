import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const updateStateSchema = z.object({
  projectName: z.string().min(1).max(255).optional(),
  currentPhase: z.string().min(1).max(100).optional(),
  requirements: z.record(z.unknown()).optional(),
  decisions: z.record(z.unknown()).optional(),
  nextSteps: z.string().max(10000).optional(),
});

export const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(100000),
  metadata: z.record(z.unknown()).optional(),
});

export const createDeliverableSchema = z.object({
  type: z.string().min(1).max(100),
  content: z.string().min(1).max(1000000),
  metadata: z.record(z.unknown()).optional(),
});

export const recordDecisionSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.unknown().refine((val) => val !== undefined, {
    message: 'Value is required',
  }),
  rationale: z.string().max(5000).optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().regex(/^proj-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, 'Invalid project ID format'),
});

export const deliverableTypeParamSchema = z.object({
  type: z.string().min(1).max(100),
});

export const conversationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
});

export const agentIdParamSchema = z.object({
  agentId: z.string().min(1).max(100),
});

export const executeAgentSchema = z.object({
  input: z.unknown().optional(),
  config: z.record(z.unknown()).optional(),
});
