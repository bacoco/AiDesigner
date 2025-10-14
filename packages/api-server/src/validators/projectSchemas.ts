import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const updateStateSchema = z.object({
  projectName: z.string().min(1).max(255).optional(),
  currentPhase: z.string().min(1).max(100).optional(),
  requirements: z.record(z.unknown()).optional(),
  decisions: z.record(z.unknown()).optional(),
  nextSteps: z.string().optional(),
});

export const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const createDeliverableSchema = z.object({
  type: z.string().min(1).max(100),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const recordDecisionSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.unknown().refine((val) => val !== undefined, {
    message: 'Value is required',
  }),
  rationale: z.string().optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().regex(/^proj-[a-f0-9-]+$/i, 'Invalid project ID format'),
});

export const deliverableTypeParamSchema = z.object({
  type: z.string().min(1).max(100),
});

export const conversationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(1000)).optional(),
});
