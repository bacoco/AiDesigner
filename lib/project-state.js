/**
 * Project State Management
 * Tracks project progress, conversation history, and deliverables
 */

const fs = require('fs-extra');
const path = require('node:path');

class ProjectState {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.stateDir = path.join(projectPath, '.bmad-invisible');
    this.stateFile = path.join(this.stateDir, 'state.json');
    this.conversationFile = path.join(this.stateDir, 'conversation.json');
    this.deliverablesFile = path.join(this.stateDir, 'deliverables.json');

    this.state = {
      projectId: null,
      projectName: null,
      currentPhase: 'analyst',
      currentLane: null, // 'bmad' or 'spec_kit'
      phaseHistory: [],
      laneHistory: [], // Track lane decisions
      requirements: {},
      decisions: {},
      userPreferences: {},
      nextSteps: '',
      createdAt: null,
      updatedAt: null,
    };

    this.conversation = [];
    this.deliverables = {};
  }

  /**
   * Initialize or load existing project state
   */
  async initialize() {
    await fs.ensureDir(this.stateDir);

    if (await fs.pathExists(this.stateFile)) {
      await this.load();
    } else {
      this.state.projectId = this.generateProjectId();
      this.state.createdAt = new Date().toISOString();
      this.state.updatedAt = new Date().toISOString();
      await this.save();
    }

    return this.state;
  }

  /**
   * Load state from disk
   */
  async load() {
    if (await fs.pathExists(this.stateFile)) {
      this.state = await fs.readJson(this.stateFile);
    }

    if (await fs.pathExists(this.conversationFile)) {
      this.conversation = await fs.readJson(this.conversationFile);
    }

    if (await fs.pathExists(this.deliverablesFile)) {
      this.deliverables = await fs.readJson(this.deliverablesFile);
    }
  }

  /**
   * Save state to disk
   */
  async save() {
    this.state.updatedAt = new Date().toISOString();

    await fs.writeJson(this.stateFile, this.state, { spaces: 2 });
    await fs.writeJson(this.conversationFile, this.conversation, { spaces: 2 });
    await fs.writeJson(this.deliverablesFile, this.deliverables, { spaces: 2 });
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state properties
   */
  async updateState(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    await this.save();
  }

  /**
   * Transition to a new phase
   */
  async transitionPhase(newPhase, context = {}) {
    const transition = {
      from: this.state.currentPhase,
      to: newPhase,
      timestamp: new Date().toISOString(),
      context,
    };

    this.state.phaseHistory.push(transition);
    this.state.currentPhase = newPhase;
    this.state.updatedAt = new Date().toISOString();

    await this.save();

    return transition;
  }

  /**
   * Add a message to conversation history
   */
  async addMessage(role, content, metadata = {}) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
      ...metadata,
    };

    this.conversation.push(message);
    await this.save();

    return message;
  }

  /**
   * Get conversation history
   */
  getConversation(limit = null) {
    if (limit) {
      return this.conversation.slice(-limit);
    }
    return [...this.conversation];
  }

  /**
   * Get conversation for a specific phase
   */
  getPhaseConversation(phase) {
    return this.conversation.filter((msg) => msg.phase === phase);
  }

  /**
   * Store a deliverable
   */
  async storeDeliverable(type, content, metadata = {}) {
    if (!this.deliverables[this.state.currentPhase]) {
      this.deliverables[this.state.currentPhase] = {};
    }

    this.deliverables[this.state.currentPhase][type] = {
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    await this.save();
  }

  /**
   * Get deliverable
   */
  getDeliverable(phase, type) {
    return this.deliverables[phase]?.[type];
  }

  /**
   * Get all deliverables for a phase
   */
  getPhaseDeliverables(phase) {
    return this.deliverables[phase] || {};
  }

  /**
   * Get all deliverables
   */
  getAllDeliverables() {
    return { ...this.deliverables };
  }

  /**
   * Update requirements
   */
  async updateRequirements(requirements) {
    this.state.requirements = {
      ...this.state.requirements,
      ...requirements,
    };
    await this.save();
  }

  /**
   * Record a decision
   */
  async recordDecision(key, value, rationale = '') {
    if (!this.state.decisions) {
      this.state.decisions = {};
    }

    this.state.decisions[key] = {
      value,
      rationale,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
    };

    await this.save();
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    this.state.userPreferences = {
      ...this.state.userPreferences,
      ...preferences,
    };
    await this.save();
  }

  /**
   * Set next steps
   */
  async setNextSteps(steps) {
    this.state.nextSteps = steps;
    await this.save();
  }

  /**
   * Get project summary
   */
  getSummary() {
    return {
      projectId: this.state.projectId,
      projectName: this.state.projectName,
      currentPhase: this.state.currentPhase,
      phaseCount: this.state.phaseHistory.length,
      messageCount: this.conversation.length,
      deliverableCount: Object.keys(this.deliverables).reduce(
        (count, phase) => count + Object.keys(this.deliverables[phase]).length,
        0,
      ),
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }

  /**
   * Export state for LLM context
   */
  exportForLLM() {
    return {
      currentPhase: this.state.currentPhase,
      requirements: this.state.requirements,
      decisions: this.state.decisions,
      userPreferences: this.state.userPreferences,
      nextSteps: this.state.nextSteps,
      recentConversation: this.getConversation(10),
      deliverables: this.getAllDeliverables(),
    };
  }

  /**
   * Clear state (for starting fresh)
   */
  async clear() {
    if (await fs.pathExists(this.stateDir)) {
      await fs.remove(this.stateDir);
    }

    this.state = {
      projectId: this.generateProjectId(),
      projectName: null,
      currentPhase: 'analyst',
      phaseHistory: [],
      requirements: {},
      decisions: {},
      userPreferences: {},
      nextSteps: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversation = [];
    this.deliverables = {};

    await this.initialize();
  }

  /**
   * Record a lane decision
   */
  async recordLaneDecision(lane, rationale, confidence, userMessage = '') {
    if (!this.state.laneHistory) {
      this.state.laneHistory = [];
    }

    const decision = {
      lane,
      rationale,
      confidence,
      userMessage,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
    };

    this.state.laneHistory.push(decision);
    this.state.currentLane = lane;
    await this.save();

    return decision;
  }

  /**
   * Get lane history
   */
  getLaneHistory(limit = null) {
    if (!this.state.laneHistory) {
      return [];
    }

    if (limit) {
      return this.state.laneHistory.slice(-limit);
    }

    return [...this.state.laneHistory];
  }

  /**
   * Get current lane
   */
  getCurrentLane() {
    return this.state.currentLane || 'bmad';
  }

  /**
   * Get artifacts from docs/ folder
   */
  async getArtifacts() {
    const docsDir = path.join(this.projectPath, 'docs');

    if (!(await fs.pathExists(docsDir))) {
      return {
        exists: false,
        artifacts: [],
      };
    }

    const artifacts = [];
    const scanDir = async (dir, relativePath = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          artifacts.push(relPath);
        }
      }
    };

    await scanDir(docsDir);

    return {
      exists: true,
      artifacts,
      count: artifacts.length,
    };
  }

  /**
   * Generate unique project ID
   */
  generateProjectId() {
    return `bmad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

module.exports = { ProjectState };
