import fs from 'fs-extra';
import path from 'node:path';
import { z } from 'zod';

export type Phase = string;
export type Lane = string;

type JsonRecord = Record<string, unknown>;

export interface PhaseTransition {
  from: Phase;
  to: Phase;
  timestamp: string;
  context: JsonRecord;
}

export interface Message extends JsonRecord {
  role: string;
  content: string;
  timestamp: string;
  phase: Phase;
}

export interface StructuredStory extends JsonRecord {
  id: string | null;
  title?: string | null;
  persona?: string | null;
  userRole?: string | null;
  action?: string | null;
  benefit?: string | null;
  summary?: string | null;
  description?: string | null;
  acceptanceCriteria?: string[];
  definitionOfDone?: string[];
  technicalDetails?: string | null;
  implementationNotes?: string | null;
  testingStrategy?: string | null;
  dependencies?: unknown;
  epicNumber?: number | string | null;
  storyNumber?: number | string | null;
  path?: string | null;
  content?: unknown;
  storedAt?: string | null;
  sourcePhase?: Phase | null;
}

export interface ReviewRecord extends JsonRecord {
  checkpoint?: string;
  timestamp: string;
}

export interface LaneDecision extends JsonRecord {
  lane: Lane;
  rationale: string;
  confidence: number;
  userMessage: string;
  timestamp: string;
  phase: Phase;
  level?: string;
  levelScore?: number;
  levelSignals?: unknown;
  levelRationale?: string;
}

export interface StoriesState {
  records: Record<string, StructuredStory>;
  latestId: string | null;
}

export interface DrawbridgeTask extends JsonRecord {
  id: string | null;
  summary: string | null;
  status: string | null;
  severity: string | null;
  action: string | null;
  lane: string | null;
  selectors: string[];
  references: string[];
  screenshot: string | null;
  markdownExcerpt: string | null;
}

export interface DrawbridgeStats extends JsonRecord {
  total: number;
  withScreenshots: number;
  withoutScreenshots: number;
}

export interface DrawbridgeIngestionRecord extends JsonRecord {
  ingestionId: string | null;
  packId: string | null;
  mode: string | null;
  ingestedAt: string;
  source: JsonRecord;
  tasks: DrawbridgeTask[];
  stats: DrawbridgeStats;
  metadata: JsonRecord;
  docs: JsonRecord;
}

export interface DrawbridgeReviewQueueItem {
  packId: string | null;
  ingestionId: string | null;
  mode: string | null;
  ingestedAt: string | null;
  id: string | null;
  summary: string | null;
  selectors: string[];
  screenshot: string | null;
  status: string | null;
  severity: string | null;
  action: string | null;
  lane: string | null;
  markdownExcerpt: string | null;
}

interface DrawbridgeIntegrationState extends JsonRecord {
  ingestions: DrawbridgeIngestionRecord[];
  lastMode: string | null;
}

interface IntegrationsState extends JsonRecord {
  drawbridge: DrawbridgeIntegrationState;
}

export interface ProjectStateData {
  projectId: string | null;
  projectName: string | null;
  currentPhase: Phase;
  currentLane: Lane | null;
  phaseHistory: PhaseTransition[];
  laneHistory: LaneDecision[];
  requirements: JsonRecord;
  decisions: JsonRecord;
  userPreferences: JsonRecord;
  nextSteps: string;
  createdAt: string | null;
  updatedAt: string | null;
  integrations: IntegrationsState;
}

export interface ProjectSummary {
  projectId: string | null;
  projectName: string | null;
  currentPhase: Phase;
  phaseCount: number;
  messageCount: number;
  deliverableCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LLMExport {
  currentPhase: Phase;
  requirements: JsonRecord;
  decisions: JsonRecord;
  userPreferences: JsonRecord;
  nextSteps: string;
  recentConversation: Message[];
  deliverables: Deliverables;
  reviewHistory: ReviewRecord[];
}

export interface ArtifactsSummary {
  exists: boolean;
  artifacts: string[];
  count?: number;
}

export interface LaneDecisionOptions {
  level?: string;
  levelScore?: number;
  levelSignals?: unknown;
  levelRationale?: string;
}

export interface DrawbridgeIngestionInput extends JsonRecord {
  ingestionId?: string | null;
  packId?: string | null;
  mode?: string | null;
  ingestedAt?: string;
  source?: JsonRecord;
  tasks?: Array<JsonRecord>;
  stats?: JsonRecord;
  metadata?: JsonRecord;
  docs?: JsonRecord;
}

const MessageSchema = z
  .object({
    role: z.string(),
    content: z.string(),
    timestamp: z.string(),
    phase: z.string(),
  })
  .catchall(z.unknown());

const StructuredStorySchema: z.ZodType<StructuredStory> = z
  .object({
    id: z.string().nullable(),
    title: z.string().nullable().optional(),
    persona: z.string().nullable().optional(),
    userRole: z.string().nullable().optional(),
    action: z.string().nullable().optional(),
    benefit: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    definitionOfDone: z.array(z.string()).optional(),
    technicalDetails: z.string().nullable().optional(),
    implementationNotes: z.string().nullable().optional(),
    testingStrategy: z.string().nullable().optional(),
    dependencies: z.unknown().optional(),
    epicNumber: z.union([z.number(), z.string()]).nullable().optional(),
    storyNumber: z.union([z.number(), z.string()]).nullable().optional(),
    path: z.string().nullable().optional(),
    content: z.unknown().optional(),
    storedAt: z.string().nullable().optional(),
    sourcePhase: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

const DeliverableSchema = z
  .object({
    content: z.unknown(),
    timestamp: z.string(),
    structured: StructuredStorySchema.nullable().optional(),
    storyId: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export type Deliverable = z.infer<typeof DeliverableSchema>;
export type DeliverableCollection = Record<string, Deliverable>;
export type Deliverables = Record<Phase, DeliverableCollection>;

const DeliverablesSchema: z.ZodType<Deliverables> = z.record(z.record(DeliverableSchema));

const ReviewRecordSchema: z.ZodType<ReviewRecord> = z
  .object({
    checkpoint: z.string().optional(),
    timestamp: z.string(),
  })
  .catchall(z.unknown());

const LaneDecisionSchema: z.ZodType<LaneDecision> = z
  .object({
    lane: z.string(),
    rationale: z.string(),
    confidence: z.number(),
    userMessage: z.string(),
    timestamp: z.string(),
    phase: z.string(),
    level: z.string().optional(),
    levelScore: z.number().optional(),
    levelSignals: z.unknown().optional(),
    levelRationale: z.string().optional(),
  })
  .catchall(z.unknown());

const PhaseTransitionSchema: z.ZodType<PhaseTransition> = z.object({
  from: z.string(),
  to: z.string(),
  timestamp: z.string(),
  context: z.record(z.unknown()),
});

const DrawbridgeTaskSchema: z.ZodType<DrawbridgeTask> = z
  .object({
    id: z.string().nullable(),
    summary: z.string().nullable(),
    status: z.string().nullable(),
    severity: z.string().nullable(),
    action: z.string().nullable(),
    lane: z.string().nullable(),
    selectors: z.array(z.string()),
    references: z.array(z.string()),
    screenshot: z.string().nullable(),
    markdownExcerpt: z.string().nullable(),
  })
  .catchall(z.unknown());

const DrawbridgeStatsSchema: z.ZodType<DrawbridgeStats> = z
  .object({
    total: z.number(),
    withScreenshots: z.number(),
    withoutScreenshots: z.number(),
  })
  .catchall(z.unknown());

const DrawbridgeIngestionSchema: z.ZodType<DrawbridgeIngestionRecord> = z
  .object({
    ingestionId: z.string().nullable(),
    packId: z.string().nullable(),
    mode: z.string().nullable(),
    ingestedAt: z.string(),
    source: z.record(z.unknown()),
    tasks: z.array(DrawbridgeTaskSchema),
    stats: DrawbridgeStatsSchema,
    metadata: z.record(z.unknown()),
    docs: z.record(z.unknown()),
  })
  .catchall(z.unknown());

const DrawbridgeIntegrationSchema: z.ZodType<DrawbridgeIntegrationState> = z
  .object({
    ingestions: z.array(DrawbridgeIngestionSchema),
    lastMode: z.string().nullable(),
  })
  .catchall(z.unknown());

const IntegrationsSchema: z.ZodType<IntegrationsState> = z
  .object({
    drawbridge: DrawbridgeIntegrationSchema,
  })
  .catchall(z.unknown());

const StoriesSchema: z.ZodType<StoriesState> = z.object({
  records: z.record(StructuredStorySchema),
  latestId: z.string().nullable(),
});

const ProjectStateDataSchema: z.ZodType<ProjectStateData> = z.object({
  projectId: z.string().nullable(),
  projectName: z.string().nullable(),
  currentPhase: z.string(),
  currentLane: z.string().nullable(),
  phaseHistory: z.array(PhaseTransitionSchema),
  laneHistory: z.array(LaneDecisionSchema),
  requirements: z.record(z.unknown()),
  decisions: z.record(z.unknown()),
  userPreferences: z.record(z.unknown()),
  nextSteps: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  integrations: IntegrationsSchema,
});

const ConversationSchema = z.array(MessageSchema);
const ReviewHistorySchema = z.array(ReviewRecordSchema);

export class ProjectState {
  private readonly projectPath: string;
  private readonly stateDir: string;
  private readonly stateFile: string;
  private readonly conversationFile: string;
  private readonly deliverablesFile: string;
  private readonly reviewsFile: string;
  private readonly storiesFile: string;

  private state: ProjectStateData;
  private conversation: Message[];
  private deliverables: Deliverables;
  private reviewHistory: ReviewRecord[];
  private stories: StoriesState;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.stateDir = path.join(projectPath, '.aidesigner');
    this.stateFile = path.join(this.stateDir, 'state.json');
    this.conversationFile = path.join(this.stateDir, 'conversation.json');
    this.deliverablesFile = path.join(this.stateDir, 'deliverables.json');
    this.reviewsFile = path.join(this.stateDir, 'reviews.json');
    this.storiesFile = path.join(this.stateDir, 'stories.json');

    this.state = this.createDefaultState();
    this.conversation = [];
    this.deliverables = {};
    this.reviewHistory = [];
    this.stories = this.createEmptyStories();
  }

  private createDefaultState(): ProjectStateData {
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

  private createEmptyStories(): StoriesState {
    return {
      records: {},
      latestId: null,
    };
  }

  async initialize(): Promise<ProjectStateData> {
    await fs.ensureDir(this.stateDir);

    if (await fs.pathExists(this.stateFile)) {
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

  async load(): Promise<void> {
    const stateExists = await fs.pathExists(this.stateFile);
    const conversationExists = await fs.pathExists(this.conversationFile);
    const deliverablesExists = await fs.pathExists(this.deliverablesFile);
    const reviewsExists = await fs.pathExists(this.reviewsFile);
    const storiesExists = await fs.pathExists(this.storiesFile);

    const stateRaw = stateExists ? ((await fs.readJson(this.stateFile)) as unknown) : undefined;
    const conversationRaw = conversationExists
      ? ((await fs.readJson(this.conversationFile)) as unknown)
      : undefined;
    const deliverablesRaw = deliverablesExists
      ? ((await fs.readJson(this.deliverablesFile)) as unknown)
      : undefined;
    const reviewsRaw = reviewsExists
      ? ((await fs.readJson(this.reviewsFile)) as unknown)
      : undefined;
    const storiesRaw = storiesExists
      ? ((await fs.readJson(this.storiesFile)) as unknown)
      : undefined;

    if (stateRaw) {
      const parsed = ProjectStateDataSchema.safeParse({
        ...this.createDefaultState(),
        ...(stateRaw as JsonRecord),
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

  private parseStories(raw: unknown): StoriesState {
    if (!raw) {
      return this.createEmptyStories();
    }

    if (StoriesSchema.safeParse(raw).success) {
      return StoriesSchema.parse(raw);
    }

    if (typeof raw === 'object' && raw) {
      const candidate = raw as JsonRecord;
      if ('records' in candidate && typeof candidate.records === 'object' && candidate.records) {
        const parsed = StoriesSchema.safeParse({
          records: candidate.records,
          latestId: candidate.latestId ?? null,
        });
        if (parsed.success) {
          return parsed.data;
        }
      }

      const fallbackRecords: Record<string, StructuredStory> = {};
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

  async save(): Promise<void> {
    this.ensureIntegrationState();
    this.state.updatedAt = new Date().toISOString();

    await Promise.all([
      fs.writeJson(this.stateFile, this.state, { spaces: 2 }),
      fs.writeJson(this.conversationFile, this.conversation, { spaces: 2 }),
      fs.writeJson(this.deliverablesFile, this.deliverables, { spaces: 2 }),
      fs.writeJson(this.reviewsFile, this.reviewHistory, { spaces: 2 }),
      fs.writeJson(this.storiesFile, this.stories, { spaces: 2 }),
    ]);
  }

  getState(): ProjectStateData {
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

  async updateState(updates: Partial<ProjectStateData>): Promise<void> {
    this.state = {
      ...this.state,
      ...updates,
    };
    await this.save();
  }

  async transitionPhase(newPhase: Phase, context: JsonRecord = {}): Promise<PhaseTransition> {
    const transition: PhaseTransition = {
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

  async addMessage(role: string, content: string, metadata: JsonRecord = {}): Promise<Message> {
    const message: Message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
      ...metadata,
    } as Message;

    this.conversation.push(message);
    await this.save();

    return message;
  }

  getConversation(limit: number | null = null): Message[] {
    if (typeof limit === 'number' && limit > 0) {
      return this.conversation.slice(-limit);
    }

    return [...this.conversation];
  }

  getPhaseConversation(phase: Phase): Message[] {
    return this.conversation.filter((msg) => msg.phase === phase);
  }

  async storeDeliverable(type: string, content: unknown, metadata: JsonRecord = {}): Promise<void> {
    if (!this.deliverables[this.state.currentPhase]) {
      this.deliverables[this.state.currentPhase] = {};
    }

    const timestamp = new Date().toISOString();

    const record: Deliverable = {
      content,
      timestamp,
      ...metadata,
    } as Deliverable;

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

  private normalizeStructuredStory(
    metadata: JsonRecord = {},
    content: unknown = '',
    timestamp: string = new Date().toISOString(),
  ): StructuredStory | null {
    const metadataRecord = metadata as JsonRecord;
    const candidateSources = [
      metadataRecord.structuredStory,
      metadataRecord.structured,
      metadataRecord.story,
      metadataRecord.fields,
    ];

    let structured: JsonRecord | StructuredStory | undefined = candidateSources.find(
      (value) => value && typeof value === 'object',
    ) as StructuredStory | JsonRecord | undefined;

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
          title: (title as string | null | undefined) ?? null,
          persona: (persona as string | null | undefined) ?? null,
          userRole: (userRole as string | null | undefined) ?? null,
          action: (action as string | null | undefined) ?? null,
          benefit: (benefit as string | null | undefined) ?? null,
          summary: (summary as string | null | undefined) ?? null,
          description: (description as string | null | undefined) ?? null,
          acceptanceCriteria: Array.isArray(acceptanceCriteria)
            ? (acceptanceCriteria as string[])
            : undefined,
          definitionOfDone: Array.isArray(definitionOfDone)
            ? (definitionOfDone as string[])
            : undefined,
          technicalDetails: (technicalDetails as string | null | undefined) ?? null,
          implementationNotes: (implementationNotes as string | null | undefined) ?? null,
          testingStrategy: (testingStrategy as string | null | undefined) ?? null,
          dependencies,
          epicNumber: (epicNumber as number | string | null | undefined) ?? null,
          storyNumber: (storyNumber as number | string | null | undefined) ?? null,
        } as StructuredStory;
      }
    }

    if (!structured || typeof structured !== 'object') {
      return null;
    }

    const normalized: StructuredStory = { ...(structured as StructuredStory) };

    const structuredRecord = structured as JsonRecord;
    const coerceIdentifier = (value: unknown): string | number | null => {
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
      coerceIdentifier(metadataRecord.storyNumber) ??
      coerceIdentifier(normalized.storyNumber);

    const resolvedId =
      (metadataRecord.storyId as string | null | undefined) ||
      (metadataRecord.storyKey as string | null | undefined) ||
      (normalized.id as string | null | undefined) ||
      (typeof epicNumber !== 'undefined' && epicNumber !== null && storyNumber !== null
        ? `${epicNumber}.${storyNumber}`
        : (structuredRecord.slug as string | undefined) || null);

    if (epicNumber != null) {
      normalized.epicNumber = epicNumber;
    }

    if (storyNumber != null) {
      normalized.storyNumber = storyNumber;
    }

    normalized.id = resolvedId ?? normalized.id ?? 'latest';
    normalized.title = normalized.title ?? (metadataRecord.title as string | null | undefined) ?? null;
    normalized.persona =
      normalized.persona ?? (metadataRecord.persona as string | null | undefined) ?? null;
    normalized.userRole =
      normalized.userRole ?? (metadataRecord.userRole as string | null | undefined) ?? null;
    normalized.action = normalized.action ?? (metadataRecord.action as string | null | undefined) ?? null;
    normalized.benefit =
      normalized.benefit ?? (metadataRecord.benefit as string | null | undefined) ?? null;
    normalized.summary =
      normalized.summary ?? (metadataRecord.summary as string | null | undefined) ?? null;
    normalized.description =
      normalized.description ?? (metadataRecord.description as string | null | undefined) ?? null;
    normalized.acceptanceCriteria = this.normalizeStoryList(
      normalized.acceptanceCriteria ?? metadataRecord.acceptanceCriteria,
    );
    normalized.definitionOfDone = this.normalizeStoryList(
      normalized.definitionOfDone ?? metadataRecord.definitionOfDone,
    );
    normalized.technicalDetails =
      normalized.technicalDetails ??
        (metadataRecord.technicalDetails as string | null | undefined) ??
        null;
    normalized.implementationNotes =
      normalized.implementationNotes ??
        (metadataRecord.implementationNotes as string | null | undefined) ??
        null;
    normalized.testingStrategy =
      normalized.testingStrategy ?? (metadataRecord.testingStrategy as string | null | undefined) ?? null;
    normalized.dependencies = normalized.dependencies ?? metadataRecord.dependencies ?? null;
    normalized.path = (metadataRecord.path as string | null | undefined) ?? normalized.path ?? null;
    normalized.content = content ?? normalized.content ?? null;
    normalized.storedAt = timestamp;
    normalized.sourcePhase = this.state.currentPhase;

    return StructuredStorySchema.parse(normalized);
  }

  private normalizeStoryList(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : null))
        .filter((item): item is string => Boolean(item));
    }

    if (typeof value === 'string') {
      return value
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [value]
      .filter((item): item is string => typeof item === 'string' && item.length > 0)
      .map((item) => item.trim());
  }

  private cacheStructuredStory(story?: StructuredStory | null): void {
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

  getStory(storyId: string | null = null): StructuredStory | null {
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

  getDeliverable(phase: Phase, type: string): Deliverable | undefined {
    return this.deliverables[phase]?.[type];
  }

  getPhaseDeliverables(phase: Phase): DeliverableCollection {
    return this.deliverables[phase] ? { ...this.deliverables[phase] } : {};
  }

  getAllDeliverables(): Deliverables {
    return Object.fromEntries(
      Object.entries(this.deliverables).map(([phase, value]) => [phase, { ...value }]),
    );
  }

  async recordReviewOutcome(checkpoint: string, details: JsonRecord = {}): Promise<ReviewRecord> {
    if (!this.reviewHistory) {
      this.reviewHistory = [];
    }

    const record: ReviewRecord = {
      checkpoint,
      ...details,
      timestamp: new Date().toISOString(),
    } as ReviewRecord;

    this.reviewHistory.push(record);
    await this.save();

    return record;
  }

  getReviewHistory(limit: number | null = null): ReviewRecord[] {
    if (!this.reviewHistory) {
      return [];
    }

    if (typeof limit === 'number' && limit > 0) {
      return this.reviewHistory.slice(-limit);
    }

    return [...this.reviewHistory];
  }

  async updateRequirements(requirements: JsonRecord): Promise<void> {
    this.state.requirements = {
      ...this.state.requirements,
      ...requirements,
    };
    await this.save();
  }

  async recordDecision(key: string, value: unknown, rationale = ''): Promise<void> {
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

  async updatePreferences(preferences: JsonRecord): Promise<void> {
    this.state.userPreferences = {
      ...this.state.userPreferences,
      ...preferences,
    };
    await this.save();
  }

  async setNextSteps(steps: string): Promise<void> {
    this.state.nextSteps = steps;
    await this.save();
  }

  getSummary(): ProjectSummary {
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

  exportForLLM(): LLMExport {
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

  async clear(): Promise<void> {
    if (await fs.pathExists(this.stateDir)) {
      await fs.remove(this.stateDir);
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

  async recordLaneDecision(
    lane: Lane,
    rationale: string,
    confidence: number,
    userMessage = '',
    options: LaneDecisionOptions = {},
  ): Promise<LaneDecision> {
    if (!this.state.laneHistory) {
      this.state.laneHistory = [];
    }

    const { level, levelScore, levelSignals, levelRationale } = options;
    const decision: LaneDecision = {
      lane,
      rationale,
      confidence,
      userMessage,
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
    };

    if (typeof level !== 'undefined') {
      decision.level = level;
    }
    if (typeof levelScore !== 'undefined') {
      decision.levelScore = levelScore;
    }
    if (typeof levelSignals !== 'undefined') {
      decision.levelSignals = levelSignals;
    }
    if (typeof levelRationale !== 'undefined') {
      decision.levelRationale = levelRationale;
    }

    this.state.laneHistory.push(decision);
    this.state.currentLane = lane;
    await this.save();

    return decision;
  }

  getLaneHistory(limit: number | null = null): LaneDecision[] {
    if (!this.state.laneHistory) {
      return [];
    }

    if (typeof limit === 'number' && limit > 0) {
      return this.state.laneHistory.slice(-limit);
    }

    return [...this.state.laneHistory];
  }

  getCurrentLane(): Lane {
    return this.state.currentLane || 'aidesigner';
  }

  async getArtifacts(): Promise<ArtifactsSummary> {
    const docsDir = path.join(this.projectPath, 'docs');

    if (!(await fs.pathExists(docsDir))) {
      return {
        exists: false,
        artifacts: [],
      };
    }

    const artifacts: string[] = [];
    const scanDir = async (dir: string, relativePath = ''): Promise<void> => {
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

  generateProjectId(): string {
    return `aidesigner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private ensureIntegrationState(): void {
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

  async recordDrawbridgeIngestion(
    ingestion: DrawbridgeIngestionInput = {},
  ): Promise<DrawbridgeIngestionRecord> {
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
          const taskRecord = taskEntry as JsonRecord;
          const selectorsRaw = Array.isArray(taskRecord.selectors)
            ? (taskRecord.selectors as unknown[])
            : [];
          const referencesRaw = Array.isArray(taskRecord.references)
            ? (taskRecord.references as unknown[])
            : [];

          const selectors = selectorsRaw.filter(
            (value): value is string => typeof value === 'string',
          );
          const references = referencesRaw.filter(
            (value): value is string => typeof value === 'string',
          );

          const normalizedTask: DrawbridgeTask = {
            id: typeof taskRecord.id === 'string' ? (taskRecord.id as string) : null,
            summary: typeof taskRecord.summary === 'string' ? (taskRecord.summary as string) : null,
            status: typeof taskRecord.status === 'string' ? (taskRecord.status as string) : null,
            severity: typeof taskRecord.severity === 'string' ? (taskRecord.severity as string) : null,
            action: typeof taskRecord.action === 'string' ? (taskRecord.action as string) : null,
            lane: typeof taskRecord.lane === 'string' ? (taskRecord.lane as string) : null,
            selectors,
            references,
            screenshot:
              typeof taskRecord.screenshot === 'string' ? (taskRecord.screenshot as string) : null,
            markdownExcerpt:
              typeof taskRecord.markdownExcerpt === 'string'
                ? (taskRecord.markdownExcerpt as string)
                : typeof taskRecord.markdown === 'string'
                ? (taskRecord.markdown as string)
                : null,
          };

          return DrawbridgeTaskSchema.parse(normalizedTask);
        })
      : [];

    const withScreenshotsCount = tasks.filter((task) => Boolean(task.screenshot)).length;
    const statsRecord = ingestion.stats && typeof ingestion.stats === 'object'
      ? (ingestion.stats as JsonRecord)
      : undefined;
    const stats: DrawbridgeStats = {
      total:
        typeof statsRecord?.total === 'number'
          ? (statsRecord.total as number)
          : tasks.length,
      withScreenshots:
        typeof statsRecord?.withScreenshots === 'number'
          ? (statsRecord.withScreenshots as number)
          : withScreenshotsCount,
      withoutScreenshots:
        typeof statsRecord?.withoutScreenshots === 'number'
          ? (statsRecord.withoutScreenshots as number)
          : tasks.length - withScreenshotsCount,
    };

    const sourceClone =
      ingestion.source && typeof ingestion.source === 'object'
        ? { ...(ingestion.source as JsonRecord) }
        : {};
    const metadataClone =
      ingestion.metadata && typeof ingestion.metadata === 'object'
        ? { ...(ingestion.metadata as JsonRecord) }
        : {};
    const docsClone =
      ingestion.docs && typeof ingestion.docs === 'object'
        ? { ...(ingestion.docs as JsonRecord) }
        : {};

    const record: DrawbridgeIngestionRecord = DrawbridgeIngestionSchema.parse({
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

  getDrawbridgeIngestions(): DrawbridgeIngestionRecord[] {
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

  getDrawbridgeReviewQueue(options: { includeResolved?: boolean } = {}): DrawbridgeReviewQueueItem[] {
    const { includeResolved = false } = options;
    const queue: DrawbridgeReviewQueueItem[] = [];
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

export default ProjectState;
