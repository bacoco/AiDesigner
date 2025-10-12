import {
  ArchitectPlanningResult,
  FeatureRequest,
  SubAgentDefinition,
} from '../planning/types';
import { CompoundingEngineeringPlanningAdapter, AdapterOptions } from '../planning/compounding-engineering';

export interface ArchitectOrchestrationOptions extends AdapterOptions {
  adapter?: CompoundingEngineeringPlanningAdapter;
  defaultPersona?: string;
}

export interface OrchestrationMergeResult extends ArchitectPlanningResult {
  mergedSubAgents: SubAgentDefinition[];
}

export async function planDeveloperSubAgents(
  feature: FeatureRequest,
  options: ArchitectOrchestrationOptions = {},
): Promise<ArchitectPlanningResult> {
  const { adapter: providedAdapter, defaultPersona, ...adapterOptions } = options;
  const adapter = providedAdapter ?? new CompoundingEngineeringPlanningAdapter(adapterOptions);
  const graph = await adapter.decomposeFeature(feature);

  const developerSubAgents = graph.tasks.map((task) => ({
    id: task.id,
    agent: task.persona || defaultPersona || 'developer',
    mission: task.mission,
    dependencies: [...task.dependencies],
    metadata: {
      ...task.metadata,
      lane: task.lane,
      source: 'compounding-engineering',
    },
  }));

  return { graph, developerSubAgents };
}

export function mergeDeveloperSubAgents(
  existing: SubAgentDefinition[],
  additions: SubAgentDefinition[],
): SubAgentDefinition[] {
  const merged = new Map<string, SubAgentDefinition>();

  for (const entry of existing) {
    merged.set(entry.id, {
      ...entry,
      dependencies: [...new Set(entry.dependencies ?? [])],
    });
  }

  for (const entry of additions) {
    const current = merged.get(entry.id);
    if (!current) {
      merged.set(entry.id, {
        ...entry,
        dependencies: [...new Set(entry.dependencies ?? [])],
      });
      continue;
    }

    const dependencies = new Set([...(current.dependencies ?? []), ...(entry.dependencies ?? [])]);
    merged.set(entry.id, {
      ...current,
      ...entry,
      dependencies: [...dependencies],
      metadata: {
        ...(current.metadata ?? {}),
        ...(entry.metadata ?? {}),
      },
    });
  }

  return [...merged.values()];
}

export async function orchestrateArchitectStepOne(
  feature: FeatureRequest,
  existingSubAgents: SubAgentDefinition[] = [],
  options: ArchitectOrchestrationOptions = {},
): Promise<OrchestrationMergeResult> {
  const planning = await planDeveloperSubAgents(feature, options);
  const mergedSubAgents = mergeDeveloperSubAgents(existingSubAgents, planning.developerSubAgents);
  return { ...planning, mergedSubAgents };
}
