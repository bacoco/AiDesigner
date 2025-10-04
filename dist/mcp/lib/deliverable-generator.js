/**
 * Deliverable Generator
 * Generates Agilai deliverables (PRD, architecture, stories) from agent outputs
 */

const fs = require('fs-extra');
const path = require('node:path');
const { AgilaiBridge } = require('./agilai-bridge');

class DeliverableGenerator {
  constructor(projectPath = process.cwd(), options = {}) {
    this.projectPath = projectPath;
    this.docsPath = path.join(projectPath, 'docs');
    this.agilaiBridge = options.agilaiBridge || options.bmadBridge || new AgilaiBridge();

    /** @type {Map<number, Promise<any>>} */
    this.epicSpecCache = new Map();
  }

  /**
   * Initialize deliverable generator
   */
  async initialize() {
    await this.agilaiBridge.initialize();
    await fs.ensureDir(this.docsPath);
  }

  /**
   * Generate project brief (analyst phase)
   */
  async generateBrief(context) {
    const briefContent = this.formatBrief(context);
    const briefPath = path.join(this.docsPath, 'brief.md');

    await fs.writeFile(briefPath, briefContent, 'utf8');

    return {
      type: 'brief',
      path: briefPath,
      content: briefContent,
    };
  }

  /**
   * Generate Product Requirements Document (PM phase)
   */
  async generatePRD(context) {
    const prdContent = this.formatPRD(context);
    const prdPath = path.join(this.docsPath, 'prd.md');

    await fs.writeFile(prdPath, prdContent, 'utf8');

    return {
      type: 'prd',
      path: prdPath,
      content: prdContent,
    };
  }

  /**
   * Generate Architecture Document (architect phase)
   */
  async generateArchitecture(context) {
    const archContent = this.formatArchitecture(context);
    const archPath = path.join(this.docsPath, 'architecture.md');

    await fs.writeFile(archPath, archContent, 'utf8');

    // Also generate architecture shards if needed
    await this.generateArchitectureShards(context);

    return {
      type: 'architecture',
      path: archPath,
      content: archContent,
    };
  }

  /**
   * Generate architecture shards
   */
  async generateArchitectureShards(context) {
    const archDir = path.join(this.docsPath, 'architecture');
    await fs.ensureDir(archDir);

    // Coding standards
    if (context.codingStandards) {
      await fs.writeFile(
        path.join(archDir, 'coding-standards.md'),
        this.formatCodingStandards(context.codingStandards),
        'utf8',
      );
    }

    // Tech stack
    if (context.techStack) {
      await fs.writeFile(
        path.join(archDir, 'tech-stack.md'),
        this.formatTechStack(context.techStack),
        'utf8',
      );
    }

    // Source tree
    if (context.sourceTree) {
      await fs.writeFile(
        path.join(archDir, 'source-tree.md'),
        this.formatSourceTree(context.sourceTree),
        'utf8',
      );
    }
  }

  /**
   * Generate Epic (SM phase)
   */
  async generateEpic(epicData) {
    const epicsDir = path.join(this.docsPath, 'epics');
    await fs.ensureDir(epicsDir);

    const epicContent = this.formatEpic(epicData);
    const epicSlug = this.slugify(epicData.title);
    const baseFileName = `epic-${epicData.number}-${epicSlug}`;
    const epicPath = path.join(epicsDir, `${baseFileName}.md`);

    await fs.writeFile(epicPath, epicContent, 'utf8');

    let specArtifacts;
    if (epicData.spec) {
      specArtifacts = await this.writeEpicSpecArtifacts({
        epicsDir,
        baseFileName,
        epicData,
        specData: epicData.spec,
      });

      this.epicSpecCache.set(
        Number(epicData.number),
        Promise.resolve({
          ...specArtifacts.json,
          path: specArtifacts.jsonPath,
          relativePath: path.relative(this.projectPath, specArtifacts.jsonPath),
        }),
      );
    }

    return {
      type: 'epic',
      path: epicPath,
      content: epicContent,
      number: epicData.number,
      spec: specArtifacts
        ? {
            jsonPath: specArtifacts.jsonPath,
            markdownPath: specArtifacts.markdownPath,
            summary: specArtifacts.json.spec?.summary || null,
          }
        : undefined,
    };
  }

  /**
   * Generate User Story (SM phase)
   */
  async generateStory(storyData) {
    const storiesDir = path.join(this.docsPath, 'stories');
    await fs.ensureDir(storiesDir);

    const epicSpec = await this.loadEpicSpec(storyData.epicNumber);
    const storyContent = this.formatStory(storyData, epicSpec);
    const storyPath = path.join(
      storiesDir,
      `story-${storyData.epicNumber}-${storyData.storyNumber}-${this.slugify(storyData.title)}.md`,
    );

    await fs.writeFile(storyPath, storyContent, 'utf8');

    const storyId =
      storyData.storyId ||
      (storyData.epicNumber != null && storyData.storyNumber != null
        ? `${storyData.epicNumber}.${storyData.storyNumber}`
        : null);

    const structuredStory = {
      id: storyId || `story-${Date.now()}`,
      title: storyData.title || null,
      persona: storyData.persona || null,
      userRole: storyData.userRole || null,
      action: storyData.action || null,
      benefit: storyData.benefit || null,
      summary: storyData.summary || null,
      description: storyData.description || null,
      acceptanceCriteria: Array.isArray(storyData.acceptanceCriteria)
        ? [...storyData.acceptanceCriteria]
        : storyData.acceptanceCriteria || [],
      definitionOfDone: Array.isArray(storyData.definitionOfDone)
        ? [...storyData.definitionOfDone]
        : storyData.definitionOfDone || [],
      technicalDetails: storyData.technicalDetails || null,
      implementationNotes: storyData.implementationNotes || null,
      testingStrategy: storyData.testingStrategy || null,
      dependencies: storyData.dependencies || null,
      epicNumber: storyData.epicNumber ?? null,
      storyNumber: storyData.storyNumber ?? null,
      path: path.relative(this.projectPath, storyPath),
    };

    return {
      type: 'story',
      path: storyPath,
      content: storyContent,
      epicNumber: storyData.epicNumber,
      storyNumber: storyData.storyNumber,
      storyId,
      structured: structuredStory,
      epicSpec: epicSpec
        ? {
            source: epicSpec.relativePath,
            generatedAt: epicSpec.meta?.generatedAt || null,
          }
        : undefined,
    };
  }

  /**
   * Generate QA Assessment
   */
  async generateQAAssessment(context) {
    const qaDir = path.join(this.docsPath, 'qa', 'assessments');
    await fs.ensureDir(qaDir);

    const assessmentContent = this.formatQAAssessment(context);
    const assessmentPath = path.join(qaDir, 'risk-assessment.md');

    await fs.writeFile(assessmentPath, assessmentContent, 'utf8');

    return {
      type: 'qa_assessment',
      path: assessmentPath,
      content: assessmentContent,
    };
  }

  /**
   * Format brief document
   */
  formatBrief(context) {
    return `# Project Brief

## Problem Statement
${context.problemStatement || 'TBD'}

## Target Users
${context.targetUsers || 'TBD'}

## Goals & Objectives
${context.goals || 'TBD'}

## Success Criteria
${context.successCriteria || 'TBD'}

## Constraints
${context.constraints || 'TBD'}

## Market Context
${context.marketContext || 'TBD'}

## Competitive Landscape
${context.competitive || 'TBD'}

## Next Steps
${context.nextSteps || 'Proceed to Product Requirements phase'}

---
*Generated by Agilai-invisible*
`;
  }

  /**
   * Format PRD document
   */
  formatPRD(context) {
    return `# Product Requirements Document

## Executive Summary
${context.executiveSummary || 'TBD'}

## Goals & Objectives
${context.goals || 'TBD'}

## User Personas
${context.personas || 'TBD'}

## Features & Requirements

### Must-Have Features
${this.formatFeatureList(context.mustHave || [])}

### Should-Have Features
${this.formatFeatureList(context.shouldHave || [])}

### Could-Have Features
${this.formatFeatureList(context.couldHave || [])}

## User Stories & Epics
${this.formatEpicsList(context.epics || [])}

## Non-Functional Requirements
${context.nonFunctional || 'TBD'}

## Acceptance Criteria
${context.acceptanceCriteria || 'TBD'}

## Timeline & Milestones
${this.formatTimeline(context.timeline || {})}

## Dependencies & Risks
${context.dependencies || 'TBD'}

---
*Generated by Agilai-invisible*
`;
  }

  /**
   * Format architecture document
   */
  formatArchitecture(context) {
    return `# System Architecture

## Technology Stack
${this.formatTechStack(context.techStack || {})}

## System Components
${context.components || 'TBD'}

## Data Architecture
${context.dataArchitecture || 'TBD'}

## API Design
${context.apiDesign || 'TBD'}

## Security Architecture
${context.security || 'TBD'}

## Deployment Architecture
${context.deployment || 'TBD'}

## Scalability & Performance
${context.scalability || 'TBD'}

## Integration Points
${context.integrations || 'TBD'}

---
*Generated by Agilai-invisible*
`;
  }

  /**
   * Format epic document
   */
  formatEpic(epicData) {
    return `# Epic ${epicData.number}: ${epicData.title}

## Description
${epicData.description || 'TBD'}

## Goals
${epicData.goals || 'TBD'}

## User Stories
${this.formatStoriesList(epicData.stories || [])}

## Acceptance Criteria
${this.formatCriteriaList(epicData.acceptanceCriteria || [])}

## Dependencies
${epicData.dependencies || 'None'}

## Estimated Effort
${epicData.effort || 'TBD'}

---
*Generated by Agilai-invisible*
`;
  }

  /**
   * Format user story document
   */
  formatStory(storyData, epicSpec) {
    return `# Story ${storyData.epicNumber}.${storyData.storyNumber}: ${storyData.title}

## User Story
As a ${storyData.userRole || 'user'}
I want to ${storyData.action || 'TBD'}
So that ${storyData.benefit || 'TBD'}

## Description
${storyData.description || 'TBD'}

## Epic Spec Context
${this.formatEpicSpecContext(storyData, epicSpec)}

## Acceptance Criteria
${this.formatCriteriaList(storyData.acceptanceCriteria || [])}

## Technical Details
${storyData.technicalDetails || 'TBD'}

## Implementation Notes
${storyData.implementationNotes || 'TBD'}

## Testing Strategy
${storyData.testingStrategy || 'TBD'}

## Definition of Done
${this.formatCriteriaList(storyData.definitionOfDone || [])}

---
*Generated by Agilai-invisible*
`;
  }

  /**
   * Format QA assessment
   */
  formatQAAssessment(context) {
    return `# QA Risk Assessment

## Test Strategy
${context.testStrategy || 'TBD'}

## Risk Analysis
${context.riskAnalysis || 'TBD'}

## Test Coverage Requirements
${context.testCoverage || 'TBD'}

## Quality Gates
${this.formatCriteriaList(context.qualityGates || [])}

---
*Generated by Agilai-invisible*
`;
  }

  // Helper formatting methods

  formatFeatureList(features) {
    if (features.length === 0) return '- TBD';
    return features.map((f) => `- ${f}`).join('\n');
  }

  formatEpicsList(epics) {
    if (epics.length === 0) return '- TBD';
    return epics
      .map((e, i) => `\n### Epic ${i + 1}: ${e.title || 'TBD'}\n${e.description || ''}`)
      .join('\n');
  }

  formatStoriesList(stories) {
    if (stories.length === 0) return '- TBD';
    return stories.map((s, i) => `- Story ${i + 1}: ${s.title || 'TBD'}`).join('\n');
  }

  formatCriteriaList(criteria) {
    if (criteria.length === 0) return '- TBD';
    return criteria.map((c) => `- [ ] ${c}`).join('\n');
  }

  formatTimeline(timeline) {
    if (!timeline.milestones) return 'TBD';
    return timeline.milestones
      .map((m) => `- **${m.name}** (${m.date}): ${m.description || ''}`)
      .join('\n');
  }

  formatTechStack(stack) {
    if (!stack || typeof stack !== 'object') return 'TBD';

    let output = '';
    for (const [category, technologies] of Object.entries(stack)) {
      output += `\n### ${category}\n`;
      if (Array.isArray(technologies)) {
        output += technologies.map((t) => `- ${t}`).join('\n');
      } else {
        output += `${technologies}`;
      }
      output += '\n';
    }
    return output;
  }

  formatCodingStandards(standards) {
    return `# Coding Standards

${standards}

---
*Generated by Agilai-invisible*
`;
  }

  formatSourceTree(tree) {
    return `# Source Tree Structure

\`\`\`
${tree}
\`\`\`

---
*Generated by Agilai-invisible*
`;
  }

  async writeEpicSpecArtifacts({ epicsDir, baseFileName, epicData, specData }) {
    const generatedAt = new Date().toISOString();
    const jsonPayload = {
      meta: {
        epicNumber: epicData.number,
        epicTitle: epicData.title,
        slug: this.slugify(epicData.title),
        generatedAt,
      },
      spec: specData,
    };

    const jsonPath = path.join(epicsDir, `${baseFileName}.spec.json`);
    await fs.writeJson(jsonPath, jsonPayload, { spaces: 2 });

    const markdownPath = path.join(epicsDir, `${baseFileName}.spec.md`);
    const markdownContent = this.formatEpicSpecMarkdown({
      epicData,
      specData,
      generatedAt,
    });
    await fs.writeFile(markdownPath, markdownContent, 'utf8');

    return {
      jsonPath,
      markdownPath,
      json: jsonPayload,
      markdown: markdownContent,
    };
  }

  async loadEpicSpec(epicNumber) {
    if (!epicNumber && epicNumber !== 0) return null;

    if (!this.epicSpecCache.has(Number(epicNumber))) {
      this.epicSpecCache.set(Number(epicNumber), this.readEpicSpec(epicNumber));
    }

    return this.epicSpecCache.get(Number(epicNumber));
  }

  async readEpicSpec(epicNumber) {
    const epicsDir = path.join(this.docsPath, 'epics');
    if (!(await fs.pathExists(epicsDir))) return null;

    const files = await fs.readdir(epicsDir);
    const prefix = `epic-${epicNumber}-`;
    const specFile = files.find((file) => file.startsWith(prefix) && file.endsWith('.spec.json'));

    if (!specFile) return null;

    const specPath = path.join(epicsDir, specFile);
    const specJson = await fs.readJson(specPath);

    return {
      ...specJson,
      path: specPath,
      relativePath: path.relative(this.projectPath, specPath),
    };
  }

  formatEpicSpecMarkdown({ epicData, specData, generatedAt }) {
    const lines = [
      `# Epic ${epicData.number}: ${epicData.title} — Targeted Specification`,
      '',
      `_Generated: ${generatedAt}_`,
      '',
      '## Summary',
      specData.summary || 'TBD',
      '',
      '## Objectives',
      this.formatList(specData.objectives || specData.goals),
      '',
      '## Scope',
      '### In Scope',
      this.formatList(specData.scope?.in || specData.inScope),
      '',
      '### Out of Scope',
      this.formatList(specData.scope?.out || specData.outOfScope),
      '',
      '## Functional Requirements',
      this.formatList(specData.requirements?.functional),
      '',
      '## Non-Functional Requirements',
      this.formatList(specData.requirements?.nonFunctional),
      '',
      '## User Personas / Journeys',
      this.formatList(specData.personas || specData.journeys),
      '',
      '## Dependencies',
      this.formatList(specData.dependencies),
      '',
      '## Risks & Mitigations',
      this.formatList(specData.risks),
      '',
      '## Success Metrics',
      this.formatList(specData.successMetrics),
      '',
      '## Outstanding Questions',
      this.formatList(specData.questions || specData.openQuestions),
      '',
      '## Story Focus Breakdown',
      this.formatStoryBreakdown(specData.storyBreakdown),
      '',
    ];

    lines.push('---', '*Generated by Agilai-invisible*');

    return lines.join('\n');
  }

  formatStoryBreakdown(stories) {
    if (!Array.isArray(stories) || stories.length === 0) return '- TBD';

    return stories
      .map((story, index) => {
        const storyId = story.storyNumber || story.id || story.number || `${index + 1}`;
        const storyTitle = story.title || story.summary || 'TBD';
        const focus = story.focus || story.description || story.context || null;
        const lines = [`- **Story ${storyId}: ${storyTitle}**`];

        if (focus) {
          lines.push(`  - Focus: ${focus}`);
        }

        if (Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0) {
          lines.push(`  - Acceptance Criteria: ${story.acceptanceCriteria.join('; ')}`);
        }

        if (Array.isArray(story.dependencies) && story.dependencies.length > 0) {
          lines.push(`  - Dependencies: ${story.dependencies.join(', ')}`);
        }

        if (Array.isArray(story.notes) && story.notes.length > 0) {
          lines.push(`  - Notes: ${story.notes.join('; ')}`);
        }

        return lines.join('\n');
      })
      .join('\n');
  }

  formatEpicSpecContext(storyData, epicSpec) {
    if (!epicSpec) {
      return 'No targeted specification found for this epic.';
    }

    const lines = [];
    const spec = epicSpec.spec || {};

    if (epicSpec.relativePath) {
      lines.push(`- **Spec Source**: ${epicSpec.relativePath}`);
    }

    if (epicSpec.meta?.generatedAt) {
      lines.push(`- **Spec Generated**: ${epicSpec.meta.generatedAt}`);
    }

    const relevantStory = this.findRelevantStorySpec(storyData, spec.storyBreakdown);

    if (relevantStory) {
      let guidanceDetails = [];

      if (relevantStory.focus || relevantStory.summary) {
        guidanceDetails = [
          ...guidanceDetails,
          `  - Focus: ${relevantStory.focus || relevantStory.summary}`,
        ];
      }

      if (
        Array.isArray(relevantStory.acceptanceCriteria) &&
        relevantStory.acceptanceCriteria.length > 0
      ) {
        guidanceDetails = [
          ...guidanceDetails,
          `  - Acceptance Criteria Notes: ${relevantStory.acceptanceCriteria.join(', ')}`,
        ];
      }

      if (
        Array.isArray(relevantStory.implementationNotes) &&
        relevantStory.implementationNotes.length > 0
      ) {
        guidanceDetails = [
          ...guidanceDetails,
          '  - Implementation Notes:',
          ...relevantStory.implementationNotes.map((note) => `    - ${note}`),
        ];
      }

      if (Array.isArray(relevantStory.dependencies) && relevantStory.dependencies.length > 0) {
        guidanceDetails = [
          ...guidanceDetails,
          `  - Dependencies: ${relevantStory.dependencies.join(', ')}`,
        ];
      }

      lines.push('- **Targeted Guidance**:', ...guidanceDetails);
    } else {
      if (spec.summary) {
        lines.push(`- **Epic Summary**: ${spec.summary}`);
      }

      if (Array.isArray(spec.objectives) && spec.objectives.length > 0) {
        lines.push(
          '- **Epic Objectives**:',
          ...spec.objectives.map((objective) => `  - ${objective}`),
        );
      }
    }

    if (Array.isArray(spec.risks) && spec.risks.length > 0) {
      const riskDetails = spec.risks.flatMap((risk) => {
        if (typeof risk === 'string') {
          return [`  - ${risk}`];
        }

        if (risk && typeof risk === 'object') {
          const riskLabel = risk.title || risk.name || risk.id || 'Risk';
          const mitigation = risk.mitigation || risk.plan;
          return [mitigation ? `  - ${riskLabel}: ${mitigation}` : `  - ${riskLabel}`];
        }

        return [];
      });

      lines.push('- **Risks to Monitor**:', ...riskDetails);
    }

    if (lines.length === 0) {
      return 'Targeted epic spec located but no structured guidance was provided.';
    }

    return lines.join('\n');
  }

  findRelevantStorySpec(storyData, storyBreakdown) {
    if (!Array.isArray(storyBreakdown) || storyBreakdown.length === 0) {
      return null;
    }

    const targetId = `${storyData.epicNumber}.${storyData.storyNumber}`;
    const normalizedTitle = storyData.title ? storyData.title.trim().toLowerCase() : null;

    return (
      storyBreakdown.find((story) => {
        if (!story) return false;

        const candidates = new Set(
          [story.storyNumber, story.id, story.number, story.sequence]
            .filter(Boolean)
            .map((value) => String(value).trim()),
        );

        if (candidates.has(targetId) || candidates.has(String(storyData.storyNumber))) {
          return true;
        }

        if (normalizedTitle && story.title) {
          return story.title.trim().toLowerCase() === normalizedTitle;
        }

        return false;
      }) || null
    );
  }

  formatList(data, emptyText = '- TBD') {
    if (!data && data !== 0) return emptyText;

    if (typeof data === 'string') {
      return data.trim().length > 0 ? data : emptyText;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return emptyText;

      return data
        .map((item) => {
          if (typeof item === 'string') {
            return `- ${item}`;
          }

          if (item && typeof item === 'object') {
            const label = item.title || item.name || item.id || null;
            const detail = item.description || item.details || item.summary || item.note;

            if (label && detail) {
              return `- ${label}: ${detail}`;
            }

            if (label) {
              return `- ${label}`;
            }

            if (detail) {
              return `- ${detail}`;
            }

            return `- ${JSON.stringify(item)}`;
          }

          return `- ${String(item)}`;
        })
        .join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return emptyText;

      return entries
        .map(([key, value]) => `- ${this.prettyKey(key)}: ${this.formatScalar(value)}`)
        .join('\n');
    }

    return `- ${String(data)}`;
  }

  prettyKey(key) {
    return String(key)
      .replaceAll(/[_-]+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/\b\w/g, (char) => char.toUpperCase());
  }

  formatScalar(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replaceAll(/[^\w\s-]/g, '')
      .replaceAll(/\s+/g, '-')
      .replaceAll(/--+/g, '-')
      .trim();
  }
}

module.exports = { DeliverableGenerator };
