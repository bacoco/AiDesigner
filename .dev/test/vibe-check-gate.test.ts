import { runVibeCheckGate } from '../src/mcp-server/vibe-check-gate';

describe('runVibeCheckGate', () => {
  const originalEnabled = process.env.AIDESIGNER_VIBE_CHECK_ENABLED;
  const originalMinScore = process.env.AIDESIGNER_VIBE_CHECK_MIN_SCORE;

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.AIDESIGNER_VIBE_CHECK_ENABLED;
    } else {
      process.env.AIDESIGNER_VIBE_CHECK_ENABLED = originalEnabled;
    }

    if (originalMinScore === undefined) {
      delete process.env.AIDESIGNER_VIBE_CHECK_MIN_SCORE;
    } else {
      process.env.AIDESIGNER_VIBE_CHECK_MIN_SCORE = originalMinScore;
    }
  });

  const logger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    recordTiming: jest.fn(),
  });

  test('passes when Vibe Check returns score above threshold', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'true';
    const recordDecision = jest.fn();
    const projectState = {
      getAllDeliverables: () => ({
        pm: {
          prd: { content: '# Product Vision\nEnergetic copy to inspire customers.' },
        },
      }),
      recordDecision,
    };

    const connect = jest.fn().mockResolvedValue(undefined);
    const callTool = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'json',
          data: { score: 0.82, verdict: 'positive', suggestions: ['Keep the confident tone.'] },
        },
      ],
    });
    const close = jest.fn().mockResolvedValue(undefined);
    const transportClose = jest.fn().mockResolvedValue(undefined);
    const getServerVersion = jest.fn().mockReturnValue({ name: 'vibe-check-mcp-server', version: '1.0.0' });

    const result = await runVibeCheckGate({
      projectState,
      logger: logger(),
      minScore: 0.7,
      clientFactory: () => ({
        client: { connect, callTool, close, getServerVersion },
        transport: { close: transportClose },
      }),
    });

    expect(result).toMatchObject({ passed: true, score: 0.82, verdict: 'positive' });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(callTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'vibe_check',
        arguments: expect.objectContaining({ text: expect.stringContaining('Energetic copy') }),
      }),
    );
    expect(recordDecision).toHaveBeenCalledWith(
      'vibe_check',
      'pass',
      expect.stringContaining('score=0.82'),
    );
  });

  test('throws when score is below threshold', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'true';
    const recordDecision = jest.fn();
    const projectState = {
      getAllDeliverables: () => ({
        pm: {
          prd: { content: 'Cautious copy that lacks energy.' },
        },
      }),
      recordDecision,
    };

    const connect = jest.fn().mockResolvedValue(undefined);
    const callTool = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'json',
          data: { score: 0.42, verdict: 'neutral', suggestions: ['Increase confidence.'] },
        },
      ],
    });
    const close = jest.fn().mockResolvedValue(undefined);
    const transportClose = jest.fn().mockResolvedValue(undefined);
    const getServerVersion = jest.fn().mockReturnValue({ name: 'vibe-check-mcp-server', version: '1.0.0' });

    await expect(
      runVibeCheckGate({
        projectState,
        logger: logger(),
        minScore: 0.7,
        clientFactory: () => ({
          client: { connect, callTool, close, getServerVersion },
          transport: { close: transportClose },
        }),
      }),
    ).rejects.toThrow(/Vibe Check gate failed/);

    expect(recordDecision).toHaveBeenCalledWith(
      'vibe_check',
      'neutral',
      expect.stringContaining('score=0.42'),
    );
  });

  test('throws when no copy is available', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'true';
    const projectState = {
      getAllDeliverables: () => ({}),
      recordDecision: jest.fn(),
    };

    await expect(
      runVibeCheckGate({
        projectState,
        logger: logger(),
        clientFactory: () => {
          throw new Error('clientFactory should not be called when no copy exists');
        },
      }),
    ).rejects.toThrow(/could not find copy/);
  });

  test('skips when gate is disabled', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'false';
    const mockLogger = logger();
    const projectState = {
      getAllDeliverables: () => ({
        pm: { prd: { content: 'Some copy' } },
      }),
      recordDecision: jest.fn(),
    };

    const result = await runVibeCheckGate({
      projectState,
      logger: mockLogger,
      clientFactory: () => {
        throw new Error('clientFactory should not be called when disabled');
      },
    });

    expect(result).toMatchObject({ passed: true, raw: { skipped: true } });
    expect(mockLogger.warn).toHaveBeenCalledWith('vibe_check_skipped', { reason: 'disabled' });
  });

  test('fails when verdict is negative even with high score', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'true';
    const recordDecision = jest.fn();
    const projectState = {
      getAllDeliverables: () => ({
        pm: {
          prd: { content: 'Copy with negative sentiment.' },
        },
      }),
      recordDecision,
    };

    const connect = jest.fn().mockResolvedValue(undefined);
    const callTool = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'json',
          data: { score: 0.85, verdict: 'negative', suggestions: ['Reconsider the tone.'] },
        },
      ],
    });
    const close = jest.fn().mockResolvedValue(undefined);
    const transportClose = jest.fn().mockResolvedValue(undefined);
    const getServerVersion = jest.fn().mockReturnValue({ name: 'vibe-check-mcp-server', version: '1.0.0' });

    await expect(
      runVibeCheckGate({
        projectState,
        logger: logger(),
        minScore: 0.7,
        clientFactory: () => ({
          client: { connect, callTool, close, getServerVersion },
          transport: { close: transportClose },
        }),
      }),
    ).rejects.toThrow(/Vibe Check gate failed/);

    expect(recordDecision).toHaveBeenCalledWith(
      'vibe_check',
      'negative',
      expect.stringContaining('score=0.85'),
    );
  });

  test('throws when score is missing from response', async () => {
    process.env.AIDESIGNER_VIBE_CHECK_ENABLED = 'true';
    const projectState = {
      getAllDeliverables: () => ({
        pm: {
          prd: { content: 'Some copy.' },
        },
      }),
      recordDecision: jest.fn(),
    };

    const connect = jest.fn().mockResolvedValue(undefined);
    const callTool = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'json',
          data: { verdict: 'positive' }, // missing score
        },
      ],
    });
    const close = jest.fn().mockResolvedValue(undefined);
    const transportClose = jest.fn().mockResolvedValue(undefined);
    const getServerVersion = jest.fn().mockReturnValue({ name: 'vibe-check-mcp-server', version: '1.0.0' });

    await expect(
      runVibeCheckGate({
        projectState,
        logger: logger(),
        clientFactory: () => ({
          client: { connect, callTool, close, getServerVersion },
          transport: { close: transportClose },
        }),
      }),
    ).rejects.toThrow(/did not include a numeric score/);
  });
});
