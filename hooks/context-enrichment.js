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
  const escapedHeading = heading.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
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

function extractStructuredStory(story) {
  if (!story || typeof story !== 'object') {
    return null;
  }

  const candidates = [
    story.structured,
    story.structuredStory,
    story.story,
    story.fields,
    story.metadata?.structuredStory,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate;
    }
  }

  return null;
}

async function defaultStoryContextEnricher({ context }) {
  const storyInput = context?.story;
  if (!storyInput) {
    return null;
  }

  const story = { ...storyInput };

  const structuredStory = extractStructuredStory(story);

  const shouldLoadMarkdown = !structuredStory && !story.content && story.path;

  if (shouldLoadMarkdown) {
    const projectPath = context.projectPath || process.cwd();
    const storyPath = path.isAbsolute(story.path) ? story.path : path.join(projectPath, story.path);

    try {
      story.content = await fs.readFile(storyPath, 'utf8');
    } catch (error) {
      story.loadError = error instanceof Error ? error.message : String(error);
    }
  }

  const resolvedStory = { ...story };

  if (structuredStory) {
    const preferredFields = [
      'id',
      'title',
      'persona',
      'userRole',
      'action',
      'benefit',
      'summary',
      'description',
      'acceptanceCriteria',
      'definitionOfDone',
      'technicalDetails',
      'implementationNotes',
      'testingStrategy',
      'dependencies',
      'epicNumber',
      'storyNumber',
    ];

    for (const field of preferredFields) {
      if (structuredStory[field] != null) {
        resolvedStory[field] = structuredStory[field];
      }
    }

    if (!resolvedStory.storyId && structuredStory.storyId) {
      resolvedStory.storyId = structuredStory.storyId;
    }
  }

  const markdownContent = story.content;

  const personaFragments = [];

  if (resolvedStory.persona) {
    if (typeof resolvedStory.persona === 'string') {
      personaFragments.push(resolvedStory.persona.trim());
    } else if (Array.isArray(resolvedStory.persona)) {
      personaFragments.push(
        ...resolvedStory.persona.map((item) => collapseWhitespace(item)).filter(Boolean),
      );
    } else if (typeof resolvedStory.persona === 'object') {
      const personaLines = Object.entries(resolvedStory.persona)
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => `${key}: ${collapseWhitespace(String(value))}`);
      if (personaLines.length > 0) {
        personaFragments.push(personaLines.join('\n'));
      }
    }
  } else if (resolvedStory.userRole) {
    personaFragments.push(
      `Primary user role: ${collapseWhitespace(String(resolvedStory.userRole))}`,
    );
  }

  if (personaFragments.length === 0 && markdownContent) {
    const personaSection = extractSection(markdownContent, 'Persona');
    if (personaSection) {
      personaFragments.push(collapseWhitespace(personaSection));
    }
  }

  const sections = [];

  const overviewParts = [];
  if (resolvedStory.title) {
    overviewParts.push(`Story: ${resolvedStory.title}`);
  }
  if (resolvedStory.epicNumber != null && resolvedStory.storyNumber != null) {
    overviewParts.push(`Sequence: ${resolvedStory.epicNumber}.${resolvedStory.storyNumber}`);
  }
  if (resolvedStory.summary) {
    overviewParts.push(resolvedStory.summary);
  } else if (resolvedStory.description) {
    overviewParts.push(resolvedStory.description);
  } else if (markdownContent) {
    const contextSection = extractSection(markdownContent, 'Context');
    if (contextSection) {
      overviewParts.push(contextSection);
    } else {
      const firstParagraph = markdownContent
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

  const acceptanceList = Array.isArray(resolvedStory.acceptanceCriteria)
    ? resolvedStory.acceptanceCriteria
    : parseChecklist(
        markdownContent ? extractSection(markdownContent, 'Acceptance Criteria') : null,
      );
  if (acceptanceList.length > 0) {
    sections.push({
      title: 'Acceptance Criteria',
      body: acceptanceList.map((item) => `- ${item}`).join('\n'),
    });
  }

  const definitionOfDone = Array.isArray(resolvedStory.definitionOfDone)
    ? resolvedStory.definitionOfDone
    : parseChecklist(
        markdownContent ? extractSection(markdownContent, 'Definition of Done') : null,
      );
  if (definitionOfDone.length > 0) {
    sections.push({
      title: 'Definition of Done',
      body: definitionOfDone.map((item) => `- ${item}`).join('\n'),
    });
  }

  const rawTechnicalDetails =
    resolvedStory.technicalDetails == null
      ? markdownContent
        ? extractSection(markdownContent, 'Technical Details')
        : null
      : resolvedStory.technicalDetails;
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

  const dependencies =
    resolvedStory.dependencies == null
      ? markdownContent
        ? extractSection(markdownContent, 'Dependencies')
        : null
      : resolvedStory.dependencies;
  if (dependencies) {
    sections.push({
      title: 'Dependencies & Links',
      body: Array.isArray(dependencies)
        ? dependencies.map((item) => `- ${item}`).join('\n')
        : dependencies,
    });
  }

  const rawTestingStrategy =
    resolvedStory.testingStrategy == null
      ? markdownContent
        ? extractSection(markdownContent, 'Testing Strategy')
        : null
      : resolvedStory.testingStrategy;
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
      story: structuredStory
        ? { ...story, ...structuredStory, content: markdownContent }
        : { ...story, content: markdownContent },
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
