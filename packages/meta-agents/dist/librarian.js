/* eslint-disable unicorn/prefer-module, unicorn/prefer-single-call */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibrarianMetaAgent = void 0;
const node_path_1 = __importDefault(require("node:path"));
const base_1 = require("./base");
const utils_1 = require("./utils");
class LibrarianMetaAgent extends base_1.BaseMetaAgent {
    constructor(input = {}, options) {
        super('librarian', 'Librarian Documentation Steward', 'Synchronizes project documentation with the current codebase and database schema.', input, options);
    }
    async listFiles(relativeDir) {
        const absoluteDir = node_path_1.default.join(this.projectRoot, relativeDir);
        try {
            const entries = await this.options.fileSystem?.readdir(absoluteDir);
            if (!entries) {
                return [];
            }
            const files = [];
            for (const entry of entries) {
                const absolutePath = node_path_1.default.join(absoluteDir, entry);
                const stats = await this.options.fileSystem?.stat(absolutePath);
                if (!stats) {
                    continue;
                }
                if (stats.isDirectory()) {
                    const nested = await this.listFiles(node_path_1.default.relative(this.projectRoot, absolutePath));
                    files.push(...nested);
                }
                else {
                    files.push(node_path_1.default.relative(this.projectRoot, absolutePath));
                }
            }
            return files;
        }
        catch (error) {
            this.logger(`⚠️  Unable to traverse ${relativeDir}: ${error.message}`);
            return [];
        }
    }
    async deriveArchitecture(scopePaths) {
        const components = [];
        for (const scope of scopePaths) {
            const files = await this.listFiles(scope);
            if (files.length === 0) {
                continue;
            }
            components.push({
                name: scope.replaceAll('/', '_'),
                type: 'Module',
                relations: files
                    .filter((file) => file.includes('/'))
                    .slice(0, 5)
                    .map((file) => file.split('/')[0].replaceAll(/[^a-zA-Z0-9]/g, '_')),
            });
        }
        return components;
    }
    async generateArchitectureDoc(scopePaths) {
        const components = await this.deriveArchitecture(scopePaths);
        const mermaid = (0, utils_1.renderMermaidComponentMap)(components.map((component) => ({
            name: component.name,
            type: component.type,
            relations: component.relations,
        })));
        const lines = [
            '# System Architecture',
            '',
            '## Component Map',
            '',
            '```mermaid',
            mermaid,
            '```',
            '',
            '## Components',
            '',
        ];
        for (const component of components) {
            lines.push(`### ${component.name}`, '', `Type: ${component.type}`, 'Responsibilities:');
            lines.push('- Maintain module boundaries');
            if (component.relations.length > 0) {
                lines.push('', 'Relations:');
                for (const relation of component.relations) {
                    lines.push(`- ${component.name} → ${relation}`);
                }
            }
            lines.push('');
        }
        if (components.length === 0) {
            lines.push('No components detected in configured scopes.');
        }
        return lines.join('\n');
    }
    parseEndpointLine(line) {
        const httpMatch = line.match(/(get|post|put|delete|patch|options|head)\(['"`](.*?)['"`]/i);
        if (httpMatch) {
            return {
                method: httpMatch[1].toUpperCase(),
                path: httpMatch[2],
                summary: 'Detected from routing declaration',
            };
        }
        const fastApiMatch = line.match(/@app\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/i);
        if (fastApiMatch) {
            return {
                method: fastApiMatch[1].toUpperCase(),
                path: fastApiMatch[2],
                summary: 'FastAPI endpoint',
            };
        }
        return;
    }
    async collectApiEndpoints(apiFiles) {
        const endpoints = [];
        for (const file of apiFiles) {
            const absolutePath = node_path_1.default.join(this.projectRoot, file);
            try {
                const content = await this.options.fileSystem?.readFile(absolutePath, 'utf8');
                if (!content) {
                    continue;
                }
                const lines = content.split(/\r?\n/);
                for (const line of lines) {
                    const endpoint = this.parseEndpointLine(line.trim());
                    if (endpoint) {
                        endpoints.push(endpoint);
                    }
                }
            }
            catch (error) {
                this.logger(`⚠️  Failed to read ${file}: ${error.message}`);
            }
        }
        return endpoints;
    }
    renderApiReference(endpoints) {
        const lines = ['# API Reference', '', '## Endpoints', ''];
        if (endpoints.length === 0) {
            lines.push('_No API endpoints detected in supplied scope._');
            return lines.join('\n');
        }
        for (const endpoint of endpoints) {
            lines.push(`### ${endpoint.method} ${endpoint.path}`, '', endpoint.summary, '');
            lines.push('Request:', '', '- Body: _Describe body schema_', '', 'Response:', '', '- Status: 200 OK', '- Body: _Describe response_');
            lines.push('');
        }
        return lines.join('\n');
    }
    renderDatabaseSchema(tables) {
        const lines = ['# Database Schema', ''];
        if (tables.length === 0) {
            lines.push('No Supabase schema information available.');
            return lines.join('\n');
        }
        for (const table of tables) {
            lines.push(`## ${table.name}`, '', '| Column | Type | Nullable | Default |', '| --- | --- | --- | --- |');
            for (const column of table.columns) {
                lines.push(`| ${column.name} | ${column.type} | ${column.nullable ? 'Yes' : 'No'} | ${column.defaultValue ?? ''} |`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    renderSetupValidation(commands) {
        const checks = (0, utils_1.summarizeCommands)(commands);
        const lines = ['# Setup Validation Report', '', '## Commands'];
        if (checks.length === 0) {
            lines.push('', 'No commands discovered in development guide.');
            return lines.join('\n');
        }
        for (const check of checks) {
            lines.push('', `- \`${check.command}\` — ${check.status.toUpperCase()} (${check.note})`);
        }
        return lines.join('\n');
    }
    async execute() {
        const scopePaths = this.input.scopePaths ?? ['src'];
        const architectureDoc = await this.generateArchitectureDoc(scopePaths);
        await this.runStage('architecture', 'Generate architecture documentation', async () => {
            const artifactPath = this.createArtifactPath('docs', 'architecture', 'md');
            const artifact = await this.artifactManager.write(artifactPath, architectureDoc, 'High-level architecture map generated by Librarian agent');
            return {
                summary: 'Architecture overview refreshed.',
                artifacts: [artifact],
            };
        });
        const apiFiles = this.input.apiFiles ?? scopePaths.map((scope) => node_path_1.default.join(scope, 'index.ts'));
        const endpoints = await this.collectApiEndpoints(apiFiles);
        await this.runStage('api', 'Generate API reference', async () => {
            const artifactPath = this.createArtifactPath('docs', 'api-reference', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderApiReference(endpoints), 'Generated API endpoint documentation');
            return {
                summary: `Documented ${endpoints.length} API endpoints.`,
                artifacts: [artifact],
            };
        });
        const tables = await (0, utils_1.fetchSupabasePublicSchema)(this.options.supabaseClient);
        await this.runStage('database', 'Export Supabase schema', async () => {
            const artifactPath = this.createArtifactPath('docs', 'database-schema', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderDatabaseSchema(tables), 'Database schema exported from Supabase');
            return {
                summary: tables.length > 0 ? `Documented ${tables.length} tables.` : 'No tables returned by Supabase.',
                artifacts: [artifact],
            };
        });
        const developmentGuidePath = this.input.developmentGuidePath ?? 'DEVELOPMENT_GUIDE.md';
        let commands = [];
        try {
            const fullPath = node_path_1.default.join(this.projectRoot, developmentGuidePath);
            const content = await this.options.fileSystem?.readFile(fullPath, 'utf8');
            if (content) {
                const tokens = (0, utils_1.tokenizeLines)(content).join('\n');
                commands = (0, utils_1.extractShellCommands)(tokens);
            }
        }
        catch (error) {
            this.logger(`⚠️  Unable to analyze development guide: ${error.message}`);
        }
        await this.runStage('setup-validation', 'Validate setup guide commands', async () => {
            const artifactPath = this.createArtifactPath('docs', 'setup-validation', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderSetupValidation(commands), 'Dry-run validation of setup commands');
            return {
                summary: `Analyzed ${commands.length} setup commands.`,
                artifacts: [artifact],
            };
        });
        return 'Documentation refreshed by Librarian meta-agent.';
    }
}
exports.LibrarianMetaAgent = LibrarianMetaAgent;
