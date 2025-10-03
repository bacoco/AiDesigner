const path = require('node:path');

const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args) => mockSpawn(...args),
}));

const cli = require('../bin/bmad-invisible');

const fs = require('node:fs');

describe('bmad-invisible start assistant selection', () => {
  const originalInit = cli.commands.init;
  let exitSpy;
  let existsSpy;
  let originalIsTTY;

  beforeEach(() => {
    mockSpawn.mockReset();
    mockSpawn.mockImplementation(() => ({
      on: jest.fn((event, handler) => {
        if (event === 'exit') {
          handler(0);
        }
        return;
      }),
    }));

    cli.commands.init = jest.fn().mockResolvedValue();
    existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    cli.commands.init = originalInit;
    existsSpy.mockRestore();
    exitSpy.mockRestore();
    process.stdout.isTTY = originalIsTTY;
  });

  test('defaults to Codex when no assistant flag is provided', async () => {
    process.stdout.isTTY = false;
    cli.setRuntimeContext('start', []);

    await cli.commands.start();

    expect(mockSpawn).toHaveBeenCalled();
    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('node');
    expect(lastCall[1][0]).toContain(path.join('bin', 'bmad-codex'));
    expect(lastCall[1].some((arg) => arg.includes('--assistant'))).toBe(false);
  });

  test('launches Claude chat when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=claude']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('node');
    expect(lastCall[1][0]).toContain(path.join('bin', 'bmad-chat'));
    expect(lastCall[1].some((arg) => arg.includes('--assistant'))).toBe(false);
  });

  test('launches OpenCode when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=opencode']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('opencode');
    expect(lastCall[1]).toEqual([]);
    expect(lastCall[2].shell).toBe(true);
  });
});
