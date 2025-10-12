const path = require('node:path');

describe('analyzeWithMCP', () => {
  const modulePath = path.resolve(__dirname, '../../packages/mcp-inspector/src/index.ts');

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('returns structured tool inventory', async () => {
    const listToolsMock = jest.fn().mockResolvedValue({
      tools: [
        {
          name: 'vibe_check',
          description: 'Evaluate tone of the provided copy.',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              audience: { enum: ['executive', 'founder', 'investor'] },
              temperature: { type: 'number' },
            },
            required: ['text'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              verdict: { enum: ['positive', 'neutral', 'negative'] },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['score', 'verdict'],
          },
        },
      ],
    });

    const connectMock = jest.fn().mockResolvedValue(undefined);
    const getServerVersionMock = jest.fn().mockReturnValue({ name: 'vibe-check-mcp-server', version: '1.2.3' });

    jest.doMock('@modelcontextprotocol/sdk/client', () => ({
      Client: jest.fn().mockImplementation(() => ({
        connect: connectMock,
        listTools: listToolsMock,
        getServerVersion: getServerVersionMock,
      })),
    }));

    const closeMock = jest.fn().mockResolvedValue(undefined);
    jest.doMock('@modelcontextprotocol/sdk/client/websocket', () => ({
      WebSocketClientTransport: jest.fn().mockImplementation(() => ({
        close: closeMock,
      })),
    }));

    const { analyzeWithMCP } = require(modulePath);

    const result = await analyzeWithMCP({ url: 'wss://vibe-check.example/mcp' });

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(listToolsMock).toHaveBeenCalledTimes(1);
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(result.errors).toEqual([]);
    expect(result.server).toEqual({ name: 'vibe-check-mcp-server', version: '1.2.3' });
    expect(result.tools).toEqual([
      {
        name: 'vibe_check',
        description: 'Evaluate tone of the provided copy.',
        signature:
          'vibe_check({ text: string; audience?: "executive" | "founder" | "investor"; temperature?: number }) => { score: number; verdict: "positive" | "neutral" | "negative"; suggestions?: Array<string> }',
      },
    ]);
  });

  test('records connection failures and returns empty inventory', async () => {
    const error = new Error('dial tcp refused');
    const connectMock = jest.fn().mockRejectedValue(error);

    jest.doMock('@modelcontextprotocol/sdk/client', () => ({
      Client: jest.fn().mockImplementation(() => ({
        connect: connectMock,
        listTools: jest.fn(),
        getServerVersion: jest.fn(),
      })),
    }));

    const closeMock = jest.fn().mockResolvedValue(undefined);
    jest.doMock('@modelcontextprotocol/sdk/client/websocket', () => ({
      WebSocketClientTransport: jest.fn().mockImplementation(() => ({
        close: closeMock,
      })),
    }));

    const { analyzeWithMCP } = require(modulePath);

    const result = await analyzeWithMCP({ url: 'wss://offline.example/mcp' });

    expect(result.tools).toEqual([]);
    expect(result.errors).toEqual([{ stage: 'connect', message: 'dial tcp refused' }]);
    expect(closeMock).not.toHaveBeenCalled();
  });
});
