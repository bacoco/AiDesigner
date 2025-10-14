"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMetaAgent = void 0;
const node_path_1 = __importDefault(require("node:path"));
const utils_1 = require("./utils");
const utils_2 = require("./utils");
class BaseMetaAgent {
    constructor(id, title, description, input, options = {}) {
        this.input = input;
        this.options = options;
        this.stages = [];
        this.stageOrder = [];
        this.runStamp = '';
        this.artifactCounter = 0;
        this.id = id;
        this.title = title;
        this.description = description;
        this.projectRoot = options.projectRoot ?? process.cwd();
        this.fileSystem = options.fileSystem ?? new utils_2.NodeFileSystem();
        this.artifactManager = new utils_1.ArtifactManager(this.projectRoot, this.fileSystem);
        this.logger = options.logger ?? (() => undefined);
        this.clock = options.clock ?? (() => new Date());
    }
    registerStage(id, title) {
        if (this.stageOrder.includes(id)) {
            return;
        }
        const stage = { id, stage: id, title, status: 'pending', artifacts: [] };
        this.stageOrder.push(id);
        this.stages.push(stage);
    }
    updateStageStatus(id, status, summary) {
        const stage = this.stages.find((entry) => entry.id === id);
        if (!stage) {
            throw new Error(`Unknown stage: ${id}`);
        }
        stage.status = status;
        if (summary) {
            stage.summary = summary;
        }
        return stage;
    }
    async runStage(id, title, handler) {
        this.registerStage(id, title);
        this.updateStageStatus(id, 'running');
        this.logger(`▶️  ${this.title}: ${title}`);
        const result = await handler();
        const stage = this.updateStageStatus(id, 'complete', result.summary);
        if (result.artifacts) {
            stage.artifacts.push(...result.artifacts);
        }
        this.logger(`✅ ${this.title}: ${title}`);
    }
    createArtifactPath(baseDirectory, prefix, extension) {
        const sequence = `${this.artifactCounter + 1}`.padStart(2, '0');
        const fileName = `${prefix}-${this.runStamp}-${sequence}.${extension}`;
        this.artifactCounter += 1;
        return node_path_1.default.posix.join(baseDirectory, fileName);
    }
    async run() {
        this.startedAt = this.clock();
        this.runStamp = (0, utils_1.formatTimestamp)(this.startedAt);
        const summary = await this.execute();
        this.completedAt = this.clock();
        const artifacts = this.artifactManager.records;
        const result = {
            id: this.id,
            title: this.title,
            description: this.description,
            summary,
            startedAt: this.startedAt.toISOString(),
            completedAt: this.completedAt.toISOString(),
            artifacts,
            stages: this.stageOrder.map((stageId) => {
                const stage = this.stages.find((entry) => entry.id === stageId);
                if (!stage) {
                    throw new Error(`Stage not registered: ${stageId}`);
                }
                return { ...stage, artifacts: [...stage.artifacts] };
            }),
        };
        return result;
    }
}
exports.BaseMetaAgent = BaseMetaAgent;
