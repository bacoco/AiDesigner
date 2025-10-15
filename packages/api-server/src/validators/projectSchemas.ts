import { z } from 'zod';

const packageNamePattern = /^(@[a-z0-9][\w.-]*\/)?[a-zA-Z0-9][\w.-]*$/i;
const dangerousArgPattern = /[;&|`$()<>\\'"\n\r]/;

const userArgSchema = z
  .string()
  .min(1)
  .max(2000)
  .refine((value) => !dangerousArgPattern.test(value) && !value.includes('..'), {
    message: 'Argument contains unsupported characters',
  })
  .refine((value) => {
    const lowered = value.toLowerCase();
    return !['--eval', '-e', '--require', '-r'].some((flag) => lowered.startsWith(flag));
  }, { message: 'Argument uses a forbidden flag' });

const paletteTokensSchema = z
  .record(z.string().max(500))
  .superRefine((tokens, ctx) => {
    const entries = Object.entries(tokens ?? {});
    if (entries.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Too many palette tokens (max 100)',
      });
    }

    for (const [key, value] of entries) {
      if (typeof key !== 'string') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid palette token key',
        });
        continue;
      }

      if (!/^[A-Za-z0-9_.-]+$/.test(key) || key === '__proto__' || key === 'constructor') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid palette token key: ${key}`,
        });
      }

      if (typeof value !== 'string' || value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Palette token value for "${key}" cannot be empty`,
        });
      }
    }
  });

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

export const installComponentSchema = z.object({
  component: z
    .string()
    .min(1)
    .max(214)
    .regex(packageNamePattern, 'Invalid component name')
    .refine((value) => !value.includes('..'), { message: 'Invalid component name' }),
  args: z.array(userArgSchema).max(25).optional(),
  metadata: z.record(z.unknown()).optional(),
  cwd: z.string().max(1024).optional(),
});

export const updateThemeSchema = z.object({
  palette: z.object({
    name: z
      .string()
      .min(1)
      .max(214)
      .regex(packageNamePattern, 'Invalid palette name')
      .refine((value) => !value.includes('..'), { message: 'Invalid palette name' }),
    tokens: paletteTokensSchema,
  }),
  args: z.array(userArgSchema).max(25).optional(),
  metadata: z.record(z.unknown()).optional(),
  cwd: z.string().max(1024).optional(),
});
