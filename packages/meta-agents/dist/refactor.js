"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorMetaAgent = void 0;
const node_path_1 = __importDefault(require("node:path"));
const base_1 = require("./base");
const utils_1 = require("./utils");
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py'];
class RefactorMetaAgent extends base_1.BaseMetaAgent {
    constructor(input, options) {
        super('refactor', 'Refactor Technical Debt Inspector', 'Identifies duplication, complexity hot spots, and dependency risks.', input, options);
    }
    async listFiles(relativeDir) {
        const baseDir = node_path_1.default.join(this.projectRoot, relativeDir);
        try {
            const entries = await this.fileSystem.readdir(baseDir);
            const files = [];
            for (const entry of entries) {
                const absolutePath = node_path_1.default.join(baseDir, entry);
                const stats = await this.fileSystem.stat(absolutePath);
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
            this.logger(`⚠️  Unable to read scope ${relativeDir}: ${error.message}`);
            return [];
        }
    }
    async loadSourceFiles() {
        const files = [];
        const scopePaths = this.input.scopePaths || [];
        for (const scope of scopePaths) {
            const discovered = await this.listFiles(scope);
            for (const relative of discovered) {
                if (!SOURCE_EXTENSIONS.some((extension) => relative.endsWith(extension))) {
                    continue;
                }
                const absolute = node_path_1.default.join(this.projectRoot, relative);
                try {
                    const content = await this.fileSystem.readFile(absolute, 'utf8');
                    files.push({ path: relative, content });
                }
                catch (error) {
                    this.logger(`⚠️  Failed to read ${relative}: ${error.message}`);
                }
            }
        }
        return files;
    }
    detectDuplications(files) {
        const blocks = new Map();
        for (const file of files) {
            const lines = (0, utils_1.tokenizeLines)(file.content);
            const windows = (0, utils_1.slidingWindow)(lines, 5);
            windows.forEach((window, index) => {
                const snippet = window.join('\n');
                if (snippet.length < 40) {
                    return;
                }
                const block = blocks.get(snippet) ?? { snippet, occurrences: [] };
                block.occurrences.push({ file: file.path, index });
                blocks.set(snippet, block);
            });
        }
        return Array.from(blocks.values()).filter((block) => block.occurrences.length > 1);
    }
    analyzeComplexity(files) {
        const findings = [];
        for (const file of files) {
            const tokens = (0, utils_1.tokenizeLines)(file.content);
            const controlFlowMatches = file.content.match(/\b(if|for|while|switch|case|catch)\b|&&|\|\|/g);
            const score = controlFlowMatches ? controlFlowMatches.length : 0;
            const longFunctions = (file.content.match(/function\s+\w+|=>\s*\(/g) ?? []).length;
            const reasonParts = [];
            if (score > 12) {
                reasonParts.push(`High branch count (${score})`);
            }
            if (tokens.length > 250) {
                reasonParts.push(`Large file (${tokens.length} significant lines)`);
            }
            if (longFunctions > 8) {
                reasonParts.push(`Many function declarations (${longFunctions})`);
            }
            if (reasonParts.length > 0) {
                findings.push({
                    file: file.path,
                    score,
                    length: tokens.length,
                    reason: reasonParts.join('; '),
                });
            }
        }
        return findings;
    }
    async auditDependencies() {
        const findings = [];
        const files = this.input.dependencyFiles ?? ['package.json', 'requirements.txt'];
        for (const dependencyFile of files) {
            const absolute = node_path_1.default.join(this.projectRoot, dependencyFile);
            try {
                const exists = await this.fileSystem.pathExists(absolute);
                if (!exists) {
                    continue;
                }
                if (dependencyFile.endsWith('package.json')) {
                    const raw = await this.fileSystem.readFile(absolute, 'utf8');
                    const pkg = JSON.parse(raw);
                    // Safely access dependencies with validation
                    if (pkg && typeof pkg === 'object') {
                        const dependencies = (pkg.dependencies && typeof pkg.dependencies === 'object') ? pkg.dependencies : {};
                        const devDependencies = (pkg.devDependencies && typeof pkg.devDependencies === 'object') ? pkg.devDependencies : {};
                        const all = { ...dependencies, ...devDependencies };
                        for (const [name, version] of Object.entries(all)) {
                            if (typeof version === 'string') {
                                if (/beta|alpha|rc/.test(version)) {
                                    findings.push({ name, version, reason: 'Pre-release version detected' });
                                }
                                else if (/^\^?0\./.test(version)) {
                                    findings.push({ name, version, reason: 'Major version 0 indicates unstable API' });
                                }
                            }
                        }
                    }
                }
                else if (dependencyFile.endsWith('requirements.txt')) {
                    const raw = await this.fileSystem.readFile(absolute, 'utf8');
                    for (const line of raw.split(/\r?\n/)) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) {
                            continue;
                        }
                        if (/(alpha|beta|rc)/i.test(trimmed)) {
                            findings.push({ name: trimmed, version: 'prerelease', reason: 'Pre-release dependency in requirements.txt' });
                        }
                    }
                }
            }
            catch (error) {
                this.logger(`⚠️  Failed to audit ${dependencyFile}: ${error.message}`);
            }
        }
        return findings;
    }
    renderDuplicationReport(blocks) {
        const lines = ['# Duplication Report', ''];
        if (!blocks.length) {
            lines.push('No duplicated blocks detected in the analyzed scope.');
            return lines.join('\n');
        }
        for (const block of blocks) {
            lines.push('---', '', '```', block.snippet, '```', '', 'Occurrences:');
            for (const occurrence of block.occurrences) {
                lines.push(`- ${occurrence.file} (window ${occurrence.index + 1})`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    renderComplexityReport(findings) {
        const lines = ['# Complexity Analysis', ''];
        if (!findings.length) {
            lines.push('No complexity hotspots detected.');
            return lines.join('\n');
        }
        for (const finding of findings) {
            lines.push(`- **${finding.file}** → ${finding.reason} (score: ${finding.score}, lines: ${finding.length})`);
        }
        return lines.join('\n');
    }
    renderDependencyReport(findings) {
        const lines = ['# Dependency Audit', ''];
        if (!findings.length) {
            lines.push('No risky dependencies detected.');
            return lines.join('\n');
        }
        for (const finding of findings) {
            lines.push(`- **${finding.name}** @ ${finding.version} — ${finding.reason}`);
        }
        return lines.join('\n');
    }
    async execute() {
        // Validate required inputs
        if (!this.input.scopePaths || this.input.scopePaths.length === 0) {
            throw new Error('scopePaths is required and must contain at least one directory');
        }
        const files = await this.loadSourceFiles();
        const duplications = this.detectDuplications(files);
        const complexity = this.analyzeComplexity(files);
        const dependencies = await this.auditDependencies();
        await this.runStage('duplication', 'Detect structural duplication', async () => {
            const artifactPath = this.createArtifactPath('reports/refactor', 'duplication', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderDuplicationReport(duplications), 'Duplicated code blocks detected by Refactor agent');
            return {
                summary: duplications.length ? `Identified ${duplications.length} duplicate blocks.` : 'No duplicate blocks found.',
                artifacts: [artifact],
            };
        });
        await this.runStage('complexity', 'Analyze cyclomatic complexity heuristics', async () => {
            const artifactPath = this.createArtifactPath('reports/refactor', 'complexity', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderComplexityReport(complexity), 'Complexity hotspots summary');
            return {
                summary: complexity.length ? `Flagged ${complexity.length} complex files.` : 'No complexity hotspots detected.',
                artifacts: [artifact],
            };
        });
        await this.runStage('dependencies', 'Audit dependency obsolescence', async () => {
            const artifactPath = this.createArtifactPath('reports/refactor', 'dependencies', 'md');
            const artifact = await this.artifactManager.write(artifactPath, this.renderDependencyReport(dependencies), 'Dependency risk assessment');
            return {
                summary: dependencies.length ? `Found ${dependencies.length} risky dependencies.` : 'Dependencies look healthy.',
                artifacts: [artifact],
            };
        });
        const summaryPath = this.createArtifactPath('reports/refactor', 'technical-debt', 'md');
        const summaryLines = [
            '# Technical Debt Summary',
            '',
            `- Duplicate blocks: ${duplications.length}`,
            `- Complexity findings: ${complexity.length}`,
            `- Dependency risks: ${dependencies.length}`,
            '',
            'Review the linked reports for remediation recommendations.',
        ];
        await this.artifactManager.write(summaryPath, summaryLines.join('\n'), 'Executive summary of technical debt analysis');
        return 'Technical debt assessment completed.';
    }
}
exports.RefactorMetaAgent = RefactorMetaAgent;
