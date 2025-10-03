'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ROUTE_ALIASES = void 0;
exports.loadModelRoutingConfig = loadModelRoutingConfig;
const zod_1 = require('zod');
const ROUTE_ALIAS_GROUPS = {
  quick: ['quick', 'fast', 'rapid'],
  complex: ['complex', 'full', 'orchestrator'],
  review: ['review', 'reviewer', 'audit', 'governance'],
};
const OVERRIDE_FIELD_MAP = {
  PROVIDER: 'provider',
  MODEL: 'model',
  MAX_TOKENS: 'maxTokens',
};
const aliasToCanonicalRoute = (() => {
  const entries = new Map();
  Object.entries(ROUTE_ALIAS_GROUPS).forEach(([canonical, aliases]) => {
    entries.set(canonical, canonical);
    aliases.forEach((alias) => entries.set(alias.toLowerCase(), canonical));
  });
  return entries;
})();
const requiredTrimmedString = zod_1.z
  .string({
    required_error: 'value is required',
    invalid_type_error: 'value must be a string',
  })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: 'value must not be empty',
  });
const optionalTrimmedString = zod_1.z
  .string({ invalid_type_error: 'value must be a string' })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: 'value must not be empty',
  })
  .optional();
const maxTokensSchema = zod_1.z
  .preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return undefined;
      }
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
      return trimmed;
    }
    return value;
  }, zod_1.z.number().int().positive())
  .optional();
const routeSchema = zod_1.z
  .object({
    provider: requiredTrimmedString,
    model: requiredTrimmedString,
    maxTokens: maxTokensSchema,
  })
  .transform((value) => ({
    provider: value.provider,
    model: value.model,
    ...(value.maxTokens !== undefined ? { maxTokens: value.maxTokens } : {}),
  }));
const overrideSchema = zod_1.z
  .object({
    provider: optionalTrimmedString,
    model: optionalTrimmedString,
    maxTokens: maxTokensSchema,
  })
  .refine(
    (value) =>
      value.provider !== undefined || value.model !== undefined || value.maxTokens !== undefined,
    {
      message: 'override must define at least one of provider, model, or maxTokens',
    },
  )
  .transform((value) => {
    const result = {};
    if (value.provider !== undefined) {
      result.provider = value.provider;
    }
    if (value.model !== undefined) {
      result.model = value.model;
    }
    if (value.maxTokens !== undefined) {
      result.maxTokens = value.maxTokens;
    }
    return result;
  });
const overridesSchema = zod_1.z
  .object({
    quick: overrideSchema,
    complex: overrideSchema,
    review: overrideSchema,
  })
  .partial()
  .transform((value) => value) // eslint-disable-line @typescript-eslint/consistent-type-assertions
  .default({});
const configSchema = zod_1.z.object({
  defaultRoute: routeSchema,
  overrides: overridesSchema,
});
function collectOverrideInputs(env) {
  const overrides = {};
  const errors = [];
  for (const [key, rawValue] of Object.entries(env)) {
    if (rawValue == null) {
      continue;
    }
    const match = /^CODEX_([A-Z0-9]+)_(PROVIDER|MODEL|MAX_TOKENS)$/.exec(key);
    if (!match) {
      continue;
    }
    const [, aliasTokenRaw, fieldToken] = match;
    const aliasToken = aliasTokenRaw.toLowerCase();
    if (aliasToken === 'default') {
      continue;
    }
    const canonical = aliasToCanonicalRoute.get(aliasToken);
    if (!canonical) {
      errors.push(`Unrecognized override alias "${aliasTokenRaw}" in ${key}`);
      continue;
    }
    const field = OVERRIDE_FIELD_MAP[fieldToken];
    if (!field) {
      continue;
    }
    const override = overrides[canonical] || (overrides[canonical] = {});
    const value = String(rawValue);
    if (override[field] && override[field] !== value) {
      errors.push(
        `Conflicting values for ${canonical} ${field}: "${override[field]}" vs "${value}" (via ${key})`,
      );
      continue;
    }
    override[field] = value;
  }
  return { overrides, errors };
}
function formatIssues(issues) {
  return issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
function loadModelRoutingConfig(env) {
  const defaultRouteInput = {
    provider: env.CODEX_DEFAULT_PROVIDER ?? env.CODEX_PROVIDER ?? env.LLM_PROVIDER ?? 'claude',
    model:
      env.CODEX_DEFAULT_MODEL ?? env.CODEX_MODEL ?? env.LLM_MODEL ?? 'claude-3-5-sonnet-20241022',
    maxTokens: env.CODEX_MAX_TOKENS,
  };
  const { overrides: rawOverrides, errors } = collectOverrideInputs(env);
  if (errors.length > 0) {
    const message = `[Codex] Invalid CODEX override configuration: ${errors.join('; ')}`;
    console.error(message);
    throw new Error(message);
  }
  const overridesInput = {};
  Object.entries(rawOverrides).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    if (
      value.provider === undefined &&
      value.model === undefined &&
      value.maxTokens === undefined
    ) {
      return;
    }
    overridesInput[key] = value;
  });
  const validation = configSchema.safeParse({
    defaultRoute: defaultRouteInput,
    overrides: overridesInput,
  });
  if (!validation.success) {
    const message = `[Codex] Invalid model routing configuration: ${formatIssues(validation.error.issues)}`;
    console.error(message);
    throw new Error(message);
  }
  const { defaultRoute, overrides } = validation.data;
  return {
    defaultRoute,
    overrides,
  };
}
exports.ROUTE_ALIASES = ROUTE_ALIAS_GROUPS;
