// hooks/context-enrichment.js
// Assemble lightweight just-in-time story context for BMAD-Invisible.

const fs = require('fs-extra');
const path = require('node:path');

const contextEnrichers = [];

function registerContextEnricher(enricher) {
  if (typeof enricher !== 'function') {
    throw new TypeError('Context enricher must be a function');
  }

  contextEnrichers.push(enricher);
  return () => {
    const index = contextEnrichers.indexOf(enricher);
    if (index !== -1) {
      contextEnrichers.splice(index, 1);
    }
  };
}

function getContextEnrichers() {
  return [...contextEnrichers];
}

function extractSection(content, heading) {
  if (!content) {
    return null;
  }

  // Escape special regex characters in heading to prevent injection
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^## ${escapedHeading}\\n([\\s\\S]*?)(?=^## |$)`, 'm');
  const match = content.match(pattern);
  if (!match) {
    return null;
  }

  return match[1].trim();
}

function parseChecklist(sectionText) {
  if (!sectionText) {
    return [];
  }

  return sectionText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*(\[[ xX]?\]\s*)?/, '').trim())
    .filter(Boolean);
}

function collapseWhitespace(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replaceAll(/\s+/g, ' ').trim();
}

async function defaultStoryContextEnricher({ context }) {
  const storyInput = context?.story;
  if (!storyInput) {
    return null;
  }

  const story = { ...storyInput };

  if (!story.content && story.path) {
    const projectPath = context.projectPath || process.cwd();
    const storyPath = path.isAbsolute(story.path) ? story.path : path.join(projectPath, story.path);

    try {
      story.content = await fs.readFile(storyPath, 'utf8');
    } catch (error) {
      story.loadError = error instanceof Error ? error.message : String(error);
    }
  }

  const personaFragments = [];

  if (story.persona) {
    if (typeof story.persona === 'string') {
      personaFragments.push(story.persona.trim());
    } else if (Array.isArray(story.persona)) {
      personaFragments.push(
        ...story.persona.map((item) => collapseWhitespace(item)).filter(Boolean),
      );
    } else if (typeof story.persona === 'object') {
      const personaLines = Object.entries(story.persona)
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => `${key}: ${collapseWhitespace(String(value))}`);
      if (personaLines.length > 0) {
        personaFragments.push(personaLines.join('\n'));
      }
    }
  } else if (story.userRole) {
    personaFragments.push(`Primary user role: ${collapseWhitespace(String(story.userRole))}`);
  }

  if (personaFragments.length === 0 && story.content) {
    const personaSection = extractSection(story.content, 'Persona');
    if (personaSection) {
      personaFragments.push(collapseWhitespace(personaSection));
    }
  }

  const sections = [];

  const overviewParts = [];
  if (story.title) {
    overviewParts.push(`Story: ${story.title}`);
  }
  if (story.epicNumber != null && story.storyNumber != null) {
    overviewParts.push(`Sequence: ${story.epicNumber}.${story.storyNumber}`);
  }
  if (story.summary) {
    overviewParts.push(story.summary);
  } else if (story.description) {
    overviewParts.push(story.description);
  } else if (story.content) {
    const contextSection = extractSection(story.content, 'Context');
    if (contextSection) {
      overviewParts.push(contextSection);
    } else {
      const firstParagraph = story.content
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .find(Boolean);
      if (firstParagraph) {
        overviewParts.push(firstParagraph);
      }
    }
  }

  if (overviewParts.length > 0) {
    sections.push({
      title: 'Story Overview',
      body: overviewParts.filter(Boolean).join('\n'),
    });
  }

  const acceptanceList = Array.isArray(story.acceptanceCriteria)
    ? story.acceptanceCriteria
    : parseChecklist(extractSection(story.content, 'Acceptance Criteria'));
  if (acceptanceList.length > 0) {
    sections.push({
      title: 'Acceptance Criteria',
      body: acceptanceList.map((item) => `- ${item}`).join('\n'),
    });
  }

  const definitionOfDone = Array.isArray(story.definitionOfDone)
    ? story.definitionOfDone
    : parseChecklist(extractSection(story.content, 'Definition of Done'));
  if (definitionOfDone.length > 0) {
    sections.push({
      title: 'Definition of Done',
      body: definitionOfDone.map((item) => `- ${item}`).join('\n'),
    });
  }

  const rawTechnicalDetails =
    story.technicalDetails || extractSection(story.content, 'Technical Details');
  if (rawTechnicalDetails != null) {
    const techBody = Array.isArray(rawTechnicalDetails)
      ? rawTechnicalDetails
          .map((item) => collapseWhitespace(String(item)))
          .filter(Boolean)
          .join('\n')
      : collapseWhitespace(String(rawTechnicalDetails));
    if (techBody) {
      sections.push({
        title: 'Technical Notes',
        body: techBody,
      });
    }
  }

  const dependencies = story.dependencies || extractSection(story.content, 'Dependencies');
  if (dependencies) {
    sections.push({
      title: 'Dependencies & Links',
      body: Array.isArray(dependencies)
        ? dependencies.map((item) => `- ${item}`).join('\n')
        : dependencies,
    });
  }

  const rawTestingStrategy =
    story.testingStrategy || extractSection(story.content, 'Testing Strategy');
  if (rawTestingStrategy != null) {
    const testingBody = Array.isArray(rawTestingStrategy)
      ? rawTestingStrategy
          .map((item) => collapseWhitespace(String(item)))
          .filter(Boolean)
          .join('\n')
      : collapseWhitespace(String(rawTestingStrategy));
    if (testingBody) {
      sections.push({
        title: 'Testing Strategy',
        body: testingBody,
      });
    }
  }

  return {
    contextUpdates: {
      story,
    },
    persona: personaFragments,
    sections,
  };
}

registerContextEnricher(defaultStoryContextEnricher);

module.exports = {
  registerContextEnricher,
  getContextEnrichers,
};
