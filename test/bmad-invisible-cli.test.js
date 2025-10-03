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

  test('errors in non-TTY mode when no assistant flag is provided', async () => {
    process.stdout.isTTY = false;
    cli.setRuntimeContext('start', []);

    await cli.commands.start();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('launches Claude chat when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=claude']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('node');
    expect(lastCall[1][0]).toContain(path.join('bin', 'bmad-claude'));
    expect(lastCall[1].some((arg) => arg.includes('--assistant'))).toBe(false);
  });

  test('launches OpenCode when requested via flag', async () => {
    cli.setRuntimeContext('start', ['--assistant=opencode']);

    await cli.commands.start();

    const lastCall = mockSpawn.mock.calls.at(-1);
    expect(lastCall[0]).toBe('opencode');
    expect(lastCall[1]).toEqual([]);
    expect(lastCall[2].shell).toBe(false);
    expect(lastCall[2].env).toBeDefined();
  });

  test('handles invalid assistant flag by exiting with error', async () => {
    process.stdout.isTTY = false;
    cli.setRuntimeContext('start', ['--assistant=invalid']);

    await cli.commands.start();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  test('handles spawn error for Codex', async () => {
    const mockErrorSpawn = jest.fn(() => {
      const emitter = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('spawn ENOENT'));
          }
          return emitter;
        }),
      };
      return emitter;
    });

    jest.isolateModules(() => {
      jest.doMock('child_process', () => ({
        spawn: mockErrorSpawn,
      }));

      const cliWithError = require('../bin/bmad-invisible');
      cli.setRuntimeContext('codex', []);

      expect(() => cliWithError.commands.codex()).not.toThrow();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  test('handles spawn error for OpenCode', async () => {
    const mockErrorSpawn = jest.fn(() => {
      const emitter = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('spawn ENOENT'));
          }
          return emitter;
        }),
      };
      return emitter;
    });

    jest.isolateModules(() => {
      jest.doMock('child_process', () => ({
        spawn: mockErrorSpawn,
      }));

      const cliWithError = require('../bin/bmad-invisible');
      cli.setRuntimeContext('opencode', []);

      expect(() => cliWithError.commands.opencode()).not.toThrow();
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
