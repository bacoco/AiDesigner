const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const { BrownfieldAnalyzer } = require('../lib/brownfield-analyzer');

describe('BrownfieldAnalyzer.detectPreviousState', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-analyzer-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
      tempDir = null;
    }
  });

  it('surfaces updatedAt timestamps when present in stored state', async () => {
    const analyzer = new BrownfieldAnalyzer(tempDir);
    const stateDir = path.join(tempDir, '.agilai');
    const stateFile = path.join(stateDir, 'state.json');
    const storedState = {
      phase: 'analyst',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    await fs.ensureDir(stateDir);
    await fs.writeJson(stateFile, storedState);

    const result = await analyzer.detectPreviousState();

    expect(result.exists).toBe(true);
    expect(result.state).toEqual(storedState);
    expect(result.lastUpdated).toBe(storedState.updatedAt);
  });

  it('falls back to legacy lastUpdated timestamps when updatedAt is absent', async () => {
    const analyzer = new BrownfieldAnalyzer(tempDir);
    const stateDir = path.join(tempDir, '.agilai');
    const stateFile = path.join(stateDir, 'state.json');
    const storedState = {
      phase: 'strategist',
      lastUpdated: '2023-12-31T23:59:59.000Z',
    };

    await fs.ensureDir(stateDir);
    await fs.writeJson(stateFile, storedState);

    const result = await analyzer.detectPreviousState();

    expect(result.exists).toBe(true);
    expect(result.state).toEqual(storedState);
    expect(result.lastUpdated).toBe(storedState.lastUpdated);
  });
});
