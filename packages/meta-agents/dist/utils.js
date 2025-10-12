/* eslint-disable unicorn/prefer-module, unicorn/consistent-function-scoping */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTechnologyStack = exports.summarizeCommands = exports.extractShellCommands = exports.slidingWindow = exports.tokenizeLines = exports.renderMermaidComponentMap = exports.formatTimestamp = exports.ArtifactManager = exports.NodeFileSystem = void 0;
exports.fetchSupabasePublicSchema = fetchSupabasePublicSchema;
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
class NodeFileSystem {
    async ensureDir(target) {
        await fs_extra_1.default.ensureDir(target);
    }
    async writeFile(target, data, encoding = 'utf8') {
        await fs_extra_1.default.writeFile(target, data, { encoding });
    }
    async readFile(target, encoding = 'utf8') {
        return fs_extra_1.default.readFile(target, { encoding });
    }
    async pathExists(target) {
        return fs_extra_1.default.pathExists(target);
    }
    async readdir(target) {
        return fs_extra_1.default.readdir(target);
    }
    async stat(target) {
        return fs_extra_1.default.stat(target);
    }
}
exports.NodeFileSystem = NodeFileSystem;
class ArtifactManager {
    constructor(projectRoot, fileSystem) {
        this.projectRoot = projectRoot;
        this.fileSystem = fileSystem;
        this.artifacts = [];
    }
    get records() {
        return [...this.artifacts];
    }
    async write(relativePath, contents, description) {
        const destination = node_path_1.default.join(this.projectRoot, relativePath);
        await this.fileSystem.ensureDir(node_path_1.default.dirname(destination));
        await this.fileSystem.writeFile(destination, contents, 'utf8');
        const record = { path: relativePath, description };
        this.artifacts.push(record);
        return record;
    }
}
exports.ArtifactManager = ArtifactManager;
const formatTimestamp = (date) => {
    const pad = (value) => value.toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};
exports.formatTimestamp = formatTimestamp;
async function fetchSupabasePublicSchema(client) {
    if (!client) {
        return [];
    }
    const result = await client
        .from('information_schema.columns')
        .select('table_name,column_name,data_type,is_nullable,column_default')
        .eq('table_schema', 'public');
    if (result.error) {
        throw new Error(`Supabase schema query failed: ${result.error.message ?? 'Unknown error'}`);
    }
    const rows = result.data ?? [];
    const grouped = new Map();
    for (const row of rows) {
        const table = grouped.get(row.table_name) ?? {
            name: row.table_name,
            columns: [],
        };
        table.columns.push({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === 'YES',
            defaultValue: row.column_default ?? undefined,
        });
        grouped.set(row.table_name, table);
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
}
const renderMermaidComponentMap = (components) => {
    const lines = ['graph TD'];
    for (const component of components) {
        const label = `${component.name}[${component.type}]`;
        if (component.relations.length === 0) {
            lines.push(`  ${label}`);
            continue;
        }
        for (const relation of component.relations) {
            lines.push(`  ${component.name} --> ${relation}`);
        }
    }
    return lines.join('\n');
};
exports.renderMermaidComponentMap = renderMermaidComponentMap;
const tokenizeLines = (contents) => contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
exports.tokenizeLines = tokenizeLines;
const slidingWindow = (values, size) => {
    const windows = [];
    for (let index = 0; index <= values.length - size; index += 1) {
        windows.push(values.slice(index, index + size));
    }
    return windows;
};
exports.slidingWindow = slidingWindow;
const extractShellCommands = (guideContent) => {
    const commands = [];
    const lines = guideContent.split(/\r?\n/);
    let inCodeBlock = false;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (line.startsWith('$ ')) {
            commands.push(line.slice(2).trim());
            continue;
        }
        if (inCodeBlock && /^(npm|yarn|pnpm|pip|python|node|docker)/.test(line)) {
            commands.push(line);
        }
    }
    return commands;
};
exports.extractShellCommands = extractShellCommands;
const summarizeCommands = (commands) => commands.map((command) => ({ command, status: 'skipped', note: 'Dry-run validation (not executed)' }));
exports.summarizeCommands = summarizeCommands;
const normalizeTechnologyStack = (stack) => stack.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
exports.normalizeTechnologyStack = normalizeTechnologyStack;
