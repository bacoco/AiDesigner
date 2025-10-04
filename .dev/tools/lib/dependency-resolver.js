const fs = require('node:fs').promises;
const path = require('node:path');
const yaml = require('js-yaml');
const { extractYamlFromAgent } = require('./yaml-utils');
const { CORE_DIR_CANDIDATES, LEGACY_CORE_DIR } = require('./core-paths');

const CORE_DIRECTORIES = CORE_DIR_CANDIDATES.map((label) => ({
  label,
  pathSuffix: label,
}));

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.coreDirectories = CORE_DIRECTORIES.map((entry) => ({
      label: entry.label,
      path: path.join(rootDir, entry.pathSuffix),
    }));
    this.common = path.join(rootDir, 'common');
    this.cache = new Map();
    this.legacyNotices = new Set();
  }

  warnIfLegacy(label) {
    if (label === LEGACY_CORE_DIR && !this.legacyNotices.has(label)) {
      this.legacyNotices.add(label);
      console.warn(
        `⚠️  Agilai compatibility: falling back to legacy ${LEGACY_CORE_DIR} directory. Rename to agilai-core to stay current.`,
      );
    }
  }

  async tryReadCoreFile(...segments) {
    for (const entry of this.coreDirectories) {
      const candidate = path.join(entry.path, ...segments);
      try {
        const content = await fs.readFile(candidate, 'utf8');
        this.warnIfLegacy(entry.label);
        return { content, path: candidate };
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    return null;
  }

  async resolveAgentDependencies(agentId) {
    const agentFile = await this.tryReadCoreFile('agents', `${agentId}.md`);
    if (!agentFile) {
      throw new Error(`Agent not found in agilai-core: agents/${agentId}.md`);
    }

    const { content: agentContent, path: agentPath } = agentFile;

    // Extract YAML from markdown content with command cleaning
    const yamlContent = extractYamlFromAgent(agentContent, true);
    if (!yamlContent) {
      throw new Error(`No YAML configuration found in agent ${agentId}`);
    }

    const agentConfig = yaml.load(yamlContent);

    const dependencies = {
      agent: {
        id: agentId,
        path: agentPath,
        content: agentContent,
        config: agentConfig,
      },
      resources: [],
    };

    // Personas are now embedded in agent configs, no need to resolve separately

    // Resolve other dependencies
    const depTypes = ['tasks', 'templates', 'checklists', 'data', 'utils'];
    for (const depType of depTypes) {
      const deps = agentConfig.dependencies?.[depType] || [];
      for (const depId of deps) {
        const resource = await this.loadResource(depType, depId);
        if (resource) dependencies.resources.push(resource);
      }
    }

    return dependencies;
  }

  async resolveTeamDependencies(teamId) {
    const teamFile = await this.tryReadCoreFile('agent-teams', `${teamId}.yaml`);
    if (!teamFile) {
      throw new Error(`Team not found in agilai-core: agent-teams/${teamId}.yaml`);
    }

    const { content: teamContent, path: teamPath } = teamFile;
    const teamConfig = yaml.load(teamContent);

    const dependencies = {
      team: {
        id: teamId,
        path: teamPath,
        content: teamContent,
        config: teamConfig,
      },
      agents: [],
      resources: new Map(), // Use Map to deduplicate resources
    };

    // Always add bmad-orchestrator agent first if it's a team
    const bmadAgent = await this.resolveAgentDependencies('bmad-orchestrator');
    dependencies.agents.push(bmadAgent.agent);
    for (const res of bmadAgent.resources) {
      dependencies.resources.set(res.path, res);
    }

    // Resolve all agents in the team
    let agentsToResolve = teamConfig.agents || [];

    // Handle wildcard "*" - include all agents except bmad-master
    if (agentsToResolve.includes('*')) {
      const allAgents = await this.listAgents();
      // Remove wildcard and add all agents except those already in the list and bmad-master
      agentsToResolve = agentsToResolve.filter((a) => a !== '*');
      for (const agent of allAgents) {
        if (!agentsToResolve.includes(agent) && agent !== 'bmad-master') {
          agentsToResolve.push(agent);
        }
      }
    }

    for (const agentId of agentsToResolve) {
      if (agentId === 'bmad-orchestrator' || agentId === 'bmad-master') continue; // Already added or excluded
      const agentDeps = await this.resolveAgentDependencies(agentId);
      dependencies.agents.push(agentDeps.agent);

      // Add resources with deduplication
      for (const res of agentDeps.resources) {
        dependencies.resources.set(res.path, res);
      }
    }

    // Resolve workflows
    for (const workflowId of teamConfig.workflows || []) {
      const resource = await this.loadResource('workflows', workflowId);
      if (resource) dependencies.resources.set(resource.path, resource);
    }

    // Convert Map back to array
    dependencies.resources = [...dependencies.resources.values()];

    return dependencies;
  }

  async loadResource(type, id) {
    const cacheKey = `${type}#${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let content = null;
      let filePath = null;

      const coreResource = await this.tryReadCoreFile(type, id);
      if (coreResource) {
        ({ path: filePath, content } = coreResource);
      } else {
        try {
          filePath = path.join(this.common, type, id);
          content = await fs.readFile(filePath, 'utf8');
        } catch {
          // File not found in either location
        }
      }

      if (!content) {
        console.warn(`Resource not found: ${type}/${id}`);
        return null;
      }

      const resource = {
        type,
        id,
        path: filePath,
        content,
      };

      this.cache.set(cacheKey, resource);
      return resource;
    } catch (error) {
      console.error(`Error loading resource ${type}/${id}:`, error.message);
      return null;
    }
  }

  async listAgents() {
    try {
      for (const entry of this.coreDirectories) {
        try {
          const files = await fs.readdir(path.join(entry.path, 'agents'));
          if (files.length) this.warnIfLegacy(entry.label);
          return files.filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', ''));
        } catch (error) {
          if (error.code && error.code !== 'ENOENT') throw error;
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  async listTeams() {
    try {
      for (const entry of this.coreDirectories) {
        try {
          const files = await fs.readdir(path.join(entry.path, 'agent-teams'));
          if (files.length) this.warnIfLegacy(entry.label);
          return files.filter((f) => f.endsWith('.yaml')).map((f) => f.replace('.yaml', ''));
        } catch (error) {
          if (error.code && error.code !== 'ENOENT') throw error;
        }
      }
      return [];
    } catch {
      return [];
    }
  }
}

module.exports = DependencyResolver;
