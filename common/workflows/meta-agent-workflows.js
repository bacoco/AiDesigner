/* eslint-disable unicorn/prefer-module, n/no-unpublished-require */

const {
  GenesisMetaAgent,
  LibrarianMetaAgent,
  RefactorMetaAgent,
  NodeFileSystem,
} = require('../../packages/meta-agents/dist');

const WORKFLOW_DEFINITIONS = [
  {
    id: 'genesis',
    title: 'Genesis Project Bootstrap',
    description: 'Decompose a project brief into scaffolding sub-agents and execution plan.',
  },
  {
    id: 'librarian',
    title: 'Librarian Documentation Sync',
    description: 'Regenerate architecture, API, and setup documentation for the current codebase.',
  },
  {
    id: 'refactor',
    title: 'Refactor Technical Debt Survey',
    description: 'Detect duplication, complexity hotspots, and risky dependencies.',
  },
];

class MetaAgentWorkflowService {
  constructor(options = {}) {
    this.options = { ...options };
    this.fileSystem = this.options.fileSystem || new NodeFileSystem();
    this.sessions = new Map();
  }

  listWorkflows() {
    return [...WORKFLOW_DEFINITIONS];
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getActiveSessions() {
    return [...this.sessions.values()];
  }

  start(workflowId, input) {
    const agent = this.#buildAgent(workflowId, input);
    return agent.run().then((result) => {
      const sessionId = `${workflowId}-${Date.now()}`;
      this.sessions.set(sessionId, result);
      return { sessionId, result };
    });
  }

  #runtime() {
    return {
      ...this.options,
      fileSystem: this.fileSystem,
    };
  }

  #buildAgent(workflowId, input) {
    const runtime = this.#runtime();
    switch (workflowId) {
      case 'genesis': {
        return new GenesisMetaAgent(input, runtime);
      }
      case 'librarian': {
        return new LibrarianMetaAgent(input, runtime);
      }
      case 'refactor': {
        return new RefactorMetaAgent(input, runtime);
      }
      default: {
        throw new Error(`Unsupported workflow: ${workflowId}`);
      }
    }
  }
}

module.exports = {
  MetaAgentWorkflowService,
  WORKFLOW_DEFINITIONS,
};
