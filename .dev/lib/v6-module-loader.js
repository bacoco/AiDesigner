/**
 * BMAD v6 Module Loader (Prototype)
 * Discovers modules shipped in the v6-alpha architecture and
 * exposes helper utilities for the invisible orchestrator bridge.
 */

const fs = require('fs-extra');
const path = require('node:path');
const yaml = require('js-yaml');

function normalizeKey(value) {
  if (!value) {
    return '';
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

async function safeReaddir(directory) {
  try {
    return await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function collectFilesRecursively(directory, extensions) {
  const files = [];
  const entries = await safeReaddir(directory);

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectFilesRecursively(entryPath, extensions);
      files.push(...nested);
      continue;
    }

    if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(entryPath);
    }
  }

  return files;
}

function registerRecord(index, record, keys, conflicts) {
  for (const rawKey of keys) {
    if (!rawKey) {
      continue;
    }

    const key = normalizeKey(rawKey);
    if (!key) {
      continue;
    }

    if (!index.has(key)) {
      index.set(key, record);
    } else if (index.get(key).filePath !== record.filePath) {
      conflicts.push({ key, existing: index.get(key), incoming: record });
    }
  }
}

class V6ModuleLoader {
  constructor(modulesRoot) {
    this.modulesRoot = modulesRoot;
    this.initialized = false;
    this.agentIndex = new Map();
    this.taskIndex = new Map();
    this.templateIndex = new Map();
    this.checklistIndex = new Map();
    this.dataIndex = new Map();
    this.catalog = {
      agents: [],
      tasks: [],
      templates: [],
      checklists: [],
      data: [],
    };
    this.conflicts = {
      agents: [],
      tasks: [],
      templates: [],
      checklists: [],
      data: [],
    };
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    const moduleEntries = await safeReaddir(this.modulesRoot);

    for (const moduleEntry of moduleEntries) {
      if (!moduleEntry.isDirectory()) {
        continue;
      }

      const moduleId = normalizeKey(moduleEntry.name);
      const modulePath = path.join(this.modulesRoot, moduleEntry.name);

      await Promise.all([
        this.#indexAgents(moduleId, modulePath),
        this.#indexResources('tasks', moduleId, modulePath, 'tasks', ['.md']),
        this.#indexResources('templates', moduleId, modulePath, 'templates', [
          '.md',
          '.yaml',
          '.yml',
        ]),
        this.#indexResources('checklists', moduleId, modulePath, 'checklists', ['.md']),
        this.#indexResources('data', moduleId, modulePath, 'data', ['.md', '.yaml', '.yml']),
      ]);
    }

    this.initialized = true;
  }

  async #indexAgents(moduleId, modulePath) {
    const agentsDir = path.join(modulePath, 'agents');
    const agentFiles = await collectFilesRecursively(agentsDir, ['.md']);

    for (const filePath of agentFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const yamlMatch = content.match(/```yaml[\r\n]+([\s\S]*?)```/);
      let config = {};

      if (yamlMatch) {
        try {
          config = yaml.load(yamlMatch[1]) || {};
        } catch (error) {
          console.warn(`Failed to parse YAML for agent ${filePath}:`, error.message);
        }
      }

      const explicitId = normalizeKey(config?.agent?.id);
      const fallbackId = normalizeKey(path.basename(filePath, path.extname(filePath)));
      const primaryId = explicitId || fallbackId;
      const agentRecord = {
        type: 'agent',
        moduleId,
        agentId: primaryId,
        filePath,
        config,
        content,
        rawId: config?.agent?.id || fallbackId,
        identifiers: [],
      };

      const aliases = new Set();
      aliases.add(config?.agent?.id);
      aliases.add(config?.agent?.name);
      aliases.add(primaryId);
      aliases.add(fallbackId);

      if (Array.isArray(config?.agent?.aliases)) {
        for (const alias of config.agent.aliases) {
          aliases.add(alias);
        }
      }

      const aliasKeys = [...aliases].filter(Boolean).flatMap((alias) => {
        const cleaned = normalizeKey(alias);
        return [cleaned, `${moduleId}/${cleaned}`, `${moduleId}:${cleaned}`];
      });

      agentRecord.identifiers = aliasKeys.filter(Boolean);
      this.catalog.agents.push(agentRecord);
      registerRecord(this.agentIndex, agentRecord, agentRecord.identifiers, this.conflicts.agents);
    }
  }

  async #indexResources(type, moduleId, modulePath, relativeDir, extensions) {
    const directory = path.join(modulePath, relativeDir);
    const files = await collectFilesRecursively(directory, extensions);

    for (const filePath of files) {
      const name = normalizeKey(path.basename(filePath, path.extname(filePath)));
      const record = {
        type,
        moduleId,
        name,
        filePath,
      };

      const keys = [name, `${moduleId}/${name}`, `${moduleId}:${name}`];

      this.catalog[type].push(record);

      switch (type) {
        case 'tasks': {
          registerRecord(this.taskIndex, record, keys, this.conflicts.tasks);
          break;
        }
        case 'templates': {
          registerRecord(this.templateIndex, record, keys, this.conflicts.templates);
          break;
        }
        case 'checklists': {
          registerRecord(this.checklistIndex, record, keys, this.conflicts.checklists);
          break;
        }
        case 'data': {
          registerRecord(this.dataIndex, record, keys, this.conflicts.data);
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  #getRecord(index, identifier) {
    if (!identifier) {
      return null;
    }

    const direct = index.get(normalizeKey(identifier));
    if (direct) {
      return direct;
    }

    return null;
  }

  async loadAgent(agentId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = this.#getRecord(this.agentIndex, agentId);
    return record || null;
  }

  async loadTask(taskName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = this.#getRecord(this.taskIndex, taskName);
    if (!record) {
      return null;
    }

    return {
      ...record,
      content: await fs.readFile(record.filePath, 'utf8'),
    };
  }

  async loadTemplate(templateName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = this.#getRecord(this.templateIndex, templateName);
    if (!record) {
      return null;
    }

    return {
      ...record,
      content: await fs.readFile(record.filePath, 'utf8'),
      extension: path.extname(record.filePath).toLowerCase(),
    };
  }

  async loadChecklist(checklistName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = this.#getRecord(this.checklistIndex, checklistName);
    if (!record) {
      return null;
    }

    return {
      ...record,
      content: await fs.readFile(record.filePath, 'utf8'),
    };
  }

  async loadData(dataName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const record = this.#getRecord(this.dataIndex, dataName);
    if (!record) {
      return null;
    }

    return {
      ...record,
      content: await fs.readFile(record.filePath, 'utf8'),
      extension: path.extname(record.filePath).toLowerCase(),
    };
  }

  listAgents() {
    return this.catalog.agents.map((agent) => ({
      moduleId: agent.moduleId,
      agentId: agent.agentId,
      path: agent.filePath,
      identifiers: agent.identifiers,
    }));
  }

  listTasks() {
    return this.catalog.tasks.map((task) => ({
      moduleId: task.moduleId,
      name: task.name,
      path: task.filePath,
    }));
  }

  listTemplates() {
    return this.catalog.templates.map((template) => ({
      moduleId: template.moduleId,
      name: template.name,
      path: template.filePath,
    }));
  }

  listChecklists() {
    return this.catalog.checklists.map((checklist) => ({
      moduleId: checklist.moduleId,
      name: checklist.name,
      path: checklist.filePath,
    }));
  }

  listData() {
    return this.catalog.data.map((data) => ({
      moduleId: data.moduleId,
      name: data.name,
      path: data.filePath,
    }));
  }

  getCatalogSummary() {
    return {
      moduleCount: new Set(this.catalog.agents.map((agent) => agent.moduleId)).size,
      agents: this.catalog.agents.length,
      tasks: this.catalog.tasks.length,
      templates: this.catalog.templates.length,
      checklists: this.catalog.checklists.length,
      data: this.catalog.data.length,
      conflicts: this.conflicts,
    };
  }
}

module.exports = {
  V6ModuleLoader,
};
