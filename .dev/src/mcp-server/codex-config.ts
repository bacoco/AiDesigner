import { z } from "zod";

export interface ModelRoute {
  provider: string;
  model: string;
  maxTokens?: number;
}

export type ModelRouteOverride = Partial<ModelRoute>;

type CanonicalRouteKey = keyof typeof ROUTE_ALIAS_GROUPS;

const ROUTE_ALIAS_GROUPS = {
  quick: ["quick", "fast", "rapid"] as const,
  complex: ["complex", "full", "orchestrator"] as const,
  review: ["review", "reviewer", "audit", "governance"] as const,
} as const;

const OVERRIDE_FIELD_MAP = {
  PROVIDER: "provider",
  MODEL: "model",
  MAX_TOKENS: "maxTokens",
} as const satisfies Record<string, keyof RawOverrideInput>;

type RawOverrideInput = {
  provider?: string;
  model?: string;
  maxTokens?: string;
};

const aliasToCanonicalRoute = (() => {
  const entries = new Map<string, CanonicalRouteKey>();
  (Object.entries(ROUTE_ALIAS_GROUPS) as [CanonicalRouteKey, readonly string[]][]).forEach(
    ([canonical, aliases]) => {
      entries.set(canonical, canonical);
      aliases.forEach((alias) => entries.set(alias.toLowerCase(), canonical));
    }
  );
  return entries;
})();

const requiredTrimmedString = z
  .string({
    required_error: "value is required",
    invalid_type_error: "value must be a string",
  })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: "value must not be empty",
  });

const optionalTrimmedString = z
  .string({ invalid_type_error: "value must be a string" })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, {
    message: "value must not be empty",
  })
  .optional();

const maxTokensSchema = z
  .preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") {
        return undefined;
      }

      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }

      return trimmed;
    }

    return value;
  }, z.number().int().positive())
  .optional();

const routeSchema = z
  .object({
    provider: requiredTrimmedString,
    model: requiredTrimmedString,
    maxTokens: maxTokensSchema,
  })
  .transform((value) => ({
    provider: value.provider,
    model: value.model,
    ...(value.maxTokens !== undefined ? { maxTokens: value.maxTokens } : {}),
  } satisfies ModelRoute));

const overrideSchema = z
  .object({
    provider: optionalTrimmedString,
    model: optionalTrimmedString,
    maxTokens: maxTokensSchema,
  })
  .refine(
    (value) =>
      value.provider !== undefined ||
      value.model !== undefined ||
      value.maxTokens !== undefined,
    {
      message: "override must define at least one of provider, model, or maxTokens",
    }
  )
  .transform((value) => {
    const result: ModelRouteOverride = {};
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

const overridesSchema = z
  .object({
    quick: overrideSchema,
    complex: overrideSchema,
    review: overrideSchema,
  })
  .partial()
  .transform((value) => value as Partial<Record<CanonicalRouteKey, ModelRouteOverride>>) // eslint-disable-line @typescript-eslint/consistent-type-assertions
  .default({});

const configSchema = z.object({
  defaultRoute: routeSchema,
  overrides: overridesSchema,
});

export interface CodexRoutingConfig {
  defaultRoute: ModelRoute;
  overrides: Partial<Record<CanonicalRouteKey, ModelRouteOverride>>;
}

function collectOverrideInputs(env: NodeJS.ProcessEnv) {
  const overrides: Partial<Record<CanonicalRouteKey, RawOverrideInput>> = {};
  const errors: string[] = [];

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

    if (aliasToken === "default") {
      continue;
    }

    const canonical = aliasToCanonicalRoute.get(aliasToken);
    if (!canonical) {
      errors.push(`Unrecognized override alias "${aliasTokenRaw}" in ${key}`);
      continue;
    }

    const field = OVERRIDE_FIELD_MAP[fieldToken as keyof typeof OVERRIDE_FIELD_MAP];
    if (!field) {
      continue;
    }

    const override = (overrides[canonical] ||= {});
    const value = String(rawValue);

    if (override[field] && override[field] !== value) {
      errors.push(
        `Conflicting values for ${canonical} ${field}: "${override[field]}" vs "${value}" (via ${key})`
      );
      continue;
    }

    override[field] = value;
  }

  return { overrides, errors };
}

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export function loadModelRoutingConfig(env: NodeJS.ProcessEnv): CodexRoutingConfig {
  const defaultRouteInput = {
    provider:
      env.CODEX_DEFAULT_PROVIDER ?? env.CODEX_PROVIDER ?? env.LLM_PROVIDER ?? "claude",
    model:
      env.CODEX_DEFAULT_MODEL ?? env.CODEX_MODEL ?? env.LLM_MODEL ?? "claude-3-5-sonnet-20241022",
    maxTokens: env.CODEX_MAX_TOKENS,
  };

  const { overrides: rawOverrides, errors } = collectOverrideInputs(env);

  if (errors.length > 0) {
    const message = `[Codex] Invalid CODEX override configuration: ${errors.join("; ")}`;
    console.error(message);
    throw new Error(message);
  }

  const overridesInput: Partial<Record<CanonicalRouteKey, RawOverrideInput>> = {};
  (Object.entries(rawOverrides) as [CanonicalRouteKey, RawOverrideInput | undefined][]).forEach(
    ([key, value]) => {
      if (!value) {
        return;
      }

      if (value.provider === undefined && value.model === undefined && value.maxTokens === undefined) {
        return;
      }

      overridesInput[key] = value;
    }
  );

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

export const ROUTE_ALIASES: Record<CanonicalRouteKey, readonly string[]> = ROUTE_ALIAS_GROUPS;
