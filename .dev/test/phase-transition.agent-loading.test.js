const path = require('node:path');

jest.mock('../hooks/context-enrichment', () => ({}), { virtual: true });

const { AidesignerBridge } = require('../lib/aidesigner-bridge.js');

describe('phase transition legacy agent loading', () => {
  test('phase-detector agent resolves from fallback search path', async () => {
    const bridge = new AidesignerBridge({ llmClient: { chat: jest.fn() } });

    await bridge.initialize();

    expect(bridge.getEnvironmentInfo().mode).toBe('legacy-core');

    const agent = await bridge.loadAgent('phase-detector');
    const packageRoot = path.resolve(__dirname, '..', '..');

    expect(agent.id).toBe('phase-detector');
    expect(agent.path).toBe(path.join(packageRoot, 'agents', 'phase-detector.md'));
    expect(agent.content).toContain('Phase Detector');
  });
});
