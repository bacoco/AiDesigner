import fs from 'node:fs/promises';
import path from 'node:path';

jest.mock('../../packages/mcp-inspector/src', () => ({
  analyzeWithMCP: jest.fn(),
}));

jest.mock('../../packages/inference/src/tokens', () => ({
  inferTokens: jest.fn(),
}));

jest.mock('../../packages/inference/src/components', () => ({
  detectComponents: jest.fn(),
}));

import { analyzeWithMCP } from '../../packages/mcp-inspector/src';
import { inferTokens } from '../../packages/inference/src/tokens';
import { detectComponents } from '../../packages/inference/src/components';
import { runUrlAnalysis } from '../../apps/aidesigner-poc/src/run-url-analysis';

const analyzeWithMCPMock = analyzeWithMCP as jest.MockedFunction<typeof analyzeWithMCP>;
const inferTokensMock = inferTokens as jest.MockedFunction<typeof inferTokens>;
const detectComponentsMock = detectComponents as jest.MockedFunction<typeof detectComponents>;

const mockAnalysisResult = {
  domSnapshot: { html: '<div />' },
  accessibilityTree: { role: 'document' },
  cssom: [],
  console: [],
};

const mockTokens = { primitives: { color: { primary: '#000000' } } } as const;
const mockComponents = { button: { variant: 'primary' } } as const;

describe('runUrlAnalysis path validation', () => {
  const url = 'https://example.com';
  const validOutDir = 'tmp-run-url-analysis-test';
  const resolvedValidOutDir = path.resolve(process.cwd(), validOutDir);

  beforeEach(async () => {
    analyzeWithMCPMock.mockResolvedValue(mockAnalysisResult);
    inferTokensMock.mockReturnValue(mockTokens);
    detectComponentsMock.mockReturnValue(mockComponents);

    await fs.rm(resolvedValidOutDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await fs.rm(resolvedValidOutDir, { recursive: true, force: true });
  });

  it('rejects output directories that escape the project root', async () => {
    await expect(runUrlAnalysis(url, path.join('..', validOutDir))).rejects.toThrow(
      'Invalid output directory: path traversal detected',
    );

    expect(analyzeWithMCPMock).not.toHaveBeenCalled();
  });

  it('allows output directories within the project root', async () => {
    const result = await runUrlAnalysis(url, validOutDir);
    const expectedEvidenceDir = path.join(resolvedValidOutDir, 'evidence');

    expect(result).toEqual({
      tokens: mockTokens,
      comps: mockComponents,
      evidence: expectedEvidenceDir,
    });
    expect(analyzeWithMCPMock).toHaveBeenCalledWith({
      url,
      states: ['default', 'hover', 'dark', 'md'],
    });

    await expect(fs.stat(expectedEvidenceDir)).resolves.toBeDefined();
    await expect(fs.stat(path.join(resolvedValidOutDir, 'data'))).resolves.toBeDefined();
  });
});
