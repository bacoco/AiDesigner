'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProjectState = void 0;
const fs_extra_1 = __importDefault(require('fs-extra'));
const node_path_1 = __importDefault(require('node:path'));
const zod_1 = require('zod');
const MessageSchema = zod_1.z
  .object({
    role: zod_1.z.string(),
    content: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    phase: zod_1.z.string(),
  })
  .catchall(zod_1.z.unknown());
const StructuredStorySchema = zod_1.z
  .object({
    id: zod_1.z.string().nullable(),
    title: zod_1.z.string().nullable().optional(),
    persona: zod_1.z.string().nullable().optional(),
    userRole: zod_1.z.string().nullable().optional(),
    action: zod_1.z.string().nullable().optional(),
    benefit: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    acceptanceCriteria: zod_1.z.array(zod_1.z.string()).optional(),
    definitionOfDone: zod_1.z.array(zod_1.z.string()).optional(),
    technicalDetails: zod_1.z.string().nullable().optional(),
    implementationNotes: zod_1.z.string().nullable().optional(),
    testingStrategy: zod_1.z.string().nullable().optional(),
    dependencies: zod_1.z.unknown().optional(),
    epicNumber: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).nullable().optional(),
    storyNumber: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).nullable().optional(),
    path: zod_1.z.string().nullable().optional(),
    content: zod_1.z.unknown().optional(),
    storedAt: zod_1.z.string().nullable().optional(),
    sourcePhase: zod_1.z.string().nullable().optional(),
  })
  .catchall(zod_1.z.unknown());
const DeliverableSchema = zod_1.z
  .object({
    content: zod_1.z.unknown(),
    timestamp: zod_1.z.string(),
    structured: StructuredStorySchema.nullable().optional(),
    storyId: zod_1.z.string().nullable().optional(),
  })
  .catchall(zod_1.z.unknown());
const DeliverablesSchema = zod_1.z.record(zod_1.z.record(DeliverableSchema));
const ReviewRecordSchema = zod_1.z
  .object({
    checkpoint: zod_1.z.string().optional(),
    timestamp: zod_1.z.string(),
  })
  .catchall(zod_1.z.unknown());
const LaneDecisionSchema = zod_1.z
  .object({
    lane: zod_1.z.string(),
    rationale: zod_1.z.string(),
    confidence: zod_1.z.number(),
    userMessage: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    phase: zod_1.z.string(),
    level: zod_1.z.string().optional(),
    levelScore: zod_1.z.number().optional(),
    levelSignals: zod_1.z.unknown().optional(),
    levelRationale: zod_1.z.string().optional(),
  })
  .catchall(zod_1.z.unknown());
const PhaseTransitionSchema = zod_1.z.object({
  from: zod_1.z.string(),
  to: zod_1.z.string(),
  timestamp: zod_1.z.string(),
  context: zod_1.z.record(zod_1.z.unknown()),
});
const DrawbridgeTaskSchema = zod_1.z
  .object({
    id: zod_1.z.string().nullable(),
    summary: zod_1.z.string().nullable(),
    status: zod_1.z.string().nullable(),
    severity: zod_1.z.string().nullable(),
    action: zod_1.z.string().nullable(),
    lane: zod_1.z.string().nullable(),
    selectors: zod_1.z.array(zod_1.z.string()),
    references: zod_1.z.array(zod_1.z.string()),
    screenshot: zod_1.z.string().nullable(),
    markdownExcerpt: zod_1.z.string().nullable(),
  })
  .catchall(zod_1.z.unknown());
const DrawbridgeStatsSchema = zod_1.z
  .object({
    total: zod_1.z.number(),
    withScreenshots: zod_1.z.number(),
    withoutScreenshots: zod_1.z.number(),
  })
  .catchall(zod_1.z.unknown());
const DrawbridgeIngestionSchema = zod_1.z
  .object({
    ingestionId: zod_1.z.string().nullable(),
    packId: zod_1.z.string().nullable(),
    mode: zod_1.z.string().nullable(),
    ingestedAt: zod_1.z.string(),
    source: zod_1.z.record(zod_1.z.unknown()),
    tasks: zod_1.z.array(DrawbridgeTaskSchema),
    stats: DrawbridgeStatsSchema,
    metadata: zod_1.z.record(zod_1.z.unknown()),
    docs: zod_1.z.record(zod_1.z.unknown()),
  })
  .catchall(zod_1.z.unknown());
const DrawbridgeIntegrationSchema = zod_1.z
  .object({
    ingestions: zod_1.z.array(DrawbridgeIngestionSchema),
    lastMode: zod_1.z.string().nullable(),
  })
  .catchall(zod_1.z.unknown());
const IntegrationsSchema = zod_1.z
  .object({
    drawbridge: DrawbridgeIntegrationSchema,
  })
  .catchall(zod_1.z.unknown());
const StoriesSchema = zod_1.z.object({
  records: zod_1.z.record(StructuredStorySchema),
  latestId: zod_1.z.string().nullable(),
});
const ProjectStateDataSchema = zod_1.z.object({
  projectId: zod_1.z.string().nullable(),
  projectName: zod_1.z.string().nullable(),
  currentPhase: zod_1.z.string(),
  currentLane: zod_1.z.string().nullable(),
  phaseHistory: zod_1.z.array(PhaseTransitionSchema),
  laneHistory: zod_1.z.array(LaneDecisionSchema),
  requirements: zod_1.z.record(zod_1.z.unknown()),
  decisions: zod_1.z.record(zod_1.z.unknown()),
  userPreferences: zod_1.z.record(zod_1.z.unknown()),
  nextSteps: zod_1.z.string(),
  createdAt: zod_1.z.string().nullable(),
  updatedAt: zod_1.z.string().nullable(),
  integrations: IntegrationsSchema,
});
const ConversationSchema = zod_1.z.array(MessageSchema);
const ReviewHistorySchema = zod_1.z.array(ReviewRecordSchema);
class ProjectState {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.stateDir = node_path_1.default.join(projectPath, '.aidesigner');
    this.stateFile = node_path_1.default.join(this.stateDir, 'state.json');
    this.conversationFile = node_path_1.default.join(this.stateDir, 'conversation.json');
    this.deliverablesFile = node_path_1.default.join(this.stateDir, 'deliverables.json');
    this.reviewsFile = node_path_1.default.join(this.stateDir, 'reviews.json');
    this.storiesFile = node_path_1.default.join(this.stateDir, 'stories.json');
    this.state = this.createDefaultState();
    this.conversation = [];
    this.deliverables = {};
    this.reviewHistory = [];
    this.stories = this.createEmptyStories();
  }
  createDefaultState() {
    const timestamp = new Date().toISOString();
    return {
      projectId: null,
      projectName: null,
      currentPhase: 'analyst',
      currentLane: null,
      phaseHistory: [],
      laneHistory: [],
      requirements: {},
      decisions: {},
      userPreferences: {},
      nextSteps: '',
      createdAt: null,
      updatedAt: timestamp,
      integrations: {
        drawbridge: {
          ingestions: [],
          lastMode: null,
        },
      },
    };
  }
  createEmptyStories() {
    return {
      records: {},
      latestId: null,
    };
  }
  async initialize() {
    await fs_extra_1.default.ensureDir(this.stateDir);
    if (await fs_extra_1.default.pathExists(this.stateFile)) {
      await this.load();
    } else {
      const now = new Date().toISOString();
      this.state.projectId = this.generateProjectId();
      this.state.createdAt = now;
      this.state.updatedAt = now;
      await this.save();
    }
    return this.getState();
  }
  async load() {
    const stateExists = await fs_extra_1.default.pathExists(this.stateFile);
    const conversationExists = await fs_extra_1.default.pathExists(this.conversationFile);
    const deliverablesExists = await fs_extra_1.default.pathExists(this.deliverablesFile);
    const reviewsExists = await fs_extra_1.default.pathExists(this.reviewsFile);
    const storiesExists = await fs_extra_1.default.pathExists(this.storiesFile);
    const stateRaw = stateExists ? await fs_extra_1.default.readJson(this.stateFile) : undefined;
    const conversationRaw = conversationExists
      ? await fs_extra_1.default.readJson(this.conversationFile)
      : undefined;
    const deliverablesRaw = deliverablesExists
      ? await fs_extra_1.default.readJson(this.deliverablesFile)
      : undefined;
    const reviewsRaw = reviewsExists
      ? await fs_extra_1.default.readJson(this.reviewsFile)
      : undefined;
    const storiesRaw = storiesExists
      ? await fs_extra_1.default.readJson(this.storiesFile)
      : undefined;
    if (stateRaw) {
      const parsed = ProjectStateDataSchema.safeParse({
        ...this.createDefaultState(),
        ...stateRaw,
      });
      this.state = parsed.success ? parsed.data : this.createDefaultState();
    } else {
      this.state = this.createDefaultState();
    }
    this.ensureIntegrationState();
    const conversationResult = conversationRaw
      ? ConversationSchema.safeParse(conversationRaw)
      : null;
    this.conversation = conversationResult?.success ? conversationResult.data : [];
    const deliverablesResult = deliverablesRaw
      ? DeliverablesSchema.safeParse(deliverablesRaw)
      : null;
    this.deliverables = deliverablesResult?.success ? deliverablesResult.data : {};
    const reviewResult = reviewsRaw ? ReviewHistorySchema.safeParse(reviewsRaw) : null;
    this.reviewHistory = reviewResult?.success ? reviewResult.data : [];
    this.stories = this.parseStories(storiesRaw);
  }
  parseStories(raw) {
    if (!raw) {
      return this.createEmptyStories();
    }
    if (StoriesSchema.safeParse(raw).success) {
      return StoriesSchema.parse(raw);
    }
    if (typeof raw === 'object' && raw) {
      const candidate = raw;
      if ('records' in candidate && typeof candidate.records === 'object' && candidate.records) {
        const parsed = StoriesSchema.safeParse({
          records: candidate.records,
          latestId: candidate.latestId ?? null,
        });
        if (parsed.success) {
          return parsed.data;
        }
      }
      const fallbackRecords = {};
      for (const [key, value] of Object.entries(candidate)) {
        const parsedStory = StructuredStorySchema.safeParse(value);
        if (parsedStory.success) {
          fallbackRecords[key] = parsedStory.data;
        }
      }
      return {
        records: fallbackRecords,
        latestId: null,
      };
    }
    return this.createEmptyStories();
  }
  async save() {
    this.ensureIntegrationState();
    this.state.updatedAt = new Date().toISOString();
    await Promise.all([
      fs_extra_1.default.writeJson(this.stateFile, this.state, { spaces: 2 }),
      fs_extra_1.default.writeJson(this.conversationFile, this.conversation, { spaces: 2 }),
      fs_extra_1.default.writeJson(this.deliverablesFile, this.deliverables, { spaces: 2 }),
      fs_extra_1.default.writeJson(this.reviewsFile, this.reviewHistory, { spaces: 2 }),
      fs_extra_1.default.writeJson(this.storiesFile, this.stories, { spaces: 2 }),
    ]);
  }
  getState() {
    return {
      ...this.state,
      phaseHistory: [...this.state.phaseHistory],
      laneHistory: [...this.state.laneHistory],
      requirements: { ...this.state.requirements },
      decisions: { ...this.state.decisions },
      userPreferences: { ...this.state.userPreferences },
      integrations: {
        ...this.state.integrations,
        drawbridge: {
          ...this.state.integrations.drawbridge,
          ingestions: [...this.state.integrations.drawbridge.ingestions],
        },
      },
    };
  }
  async updateState(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    await this.save();
  }
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
  getConversation(limit = null) {
    if (typeof limit === 'number' && limit > 0) {
      return this.conversation.slice(-limit);
    }
    return [...this.conversation];
  }
  getPhaseConversation(phase) {
    return this.conversation.filter((msg) => msg.phase === phase);
  }
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
  normalizeStructuredStory(metadata = {}, content = '', timestamp = new Date().toISOString()) {
    const metadataRecord = metadata;
    const candidateSources = [
      metadataRecord.structuredStory,
      metadataRecord.structured,
      metadataRecord.story,
      metadataRecord.fields,
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
      } = metadataRecord;
      const hasMetadata =
        Boolean(title) ||
        Boolean(persona) ||
        Boolean(userRole) ||
        Boolean(action) ||
        Boolean(benefit) ||
        Boolean(summary) ||
        Boolean(description) ||
        (Array.isArray(acceptanceCriteria) && acceptanceCriteria.length > 0) ||
        (Array.isArray(definitionOfDone) && definitionOfDone.length > 0) ||
        Boolean(technicalDetails) ||
        Boolean(implementationNotes) ||
        Boolean(testingStrategy) ||
        Boolean(dependencies) ||
        epicNumber != null ||
        storyNumber != null;
      if (hasMetadata) {
        structured = {
          title: title ?? null,
          persona: persona ?? null,
          userRole: userRole ?? null,
          action: action ?? null,
          benefit: benefit ?? null,
          summary: summary ?? null,
          description: description ?? null,
          acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : undefined,
          definitionOfDone: Array.isArray(definitionOfDone) ? definitionOfDone : undefined,
          technicalDetails: technicalDetails ?? null,
          implementationNotes: implementationNotes ?? null,
          testingStrategy: testingStrategy ?? null,
          dependencies,
          epicNumber: epicNumber ?? null,
          storyNumber: storyNumber ?? null,
        };
      }
    }
    if (!structured || typeof structured !== 'object') {
      return null;
    }
    const normalized = { ...structured };
    const structuredRecord = structured;
    const coerceIdentifier = (value) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      return null;
    };
    const epicNumber =
      coerceIdentifier(metadataRecord.epicNumber) ??
      coerceIdentifier(normalized.epicNumber) ??
      coerceIdentifier(structuredRecord.epic);
    const storyNumber =
      coerceIdentifier(metadataRecord.storyNumber) ?? coerceIdentifier(normalized.storyNumber);
    const resolvedId =
      metadataRecord.storyId ||
      metadataRecord.storyKey ||
      normalized.id ||
      (epicNumber !== undefined && epicNumber !== null && storyNumber !== null
        ? `${epicNumber}.${storyNumber}`
        : structuredRecord.slug || null);
    if (epicNumber != null) {
      normalized.epicNumber = epicNumber;
    }
    if (storyNumber != null) {
      normalized.storyNumber = storyNumber;
    }
    normalized.id = resolvedId ?? normalized.id ?? 'latest';
    normalized.title = normalized.title ?? metadataRecord.title ?? null;
    normalized.persona = normalized.persona ?? metadataRecord.persona ?? null;
    normalized.userRole = normalized.userRole ?? metadataRecord.userRole ?? null;
    normalized.action = normalized.action ?? metadataRecord.action ?? null;
    normalized.benefit = normalized.benefit ?? metadataRecord.benefit ?? null;
    normalized.summary = normalized.summary ?? metadataRecord.summary ?? null;
    normalized.description = normalized.description ?? metadataRecord.description ?? null;
    normalized.acceptanceCriteria = this.normalizeStoryList(
      normalized.acceptanceCriteria ?? metadataRecord.acceptanceCriteria,
    );
    normalized.definitionOfDone = this.normalizeStoryList(
      normalized.definitionOfDone ?? metadataRecord.definitionOfDone,
    );
    normalized.technicalDetails =
      normalized.technicalDetails ?? metadataRecord.technicalDetails ?? null;
    normalized.implementationNotes =
      normalized.implementationNotes ?? metadataRecord.implementationNotes ?? null;
    normalized.testingStrategy =
      normalized.testingStrategy ?? metadataRecord.testingStrategy ?? null;
    normalized.dependencies = normalized.dependencies ?? metadataRecord.dependencies ?? null;
    normalized.path = metadataRecord.path ?? normalized.path ?? null;
    normalized.content = content ?? normalized.content ?? null;
    normalized.storedAt = timestamp;
    normalized.sourcePhase = this.state.currentPhase;
    return StructuredStorySchema.parse(normalized);
  }
  normalizeStoryList(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'string' ? item.trim() : null)).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [value]
      .filter((item) => typeof item === 'string' && item.length > 0)
      .map((item) => item.trim());
  }
  cacheStructuredStory(story) {
    if (!story || typeof story !== 'object') {
      return;
    }
    if (!this.stories || typeof this.stories !== 'object') {
      this.stories = this.createEmptyStories();
    }
    if (!this.stories.records || typeof this.stories.records !== 'object') {
      this.stories.records = {};
    }
    const key = story.id || 'latest';
    this.stories.records[key] = { ...story };
    this.stories.latestId = key;
  }
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
        const aTime = new Date(a.storedAt ?? 0).getTime();
        const bTime = new Date(b.storedAt ?? 0).getTime();
        return bTime - aTime;
      });
    if (candidates.length > 0) {
      const latest = candidates[0];
      return { ...latest };
    }
    const firstRecord = Object.values(records)[0];
    return firstRecord && typeof firstRecord === 'object' ? { ...firstRecord } : null;
  }
  getDeliverable(phase, type) {
    return this.deliverables[phase]?.[type];
  }
  getPhaseDeliverables(phase) {
    return this.deliverables[phase] ? { ...this.deliverables[phase] } : {};
  }
  getAllDeliverables() {
    return Object.fromEntries(
      Object.entries(this.deliverables).map(([phase, value]) => [phase, { ...value }]),
    );
  }
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
  getReviewHistory(limit = null) {
    if (!this.reviewHistory) {
      return [];
    }
    if (typeof limit === 'number' && limit > 0) {
      return this.reviewHistory.slice(-limit);
    }
    return [...this.reviewHistory];
  }
  async updateRequirements(requirements) {
    this.state.requirements = {
      ...this.state.requirements,
      ...requirements,
    };
    await this.save();
  }
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
  async updatePreferences(preferences) {
    this.state.userPreferences = {
      ...this.state.userPreferences,
      ...preferences,
    };
    await this.save();
  }
  async setNextSteps(steps) {
    this.state.nextSteps = steps;
    await this.save();
  }
  getSummary() {
    return {
      projectId: this.state.projectId,
      projectName: this.state.projectName,
      currentPhase: this.state.currentPhase,
      phaseCount: this.state.phaseHistory.length,
      messageCount: this.conversation.length,
      deliverableCount: Object.values(this.deliverables).reduce(
        (count, phaseDeliverables) => count + Object.keys(phaseDeliverables).length,
        0,
      ),
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }
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
  async clear() {
    if (await fs_extra_1.default.pathExists(this.stateDir)) {
      await fs_extra_1.default.remove(this.stateDir);
    }
    this.state = this.createDefaultState();
    this.state.projectId = this.generateProjectId();
    this.state.createdAt = new Date().toISOString();
    this.state.updatedAt = this.state.createdAt;
    this.conversation = [];
    this.deliverables = {};
    this.reviewHistory = [];
    this.stories = this.createEmptyStories();
    await this.initialize();
  }
  async recordLaneDecision(lane, rationale, confidence, userMessage = '', options = {}) {
    if (!this.state.laneHistory) {
      this.state.laneHistory = [];
    }
    const { level, levelScore, levelSignals, levelRationale } = options;
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
  getLaneHistory(limit = null) {
    if (!this.state.laneHistory) {
      return [];
    }
    if (typeof limit === 'number' && limit > 0) {
      return this.state.laneHistory.slice(-limit);
    }
    return [...this.state.laneHistory];
  }
  getCurrentLane() {
    return this.state.currentLane || 'aidesigner';
  }
  async getArtifacts() {
    const docsDir = node_path_1.default.join(this.projectPath, 'docs');
    if (!(await fs_extra_1.default.pathExists(docsDir))) {
      return {
        exists: false,
        artifacts: [],
      };
    }
    const artifacts = [];
    const scanDir = async (dir, relativePath = '') => {
      const entries = await fs_extra_1.default.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = node_path_1.default.join(dir, entry.name);
        const relPath = node_path_1.default.join(relativePath, entry.name);
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
  generateProjectId() {
    return `aidesigner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  ensureIntegrationState() {
    if (!this.state.integrations || typeof this.state.integrations !== 'object') {
      this.state.integrations = {
        drawbridge: {
          ingestions: [],
          lastMode: null,
        },
      };
      return;
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
  async recordDrawbridgeIngestion(ingestion = {}) {
    this.ensureIntegrationState();
    const drawbridge = this.state.integrations.drawbridge;
    const MAX_INGESTIONS = 100;
    const timestamp = ingestion.ingestedAt || new Date().toISOString();
    const mode = ingestion.mode || null;
    const ingestionId =
      ingestion.ingestionId || `ingestion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const packId = ingestion.packId || null;
    const tasks = Array.isArray(ingestion.tasks)
      ? ingestion.tasks.map((taskEntry) => {
          const taskRecord = taskEntry;
          const selectorsRaw = Array.isArray(taskRecord.selectors) ? taskRecord.selectors : [];
          const referencesRaw = Array.isArray(taskRecord.references) ? taskRecord.references : [];
          const selectors = selectorsRaw.filter((value) => typeof value === 'string');
          const references = referencesRaw.filter((value) => typeof value === 'string');
          const normalizedTask = {
            id: typeof taskRecord.id === 'string' ? taskRecord.id : null,
            summary: typeof taskRecord.summary === 'string' ? taskRecord.summary : null,
            status: typeof taskRecord.status === 'string' ? taskRecord.status : null,
            severity: typeof taskRecord.severity === 'string' ? taskRecord.severity : null,
            action: typeof taskRecord.action === 'string' ? taskRecord.action : null,
            lane: typeof taskRecord.lane === 'string' ? taskRecord.lane : null,
            selectors,
            references,
            screenshot: typeof taskRecord.screenshot === 'string' ? taskRecord.screenshot : null,
            markdownExcerpt:
              typeof taskRecord.markdownExcerpt === 'string'
                ? taskRecord.markdownExcerpt
                : typeof taskRecord.markdown === 'string'
                  ? taskRecord.markdown
                  : null,
          };
          return DrawbridgeTaskSchema.parse(normalizedTask);
        })
      : [];
    const withScreenshotsCount = tasks.filter((task) => Boolean(task.screenshot)).length;
    const statsRecord =
      ingestion.stats && typeof ingestion.stats === 'object' ? ingestion.stats : undefined;
    const stats = {
      total: typeof statsRecord?.total === 'number' ? statsRecord.total : tasks.length,
      withScreenshots:
        typeof statsRecord?.withScreenshots === 'number'
          ? statsRecord.withScreenshots
          : withScreenshotsCount,
      withoutScreenshots:
        typeof statsRecord?.withoutScreenshots === 'number'
          ? statsRecord.withoutScreenshots
          : tasks.length - withScreenshotsCount,
    };
    const sourceClone =
      ingestion.source && typeof ingestion.source === 'object' ? { ...ingestion.source } : {};
    const metadataClone =
      ingestion.metadata && typeof ingestion.metadata === 'object' ? { ...ingestion.metadata } : {};
    const docsClone =
      ingestion.docs && typeof ingestion.docs === 'object' ? { ...ingestion.docs } : {};
    const record = DrawbridgeIngestionSchema.parse({
      ingestionId,
      packId,
      mode,
      ingestedAt: timestamp,
      source: sourceClone,
      tasks,
      stats,
      metadata: metadataClone,
      docs: docsClone,
    });
    if (drawbridge.ingestions.length >= MAX_INGESTIONS) {
      drawbridge.ingestions = drawbridge.ingestions.slice(-(MAX_INGESTIONS - 1));
    }
    drawbridge.ingestions.push(record);
    drawbridge.lastMode = mode;
    await this.save();
    return record;
  }
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
  getDrawbridgeReviewQueue(options = {}) {
    const { includeResolved = false } = options;
    const queue = [];
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
      const aTime = new Date(a.ingestedAt ?? 0).getTime();
      const bTime = new Date(b.ingestedAt ?? 0).getTime();
      if (aTime === bTime) {
        return (a.id || '').localeCompare(b.id || '');
      }
      return bTime - aTime;
    });
  }
}
exports.ProjectState = ProjectState;
exports.default = ProjectState;
