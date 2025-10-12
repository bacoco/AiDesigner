import { BaseMetaAgent } from './base';
import type { GenesisInput, MetaAgentRuntimeOptions } from './types';
import { normalizeTechnologyStack } from './utils';

interface DomainPlan {
  domain: string;
  responsibilities: string[];
  prerequisites?: string[];
}

interface SubAgentPlan {
  id: string;
  mission: string;
  prerequisites: string[];
  outputs: string[];
}

const DOMAIN_TEMPLATES: Record<string, DomainPlan> = {
  VCS: {
    domain: 'VCS',
    responsibilities: ['Initialize git repository', 'Create main and develop branches', 'Define commit templates'],
    prerequisites: [],
  },
  Frontend: {
    domain: 'Frontend',
    responsibilities: ['Bootstrap client application', 'Install UI toolkit and linting', 'Configure design tokens'],
    prerequisites: ['VCS'],
  },
  Backend: {
    domain: 'Backend',
    responsibilities: ['Create API service structure', 'Add healthcheck endpoint', 'Configure environment management'],
    prerequisites: ['VCS'],
  },
  Database: {
    domain: 'Database',
    responsibilities: ['Provision schema migrations', 'Define connection secrets', 'Create seed data tasks'],
    prerequisites: ['Backend'],
  },
  'CI/CD': {
    domain: 'CI/CD',
    responsibilities: ['Set up automated lint/test workflow', 'Configure quality gates', 'Publish build artifacts'],
    prerequisites: ['Frontend', 'Backend'],
  },
};

const SUB_AGENT_PLANS: SubAgentPlan[] = [
  {
    id: 'sub-agent-repo-manager',
    mission:
      'Initialize git repository, author .gitignore, and prepare main/develop branches with protection templates.',
    prerequisites: ['VCS'],
    outputs: ['.gitignore', 'Repository README baseline', 'Branch protection checklist'],
  },
  {
    id: 'sub-agent-scaffolder-fe',
    mission:
      'Run framework CLI to scaffold frontend, install linting + styling dependencies, and commit baseline UI shell.',
    prerequisites: ['Frontend', 'VCS'],
    outputs: ['frontend scaffold', 'tailwind.config', 'eslint configuration'],
  },
  {
    id: 'sub-agent-scaffolder-be',
    mission:
      'Create FastAPI-style layout with api/core/models directories and include a /healthcheck endpoint.',
    prerequisites: ['Backend', 'Database', 'VCS'],
    outputs: ['backend scaffold', 'pyproject.toml', 'healthcheck endpoint'],
  },
  {
    id: 'sub-agent-ci-cd-writer',
    mission: 'Author GitHub Actions workflow running lint and tests on pushes to develop branch.',
    prerequisites: ['CI/CD', 'Frontend', 'Backend'],
    outputs: ['.github/workflows/ci.yml'],
  },
];

export class GenesisMetaAgent extends BaseMetaAgent<GenesisInput> {
  constructor(input: GenesisInput, options?: MetaAgentRuntimeOptions) {
    super(
      'genesis',
      'Genesis Project Scaffolding',
      'Automates blueprint decomposition and scaffolding plan generation for new projects.',
      input,
      options,
    );
  }

  private composeDomainBlueprint(technologyStack: string[]): DomainPlan[] {
    const base = ['VCS', 'Frontend', 'Backend', 'Database', 'CI/CD'];
    const stack = new Set(technologyStack.map((entry) => entry.toLowerCase()));
    const blueprint = base.map((domainKey) => DOMAIN_TEMPLATES[domainKey]);

    if (stack.has('supabase')) {
      blueprint.push({
        domain: 'Supabase',
        responsibilities: ['Configure Supabase project', 'Bootstrap SQL migrations', 'Wire auth + storage clients'],
        prerequisites: ['Database'],
      });
    }

    return blueprint;
  }

  private generateTimeline(domains: DomainPlan[]): string[] {
    const steps: string[] = [];
    for (const domain of domains) {
      const requires = domain.prerequisites?.length ? ` (after ${domain.prerequisites.join(', ')})` : '';
      steps.push(`- ${domain.domain}${requires}: ${domain.responsibilities[0]}`);
    }
    return steps;
  }

  private renderBlueprintMarkdown(domains: DomainPlan[], stack: string[]): string {
    const lines = ['# Genesis Blueprint', '', '## Technology Stack', '', ...stack.map((item) => `- ${item}`), '', '## Domains'];
    for (const domain of domains) {
      lines.push('', `### ${domain.domain}`);
      if (domain.prerequisites?.length) {
        lines.push(`*Prerequisites:* ${domain.prerequisites.join(', ')}`);
      }
      lines.push('', 'Responsibilities:');
      for (const responsibility of domain.responsibilities) {
        lines.push(`- ${responsibility}`);
      }
    }
    return lines.join('\n');
  }

  private renderSubAgentsMarkdown(subAgents: SubAgentPlan[]): string {
    const lines = ['# Scaffolding Sub-Agents', ''];
    for (const subAgent of subAgents) {
      lines.push(`## ${subAgent.id}`, '', `**Mission:** ${subAgent.mission}`, '', 'Prerequisites:');
      lines.push(...subAgent.prerequisites.map((item) => `- ${item}`));
      lines.push('', 'Outputs:');
      lines.push(...subAgent.outputs.map((item) => `- ${item}`));
      lines.push('');
    }
    return lines.join('\n');
  }

  private renderMigrationDraft(projectName: string): string {
    return [`-- ${projectName} initial structure`, "CREATE SCHEMA IF NOT EXISTS app;", '', '-- TODO: add project specific tables'].join('\n');
  }

  protected async execute(): Promise<string> {
    // Validate required inputs
    if (!this.input.projectName?.trim()) {
      throw new Error('projectName is required and cannot be empty');
    }
    if (!this.input.projectType?.trim()) {
      throw new Error('projectType is required and cannot be empty');
    }

    const { projectName, projectType } = this.input;
    const technologyStack = normalizeTechnologyStack(this.input.technologyStack);

    if (technologyStack.length === 0) {
      throw new Error('At least one technology must be specified in technologyStack');
    }

    const domains = this.composeDomainBlueprint(technologyStack);
    const subAgents = SUB_AGENT_PLANS;

    await this.runStage('deconstruct-blueprint', 'Deconstruct the project blueprint', async () => {
      const artifactPath = this.createArtifactPath('reports/genesis', 'blueprint', 'md');
      const blueprint = this.renderBlueprintMarkdown(domains, technologyStack);
      const artifact = await this.artifactManager.write(
        artifactPath,
        blueprint,
        'Domain decomposition for scaffolding execution',
      );

      return {
        summary: 'Generated domain blueprint with responsibilities and prerequisites.',
        artifacts: [artifact],
      };
    });

    await this.runStage('generate-sub-agents', 'Generate scaffolding sub-agents', async () => {
      const artifactPath = this.createArtifactPath('reports/genesis', 'sub-agents', 'md');
      const artifact = await this.artifactManager.write(
        artifactPath,
        this.renderSubAgentsMarkdown(subAgents),
        'Sub-agent missions for scaffolding workflow',
      );

      return {
        summary: 'Documented specialized scaffolding sub-agents.',
        artifacts: [artifact],
      };
    });

    await this.runStage('orchestrate-construction', 'Draft orchestrated construction timeline', async () => {
      const timeline = this.generateTimeline(domains);
      const migrationPath = this.createArtifactPath('migrations/genesis', 'initial-migration', 'sql');
      const migrationArtifact = await this.artifactManager.write(
        migrationPath,
        this.renderMigrationDraft(projectName),
        'Initial schema migration placeholder',
      );

      const schedulePath = this.createArtifactPath('reports/genesis', 'execution-plan', 'md');
      const scheduleArtifact = await this.artifactManager.write(
        schedulePath,
        ['# Orchestrated Construction Plan', '', `Project Type: ${projectType}`, '', ...timeline].join('\n'),
        'Parallelization strategy for scaffolding steps',
      );

      return {
        summary: 'Outlined staged execution plan and seed migration draft.',
        artifacts: [migrationArtifact, scheduleArtifact],
      };
    });

    const summary = `Prepared Genesis scaffolding playbook for ${projectName}.`;

    return summary;
  }
}
