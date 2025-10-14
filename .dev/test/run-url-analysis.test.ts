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
  captures: {
    default: {
      domSnapshot: { html: '<div />' },
      accessibilityTree: { role: 'document' },
      cssom: [],
      console: [],
      computedStyles: {},
    },
  },
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
      'Invalid output directory: path traversal detected or empty path',
    );

    expect(analyzeWithMCPMock).not.toHaveBeenCalled();
  });

  it('rejects absolute paths outside project', async () => {
    await expect(runUrlAnalysis(url, '/tmp/evil')).rejects.toThrow(
      'Invalid output directory: path traversal detected or empty path',
    );

    expect(analyzeWithMCPMock).not.toHaveBeenCalled();
  });

  it('rejects complex traversal attempts', async () => {
    await expect(runUrlAnalysis(url, 'foo/../../..')).rejects.toThrow(
      'Invalid output directory: path traversal detected or empty path',
    );

    expect(analyzeWithMCPMock).not.toHaveBeenCalled();
  });

  it('rejects empty or project root path', async () => {
    await expect(runUrlAnalysis(url, '.')).rejects.toThrow(
      'Invalid output directory: path traversal detected or empty path',
    );

    expect(analyzeWithMCPMock).not.toHaveBeenCalled();
  });

  it('rejects paths containing symbolic links', async () => {
    const symlinkDir = path.join(process.cwd(), 'tmp-symlink-test');
    const targetDir = path.join(process.cwd(), 'tmp-symlink-target');

    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.symlink(targetDir, symlinkDir, 'dir');

      await expect(runUrlAnalysis(url, path.join('tmp-symlink-test', 'subdir'))).rejects.toThrow(
        'Invalid output directory: path contains symbolic link',
      );

      expect(analyzeWithMCPMock).not.toHaveBeenCalled();
    } finally {
      await fs.rm(symlinkDir, { recursive: true, force: true });
      await fs.rm(targetDir, { recursive: true, force: true });
    }
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
      capture: {
        domSnapshot: true,
        accessibilityTree: true,
        cssom: true,
        console: true,
        computedStyles: true,
      },
    });

    await expect(fs.stat(expectedEvidenceDir)).resolves.toBeDefined();
    await expect(fs.stat(path.join(resolvedValidOutDir, 'data'))).resolves.toBeDefined();
  });
});
