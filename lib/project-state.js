/**
 * Project State Management
 * Tracks project progress, conversation history, and deliverables
 */

const fs = require('fs-extra');
const path = require('node:path');

class ProjectState {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.stateDir = path.join(projectPath, '.aidesigner');
    this.stateFile = path.join(this.stateDir, 'state.json');
    this.conversationFile = path.join(this.stateDir, 'conversation.json');
    this.deliverablesFile = path.join(this.stateDir, 'deliverables.json');
    this.reviewsFile = path.join(this.stateDir, 'reviews.json');
    this.storiesFile = path.join(this.stateDir, 'stories.json');

    this.state = {
      projectId: null,
      projectName: null,
      currentPhase: 'analyst',
      currentLane: null, // 'aidesigner' or 'spec_kit'
      phaseHistory: [],
      laneHistory: [], // Track lane decisions
      requirements: {},
      decisions: {},
      userPreferences: {},
      nextSteps: '',
      createdAt: null,
      updatedAt: null,
      integrations: {
        drawbridge: {
          ingestions: [],
          lastMode: null,
        },
      },
    };

    this.conversation = [];
    this.deliverables = {};
    this.reviewHistory = [];
    this.stories = {
      records: {},
      latestId: null,
    };
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

    this.ensureIntegrationState();

    if (await fs.pathExists(this.conversationFile)) {
      this.conversation = await fs.readJson(this.conversationFile);
    }

    if (await fs.pathExists(this.deliverablesFile)) {
      this.deliverables = await fs.readJson(this.deliverablesFile);
    }

    if (await fs.pathExists(this.reviewsFile)) {
      this.reviewHistory = await fs.readJson(this.reviewsFile);
    }

    if (await fs.pathExists(this.storiesFile)) {
      const storedStories = await fs.readJson(this.storiesFile);

      if (storedStories && typeof storedStories === 'object') {
        if (storedStories.records && typeof storedStories.records === 'object') {
          this.stories.records = storedStories.records;
        } else {
          this.stories.records = storedStories;
        }

        if (storedStories.latestId) {
          this.stories.latestId = storedStories.latestId;
        }
      }
    }
  }

  /**
   * Save state to disk
   */
  async save() {
    this.ensureIntegrationState();
    this.state.updatedAt = new Date().toISOString();

    await fs.writeJson(this.stateFile, this.state, { spaces: 2 });
    await fs.writeJson(this.conversationFile, this.conversation, { spaces: 2 });
    await fs.writeJson(this.deliverablesFile, this.deliverables, { spaces: 2 });
    await fs.writeJson(this.reviewsFile, this.reviewHistory, { spaces: 2 });
    await fs.writeJson(this.storiesFile, this.stories, { spaces: 2 });
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

    const timestamp = new Date().toISOString();

    const record = {
      content,
      timestamp,
      ...metadata,
    };

    if (type === 'story') {
      const structuredStory = this.normalizeStructuredStory(metadata, content, timestamp);

      if (structuredStory) {
        record.structured = structuredStory;
        record.storyId = structuredStory.id;
        this.cacheStructuredStory(structuredStory);
      }
    }

    this.deliverables[this.state.currentPhase][type] = record;

    await this.save();
  }

  /**
   * Normalize structured story metadata into a consistent format
   */
  normalizeStructuredStory(metadata = {}, content = '', timestamp = new Date().toISOString()) {
    const candidateSources = [
      metadata.structuredStory,
      metadata.structured,
      metadata.story,
      metadata.fields,
    ];

    let structured = candidateSources.find((value) => value && typeof value === 'object');

    if (!structured && metadata && typeof metadata === 'object') {
      const {
        title,
        persona,
        userRole,
        action,
        benefit,
        summary,
        description,
        acceptanceCriteria,
        definitionOfDone,
        technicalDetails,
        implementationNotes,
        testingStrategy,
        dependencies,
        epicNumber,
        storyNumber,
      } = metadata;

      const hasMetadata =
        title ||
        persona ||
        userRole ||
        action ||
        benefit ||
        summary ||
        description ||
        (Array.isArray(acceptanceCriteria) && acceptanceCriteria.length > 0) ||
        (Array.isArray(definitionOfDone) && definitionOfDone.length > 0) ||
        technicalDetails ||
        implementationNotes ||
        testingStrategy ||
        dependencies ||
        epicNumber != null ||
        storyNumber != null;

      if (hasMetadata) {
        structured = {
          title,
          persona,
          userRole,
          action,
          benefit,
          summary,
          description,
          acceptanceCriteria,
          definitionOfDone,
          technicalDetails,
          implementationNotes,
          testingStrategy,
          dependencies,
          epicNumber,
          storyNumber,
        };
      }
    }

    if (!structured || typeof structured !== 'object') {
      return null;
    }

    const normalized = { ...structured };

    const epicNumber = metadata.epicNumber ?? structured.epicNumber ?? structured.epic ?? null;
    const storyNumber = metadata.storyNumber ?? structured.storyNumber ?? null;

    const resolvedId =
      metadata.storyId ||
      metadata.storyKey ||
      structured.id ||
      (epicNumber != null && storyNumber != null
        ? `${epicNumber}.${storyNumber}`
        : structured.slug || null);

    if (epicNumber != null) {
      normalized.epicNumber = epicNumber;
    }

    if (storyNumber != null) {
      normalized.storyNumber = storyNumber;
    }

    normalized.id = resolvedId || normalized.id || 'latest';
    normalized.title = normalized.title || metadata.title || null;
    normalized.persona = normalized.persona ?? metadata.persona ?? null;
    normalized.userRole = normalized.userRole ?? metadata.userRole ?? null;
    normalized.action = normalized.action ?? metadata.action ?? null;
    normalized.benefit = normalized.benefit ?? metadata.benefit ?? null;
    normalized.summary = normalized.summary ?? metadata.summary ?? null;
    normalized.description = normalized.description ?? metadata.description ?? null;
    normalized.acceptanceCriteria = this.normalizeStoryList(
      normalized.acceptanceCriteria ?? metadata.acceptanceCriteria,
    );
    normalized.definitionOfDone = this.normalizeStoryList(
      normalized.definitionOfDone ?? metadata.definitionOfDone,
    );
    normalized.technicalDetails = normalized.technicalDetails ?? metadata.technicalDetails ?? null;
    normalized.implementationNotes =
      normalized.implementationNotes ?? metadata.implementationNotes ?? null;
    normalized.testingStrategy = normalized.testingStrategy ?? metadata.testingStrategy ?? null;
    normalized.dependencies = normalized.dependencies ?? metadata.dependencies ?? null;
    normalized.path = metadata.path || normalized.path || null;
    normalized.content = content || normalized.content || null;
    normalized.storedAt = timestamp;
    normalized.sourcePhase = this.state.currentPhase;

    return normalized;
  }

  /**
   * Normalize checklist style arrays
   */
  normalizeStoryList(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [value].filter(Boolean);
  }

  /**
   * Cache a structured story record for quick retrieval
   */
  cacheStructuredStory(story) {
    if (!story || typeof story !== 'object') {
      return;
    }

    if (!this.stories || typeof this.stories !== 'object') {
      this.stories = {
        records: {},
        latestId: null,
      };
    }

    if (!this.stories.records || typeof this.stories.records !== 'object') {
      this.stories.records = {};
    }

    const key = story.id || 'latest';
    this.stories.records[key] = { ...story };
    this.stories.latestId = key;
  }

  /**
   * Retrieve a structured story record
   */
  getStory(storyId = null) {
    if (!this.stories || typeof this.stories !== 'object') {
      return null;
    }

    const { records = {}, latestId = null } = this.stories;

    if (storyId && records[storyId]) {
      return { ...records[storyId] };
    }

    if (latestId && records[latestId]) {
      return { ...records[latestId] };
    }

    const candidates = Object.values(records)
      .filter((record) => record && typeof record === 'object' && record.storedAt)
      .sort((a, b) => {
        const aTime = new Date(a.storedAt).getTime();
        const bTime = new Date(b.storedAt).getTime();
        return bTime - aTime;
      });

    if (candidates.length > 0) {
      const latest = candidates[0];
      return { ...latest };
    }

    const firstRecord = Object.values(records)[0];
    return firstRecord && typeof firstRecord === 'object' ? { ...firstRecord } : null;
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
   * Record a review outcome for governance checkpoints
   */
  async recordReviewOutcome(checkpoint, details = {}) {
    if (!this.reviewHistory) {
      this.reviewHistory = [];
    }

    const record = {
      checkpoint,
      ...details,
      timestamp: new Date().toISOString(),
    };

    this.reviewHistory.push(record);
    await this.save();

    return record;
  }

  /**
   * Retrieve review history
   */
  getReviewHistory(limit = null) {
    if (!this.reviewHistory) {
      return [];
    }

    if (limit) {
      return this.reviewHistory.slice(-limit);
    }

    return [...this.reviewHistory];
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
      reviewHistory: this.getReviewHistory(5),
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
      currentLane: null,
      phaseHistory: [],
      laneHistory: [],
      requirements: {},
      decisions: {},
      userPreferences: {},
      nextSteps: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      integrations: {
        drawbridge: {
          ingestions: [],
          lastMode: null,
        },
      },
    };

    this.conversation = [];
    this.deliverables = {};
    this.reviewHistory = [];
    this.stories = {
      records: {},
      latestId: null,
    };

    await this.initialize();
  }

  /**
   * Record a lane decision
   */
  async recordLaneDecision(lane, rationale, confidence, userMessage = '', options = {}) {
    if (!this.state.laneHistory) {
      this.state.laneHistory = [];
    }

    const { level, levelScore, levelSignals, levelRationale } = options || {};
    const decision = {
      lane,
      rationale,
      confidence,
      userMessage,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
    };

    if (level !== undefined) {
      decision.level = level;
    }
    if (levelScore !== undefined) {
      decision.levelScore = levelScore;
    }
    if (levelSignals !== undefined) {
      decision.levelSignals = levelSignals;
    }
    if (levelRationale !== undefined) {
      decision.levelRationale = levelRationale;
    }

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
    return this.state.currentLane || 'aidesigner';
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
    return `aidesigner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Ensures the integrations state structure exists with proper defaults
   * @private
   */
  ensureIntegrationState() {
    if (!this.state.integrations || typeof this.state.integrations !== 'object') {
      this.state.integrations = {};
    }

    const drawbridge = this.state.integrations.drawbridge;

    if (!drawbridge || typeof drawbridge !== 'object' || Array.isArray(drawbridge)) {
      this.state.integrations.drawbridge = {
        ingestions: [],
        lastMode: null,
      };
      return;
    }

    if (!Array.isArray(drawbridge.ingestions)) {
      drawbridge.ingestions = [];
    }

    if (!Object.prototype.hasOwnProperty.call(drawbridge, 'lastMode')) {
      drawbridge.lastMode = null;
    }
  }

  /**
   * Records a new Drawbridge ingestion in project state
   * Automatically rotates old ingestions when limit is reached (max 100)
   * @param {Object} ingestion - Ingestion metadata
   * @param {string} [ingestion.mode] - Ingestion mode (step|batch|yolo)
   * @param {Array<Object>} [ingestion.tasks] - Task array with visual feedback items
   * @param {string} [ingestion.packId] - Unique pack identifier
   * @param {Object} [ingestion.stats] - Statistics about the ingestion
   * @param {Object} [ingestion.source] - Source file information
   * @param {Object} [ingestion.metadata] - Additional metadata
   * @param {Object} [ingestion.docs] - Documentation paths
   * @returns {Promise<Object>} The recorded ingestion record
   * @throws {Error} If state save fails
   */
  async recordDrawbridgeIngestion(ingestion = {}) {
    this.ensureIntegrationState();

    const drawbridge = this.state.integrations.drawbridge;
    const MAX_INGESTIONS = 100; // Limit to prevent unbounded growth

    const timestamp = ingestion.ingestedAt || new Date().toISOString();
    const mode = ingestion.mode || null;
    const ingestionId =
      ingestion.ingestionId ||
      ingestion.packId ||
      `drawbridge-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const packId = ingestion.packId || ingestionId;

    const tasks = Array.isArray(ingestion.tasks)
      ? ingestion.tasks.map((task) => {
          const selectors = [task.selectors || []].flat().filter(Boolean);
          const references = [task.references || []].flat().filter(Boolean);

          return {
            id: task.id || task.taskId || task.commentId || null,
            summary: task.summary || task.title || task.comment || '',
            action: task.action || task.intent || null,
            severity: task.severity || task.level || null,
            status: task.status || 'pending',
            selectors,
            screenshot: task.screenshot || null,
            markdownExcerpt: task.markdownExcerpt || task.markdown || null,
            lane: task.lane || null,
            references,
          };
        })
      : [];

    const stats =
      ingestion.stats && typeof ingestion.stats === 'object'
        ? { ...ingestion.stats }
        : (() => {
            const withScreenshotsCount = tasks.filter((task) => Boolean(task.screenshot)).length;
            return {
              total: tasks.length,
              withScreenshots: withScreenshotsCount,
              withoutScreenshots: tasks.length - withScreenshotsCount,
            };
          })();

    const record = {
      ingestionId,
      packId,
      mode,
      ingestedAt: timestamp,
      source: ingestion.source ? { ...ingestion.source } : {},
      tasks,
      stats,
      metadata: ingestion.metadata ? { ...ingestion.metadata } : {},
      docs: ingestion.docs ? { ...ingestion.docs } : {},
    };

    // Implement rotation to prevent unbounded growth
    if (drawbridge.ingestions.length >= MAX_INGESTIONS) {
      // Remove oldest ingestions, keeping only the most recent MAX_INGESTIONS - 1
      drawbridge.ingestions = drawbridge.ingestions.slice(-(MAX_INGESTIONS - 1));
    }

    drawbridge.ingestions.push(record);
    drawbridge.lastMode = mode;

    await this.save();

    return record;
  }

  /**
   * Retrieves all Drawbridge ingestion records with deep copies to prevent mutation
   * @returns {Array<Object>} Array of ingestion records with tasks
   */
  getDrawbridgeIngestions() {
    this.ensureIntegrationState();
    const drawbridge = this.state.integrations.drawbridge;

    return drawbridge.ingestions.map((record) => ({
      ...record,
      tasks: Array.isArray(record.tasks)
        ? record.tasks.map((task) => ({
            ...task,
            selectors: Array.isArray(task.selectors) ? [...task.selectors] : [],
            references: Array.isArray(task.references) ? [...task.references] : [],
          }))
        : [],
    }));
  }

  /**
   * Retrieves a filtered review queue of Drawbridge tasks
   * @param {Object} options - Options for queue filtering
   * @param {boolean} [options.includeResolved=false] - Whether to include resolved tasks
   * @returns {Array<Object>} Array of task items sorted by ingestion date (newest first)
   */
  getDrawbridgeReviewQueue(options = {}) {
    const { includeResolved = false } = options;
    const queue = [];
    // Resolved status constants
    const resolvedStatuses = new Set([
      'resolved',
      'done',
      'closed',
      'complete',
      'completed',
      'approved',
    ]);

    for (const ingestion of this.getDrawbridgeIngestions()) {
      for (const task of ingestion.tasks) {
        const status = typeof task.status === 'string' ? task.status.toLowerCase() : 'pending';
        if (!includeResolved && resolvedStatuses.has(status)) {
          continue;
        }

        queue.push({
          packId: ingestion.packId,
          ingestionId: ingestion.ingestionId,
          mode: ingestion.mode,
          ingestedAt: ingestion.ingestedAt,
          id: task.id,
          summary: task.summary,
          selectors: task.selectors,
          screenshot: task.screenshot,
          status: task.status,
          severity: task.severity,
          action: task.action,
          lane: task.lane,
          markdownExcerpt: task.markdownExcerpt,
        });
      }
    }

    return queue.sort((a, b) => {
      const aTime = new Date(a.ingestedAt || 0).getTime();
      const bTime = new Date(b.ingestedAt || 0).getTime();
      if (aTime === bTime) {
        return (a.id || '').localeCompare(b.id || '');
      }
      return bTime - aTime;
    });
  }
}

module.exports = { ProjectState };
