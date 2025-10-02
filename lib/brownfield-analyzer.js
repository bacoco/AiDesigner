/**
 * Brownfield Analyzer
 * Scans existing codebases, detects tech stack, finds existing BMAD docs
 */

const fs = require('fs-extra');
const path = require('node:path');
const { glob } = require('glob');

class BrownfieldAnalyzer {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.docsPath = path.join(projectPath, 'docs');
    this.bmadStatePath = path.join(projectPath, '.bmad-invisible');
  }

  /**
   * Scan entire codebase for structure and patterns
   */
  async scanCodebase() {
    const results = {
      structure: await this.analyzeStructure(),
      techStack: await this.detectTechStack(),
      entryPoints: await this.findEntryPoints(),
      models: await this.findModels(),
      components: await this.findComponents(),
      apis: await this.findAPIs(),
      tests: await this.findTests(),
      config: await this.findConfig(),
    };

    return results;
  }

  /**
   * Analyze project structure
   */
  async analyzeStructure() {
    const structure = {
      root: this.projectPath,
      directories: [],
      fileCount: 0,
      languages: new Set(),
    };

    // Find all directories (excluding node_modules, .git, etc.)
    const ignore = ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'];
    const files = await glob('**/*', {
      cwd: this.projectPath,
      ignore,
      nodir: false,
    });

    for (const file of files) {
      const fullPath = path.join(this.projectPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        structure.directories.push(file);
      } else {
        structure.fileCount++;
        const ext = path.extname(file);
        if (ext) structure.languages.add(ext);
      }
    }

    structure.languages = [...structure.languages];
    return structure;
  }

  /**
   * Detect technology stack
   */
  async detectTechStack() {
    const stack = {
      language: null,
      framework: null,
      backend: null,
      frontend: null,
      database: null,
      mobile: null,
      testing: [],
      devTools: [],
    };

    // Check package.json (Node.js/JavaScript)
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      stack.language = 'JavaScript/TypeScript';

      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Framework detection
      if (deps.react || deps['react-native']) {
        stack.framework = deps['react-native'] ? 'React Native' : 'React';
        stack.mobile = deps['react-native'] ? 'React Native' : null;
      } else if (deps.vue) {
        stack.framework = 'Vue';
      } else if (deps.angular || deps['@angular/core']) {
        stack.framework = 'Angular';
      } else if (deps.next) {
        stack.framework = 'Next.js';
      } else if (deps.svelte) {
        stack.framework = 'Svelte';
      }

      // Backend detection
      if (deps.express) {
        stack.backend = 'Express';
      } else if (deps.fastify) {
        stack.backend = 'Fastify';
      } else if (deps.koa) {
        stack.backend = 'Koa';
      } else if (deps['@nestjs/core']) {
        stack.backend = 'NestJS';
      }

      // Database detection
      if (deps.mongoose) {
        stack.database = 'MongoDB (Mongoose)';
      } else if (deps.pg || deps.postgres) {
        stack.database = 'PostgreSQL';
      } else if (deps.mysql || deps.mysql2) {
        stack.database = 'MySQL';
      } else if (deps.firebase || deps['firebase-admin']) {
        stack.database = 'Firebase';
      } else if (deps.supabase || deps['@supabase/supabase-js']) {
        stack.database = 'Supabase';
      } else if (deps.prisma || deps['@prisma/client']) {
        stack.database = 'Prisma (ORM)';
      }

      // Testing frameworks
      if (deps.jest) stack.testing.push('Jest');
      if (deps.mocha) stack.testing.push('Mocha');
      if (deps.vitest) stack.testing.push('Vitest');
      if (deps.playwright || deps['@playwright/test']) stack.testing.push('Playwright');
      if (deps.cypress) stack.testing.push('Cypress');

      // Dev tools
      if (deps.typescript) stack.devTools.push('TypeScript');
      if (deps.eslint) stack.devTools.push('ESLint');
      if (deps.prettier) stack.devTools.push('Prettier');
      if (deps.webpack) stack.devTools.push('Webpack');
      if (deps.vite) stack.devTools.push('Vite');
    }

    // Check for Swift (iOS)
    const pbxprojFiles = await glob('**/*.xcodeproj/project.pbxproj', {
      cwd: this.projectPath,
    });
    if (pbxprojFiles.length > 0) {
      stack.language = 'Swift';
      stack.mobile = 'iOS (Native)';
      stack.framework = 'SwiftUI or UIKit';
    }

    // Check for Kotlin/Java (Android)
    const gradleFiles = await glob('**/build.gradle', { cwd: this.projectPath });
    if (gradleFiles.length > 0) {
      stack.language = 'Kotlin/Java';
      stack.mobile = 'Android (Native)';
    }

    // Check for Flutter
    const pubspecPath = path.join(this.projectPath, 'pubspec.yaml');
    if (await fs.pathExists(pubspecPath)) {
      stack.language = 'Dart';
      stack.framework = 'Flutter';
      stack.mobile = 'Flutter (Cross-platform)';
    }

    return stack;
  }

  /**
   * Find entry points (main files)
   */
  async findEntryPoints() {
    const entryPoints = [];

    const candidates = [
      'index.js',
      'index.ts',
      'main.js',
      'main.ts',
      'app.js',
      'app.ts',
      'server.js',
      'server.ts',
      'src/index.js',
      'src/index.ts',
      'src/main.js',
      'src/main.ts',
      'src/app.js',
      'src/App.tsx',
      'App.js',
      'App.tsx',
    ];

    for (const candidate of candidates) {
      const fullPath = path.join(this.projectPath, candidate);
      if (await fs.pathExists(fullPath)) {
        entryPoints.push({
          file: candidate,
          path: fullPath,
          type: this.detectFileType(candidate),
        });
      }
    }

    return entryPoints;
  }

  /**
   * Find data models
   */
  async findModels() {
    const modelFiles = await glob('**/{models,schemas,entities}/**/*.{js,ts,swift}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    return modelFiles.map((file) => ({
      file,
      path: path.join(this.projectPath, file),
      type: 'model',
    }));
  }

  /**
   * Find UI components
   */
  async findComponents() {
    const componentFiles = await glob(
      '**/{components,views,screens}/**/*.{js,jsx,ts,tsx,swift,vue}',
      {
        cwd: this.projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
      },
    );

    return componentFiles.map((file) => ({
      file,
      path: path.join(this.projectPath, file),
      type: 'component',
    }));
  }

  /**
   * Find API routes/endpoints
   */
  async findAPIs() {
    const apiFiles = await glob('**/{api,routes,controllers,endpoints}/**/*.{js,ts}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    return apiFiles.map((file) => ({
      file,
      path: path.join(this.projectPath, file),
      type: 'api',
    }));
  }

  /**
   * Find test files
   */
  async findTests() {
    const testFiles = await glob('**/*.{test,spec}.{js,ts,jsx,tsx}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    return testFiles.map((file) => ({
      file,
      path: path.join(this.projectPath, file),
      type: 'test',
    }));
  }

  /**
   * Find configuration files
   */
  async findConfig() {
    const configFiles = [];

    const candidates = [
      'package.json',
      'tsconfig.json',
      'vite.config.js',
      'webpack.config.js',
      '.env',
      '.env.example',
      'next.config.js',
      'tailwind.config.js',
    ];

    for (const candidate of candidates) {
      const fullPath = path.join(this.projectPath, candidate);
      if (await fs.pathExists(fullPath)) {
        configFiles.push({
          file: candidate,
          path: fullPath,
          type: 'config',
        });
      }
    }

    return configFiles;
  }

  /**
   * Detect if BMAD state exists (previous session)
   */
  async detectPreviousState() {
    const stateFile = path.join(this.bmadStatePath, 'state.json');

    if (await fs.pathExists(stateFile)) {
      const state = await fs.readJson(stateFile);
      const lastUpdated =
        state.updatedAt ||
        state.lastUpdated ||
        state.metadata?.updatedAt ||
        state.metadata?.lastUpdated ||
        null;
      return {
        exists: true,
        state,
        lastPhase: state.phase || state.currentPhase,
        lastUpdated,
      };
    }

    return {
      exists: false,
      state: null,
    };
  }

  /**
   * Detect existing BMAD documentation
   */
  async detectExistingDocs() {
    const docs = {
      brief: null,
      prd: null,
      architecture: null,
      epics: [],
      stories: [],
      qa: [],
    };

    // Check for main docs
    const briefPath = path.join(this.docsPath, 'brief.md');
    if (await fs.pathExists(briefPath)) {
      docs.brief = {
        path: briefPath,
        content: await fs.readFile(briefPath, 'utf8'),
      };
    }

    const prdPath = path.join(this.docsPath, 'prd.md');
    if (await fs.pathExists(prdPath)) {
      docs.prd = {
        path: prdPath,
        content: await fs.readFile(prdPath, 'utf8'),
      };
    }

    const archPath = path.join(this.docsPath, 'architecture.md');
    if (await fs.pathExists(archPath)) {
      docs.architecture = {
        path: archPath,
        content: await fs.readFile(archPath, 'utf8'),
      };
    }

    // Check for epics
    const epicsDir = path.join(this.docsPath, 'epics');
    if (await fs.pathExists(epicsDir)) {
      const epicFiles = await glob('epic-*.md', { cwd: epicsDir });
      for (const file of epicFiles) {
        const fullPath = path.join(epicsDir, file);
        docs.epics.push({
          file,
          path: fullPath,
          content: await fs.readFile(fullPath, 'utf8'),
        });
      }
    }

    // Check for stories
    const storiesDir = path.join(this.docsPath, 'stories');
    if (await fs.pathExists(storiesDir)) {
      const storyFiles = await glob('story-*.md', { cwd: storiesDir });
      for (const file of storyFiles) {
        const fullPath = path.join(storiesDir, file);
        docs.stories.push({
          file,
          path: fullPath,
          content: await fs.readFile(fullPath, 'utf8'),
        });
      }
    }

    // Check for QA docs
    const qaDir = path.join(this.docsPath, 'qa');
    if (await fs.pathExists(qaDir)) {
      const qaFiles = await glob('**/*.md', { cwd: qaDir });
      for (const file of qaFiles) {
        const fullPath = path.join(qaDir, file);
        docs.qa.push({
          file,
          path: fullPath,
          content: await fs.readFile(fullPath, 'utf8'),
        });
      }
    }

    return docs;
  }

  /**
   * Generate codebase summary for LLM
   */
  async generateCodebaseSummary() {
    const [codebase, techStack, previousState, existingDocs] = await Promise.all([
      this.scanCodebase(),
      this.detectTechStack(),
      this.detectPreviousState(),
      this.detectExistingDocs(),
    ]);

    return {
      codebase,
      techStack,
      previousState,
      existingDocs,
      summary: this.formatSummary(codebase, techStack, previousState, existingDocs),
    };
  }

  /**
   * Format summary as readable text
   */
  formatSummary(codebase, techStack, previousState, existingDocs) {
    let summary = `# Codebase Analysis\n\n`;

    // Project structure
    summary += `## Project Structure\n\n`;
    summary += `- **Total Files**: ${codebase.structure.fileCount}\n`;
    summary += `- **Languages**: ${codebase.structure.languages.join(', ')}\n`;
    summary += `- **Key Directories**: ${codebase.structure.directories.slice(0, 10).join(', ')}\n\n`;

    // Tech stack
    summary += `## Technology Stack\n\n`;
    if (techStack.language) summary += `- **Language**: ${techStack.language}\n`;
    if (techStack.framework) summary += `- **Framework**: ${techStack.framework}\n`;
    if (techStack.backend) summary += `- **Backend**: ${techStack.backend}\n`;
    if (techStack.database) summary += `- **Database**: ${techStack.database}\n`;
    if (techStack.mobile) summary += `- **Mobile Platform**: ${techStack.mobile}\n`;
    if (techStack.testing.length > 0) summary += `- **Testing**: ${techStack.testing.join(', ')}\n`;
    if (techStack.devTools.length > 0)
      summary += `- **Dev Tools**: ${techStack.devTools.join(', ')}\n`;
    summary += `\n`;

    // Entry points
    if (codebase.entryPoints.length > 0) {
      summary += `## Entry Points\n\n`;
      for (const entry of codebase.entryPoints) {
        summary += `- ${entry.file} (${entry.type})\n`;
      }
      summary += `\n`;
    }

    // Models
    if (codebase.models.length > 0) {
      summary += `## Data Models\n\n`;
      summary += `Found ${codebase.models.length} model files:\n`;
      for (const model of codebase.models.slice(0, 5)) {
        summary += `- ${model.file}\n`;
      }
      if (codebase.models.length > 5) {
        summary += `- ... and ${codebase.models.length - 5} more\n`;
      }
      summary += `\n`;
    }

    // Components
    if (codebase.components.length > 0) {
      summary += `## UI Components\n\n`;
      summary += `Found ${codebase.components.length} component files:\n`;
      for (const component of codebase.components.slice(0, 5)) {
        summary += `- ${component.file}\n`;
      }
      if (codebase.components.length > 5) {
        summary += `- ... and ${codebase.components.length - 5} more\n`;
      }
      summary += `\n`;
    }

    // APIs
    if (codebase.apis.length > 0) {
      summary += `## API Endpoints\n\n`;
      summary += `Found ${codebase.apis.length} API files:\n`;
      for (const api of codebase.apis.slice(0, 5)) {
        summary += `- ${api.file}\n`;
      }
      if (codebase.apis.length > 5) {
        summary += `- ... and ${codebase.apis.length - 5} more\n`;
      }
      summary += `\n`;
    }

    // Previous BMAD state
    if (previousState.exists) {
      summary += `## Previous BMAD Session Found\n\n`;
      summary += `- **Last Phase**: ${previousState.lastPhase}\n`;
      summary += `- **Last Updated**: ${previousState.lastUpdated}\n`;
      summary += `\n**Note**: You can resume from this point or start fresh.\n\n`;
    }

    // Existing docs
    const hasExistingDocs =
      existingDocs.brief ||
      existingDocs.prd ||
      existingDocs.architecture ||
      existingDocs.epics.length > 0 ||
      existingDocs.stories.length > 0;

    if (hasExistingDocs) {
      summary += `## Existing BMAD Documentation\n\n`;
      if (existingDocs.brief) summary += `- ✅ Project Brief (docs/brief.md)\n`;
      if (existingDocs.prd) summary += `- ✅ Product Requirements (docs/prd.md)\n`;
      if (existingDocs.architecture) summary += `- ✅ Architecture (docs/architecture.md)\n`;
      if (existingDocs.epics.length > 0) summary += `- ✅ ${existingDocs.epics.length} Epic(s)\n`;
      if (existingDocs.stories.length > 0)
        summary += `- ✅ ${existingDocs.stories.length} Story(ies)\n`;
      if (existingDocs.qa.length > 0) summary += `- ✅ ${existingDocs.qa.length} QA docs\n`;
      summary += `\n**Note**: Existing docs can be updated or extended.\n\n`;
    }

    return summary;
  }

  /**
   * Helper to detect file type
   */
  detectFileType(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('server') || lower.includes('api')) return 'backend';
    if (lower.includes('app') || lower.includes('index')) return 'entry';
    if (lower.includes('component')) return 'frontend';
    return 'unknown';
  }
}

module.exports = { BrownfieldAnalyzer };
