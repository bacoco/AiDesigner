const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { ProjectState } = require('../lib/project-state');

describe('ProjectState defaults', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-state-defaults-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
      tempDir = null;
    }
  });

  it('generates agilai-prefixed IDs and lane defaults for new projects', async () => {
    const projectState = new ProjectState(tempDir);
    const state = await projectState.initialize();

    expect(state.projectId).toMatch(/^agilai-/);
    expect(projectState.getCurrentLane()).toBe('agilai');
  });

  it('preserves legacy bmad values when loading saved state', async () => {
    const stateDir = path.join(tempDir, '.agilai');
    await fs.ensureDir(stateDir);
    await fs.writeJson(
      path.join(stateDir, 'state.json'),
      {
        projectId: 'bmad-legacy-id',
        projectName: 'Legacy Project',
        currentPhase: 'analyst',
        currentLane: 'bmad',
        phaseHistory: [],
        laneHistory: [],
        requirements: {},
        decisions: {},
        userPreferences: {},
        nextSteps: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { spaces: 2 },
    );

    const projectState = new ProjectState(tempDir);
    const loadedState = await projectState.initialize();

    expect(loadedState.projectId).toBe('bmad-legacy-id');
    expect(projectState.getCurrentLane()).toBe('bmad');
  });
});
