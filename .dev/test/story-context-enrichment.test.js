const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { ProjectState } = require('../lib/project-state');
const { getContextEnrichers } = require('../hooks/context-enrichment');

function findDefaultEnricher() {
  const enrichers = getContextEnrichers();
  const enricher = enrichers.find((e) => e.name === 'default');
  return enricher ? enricher.enrich : undefined;
}

describe('story context enrichment', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-story-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
      tempDir = null;
    }
  });

  it('stores structured metadata alongside story deliverables', async () => {
    const projectState = new ProjectState(tempDir);
    await projectState.initialize();
    await projectState.transitionPhase('sm');

    const structuredStory = {
      storyId: '1.5',
      title: 'Implement secure login',
      persona: { primary: 'Authenticated user' },
      userRole: 'User',
      summary: 'Provide a secure login experience.',
      acceptanceCriteria: ['Supports MFA', 'Validates credentials securely'],
      definitionOfDone: ['All tests pass'],
      testingStrategy: 'Unit and integration tests',
      technicalDetails: 'Use OAuth 2.1 flows',
      epicNumber: 1,
      storyNumber: 5,
    };

    await projectState.storeDeliverable('story', '# Story content', {
      structuredStory,
      storyId: structuredStory.storyId,
      epicNumber: structuredStory.epicNumber,
      storyNumber: structuredStory.storyNumber,
      title: structuredStory.title,
      acceptanceCriteria: structuredStory.acceptanceCriteria,
      path: 'docs/stories/story-1-5-implement-secure-login.md',
    });

    const storedDeliverable = projectState.getDeliverable('sm', 'story');
    expect(storedDeliverable.storyId).toBe('1.5');
    expect(storedDeliverable.structured).toEqual(
      expect.objectContaining({
        id: '1.5',
        title: 'Implement secure login',
        epicNumber: 1,
        storyNumber: 5,
        acceptanceCriteria: ['Supports MFA', 'Validates credentials securely'],
        storedAt: expect.any(String),
      }),
    );

    const cachedStory = projectState.getStory('1.5');
    expect(cachedStory).toEqual(
      expect.objectContaining({
        id: '1.5',
        title: 'Implement secure login',
        acceptanceCriteria: ['Supports MFA', 'Validates credentials securely'],
        definitionOfDone: ['All tests pass'],
        testingStrategy: 'Unit and integration tests',
        technicalDetails: 'Use OAuth 2.1 flows',
      }),
    );

    const latestStory = projectState.getStory();
    expect(latestStory.id).toBe('1.5');
  });

  it('enricher prefers structured story data without reparsing markdown', async () => {
    const enricher = findDefaultEnricher();
    expect(enricher).toBeInstanceOf(Function);

    const readFileSpy = jest.spyOn(fs, 'readFile').mockImplementation(() => {
      throw new Error('Markdown should not be loaded when structured data exists');
    });

    const result = await enricher({
      context: {
        story: {
          path: '/does/not/exist.md',
          structured: {
            storyId: '2.1',
            title: 'Structured story from cache',
            epicNumber: 2,
            storyNumber: 1,
            persona: 'Operations engineer',
            summary: 'Use cache-first structured metadata.',
            acceptanceCriteria: ['Given structure, when requested, then no parsing is needed'],
            definitionOfDone: ['QA reviewed'],
            testingStrategy: 'Smoke tests',
          },
        },
      },
    });

    expect(readFileSpy).not.toHaveBeenCalled();
    readFileSpy.mockRestore();

    const overview = result.sections.find((section) => section.title === 'Story Overview');
    expect(overview.body).toContain('Story: Structured story from cache');
    expect(overview.body).toContain('Sequence: 2.1');

    const acceptanceSection = result.sections.find(
      (section) => section.title === 'Acceptance Criteria',
    );
    expect(acceptanceSection.body).toContain('Given structure');

    expect(result.persona).toContain('Operations engineer');
    expect(result.contextUpdates.story.summary).toBe('Use cache-first structured metadata.');
    expect(result.contextUpdates.story.acceptanceCriteria).toEqual([
      'Given structure, when requested, then no parsing is needed',
    ]);
  });
});
