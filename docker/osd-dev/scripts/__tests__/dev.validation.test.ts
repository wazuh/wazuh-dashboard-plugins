import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock child_process to avoid any docker execution when validation passes unexpectedly
jest.mock('child_process', () => ({
  execSync: jest.fn(() => undefined),
  spawn: jest.fn(() => {
    const { EventEmitter } = require('events');
    const ee = new EventEmitter();
    process.nextTick(() => ee.emit('close', 0));
    return ee as any;
  }),
}));

describe('dev.ts - Input validations', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const siblingRoot = path.resolve(repoRoot, '..');

  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  beforeEach(() => {
    jest.resetModules();
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-val-'));
    process.chdir(tmpdir);

    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    jest.restoreAllMocks();
  });

  test("'-r invalid' fails with Invalid repository specification", async () => {
    const { logger } = require('../src/utils/logger');
    const errSpy = jest.spyOn(logger, 'error');
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT ${code}`);
      }) as any);

    process.argv = ['node', 'dev.ts', '-r', 'invalid', 'up'];

    await expect(import('../dev')).rejects.toThrow(/EXIT 1/);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errSpy).toHaveBeenCalled();
    const msg = String(errSpy.mock.calls[0]?.[0] ?? '');
    expect(msg).toContain("Invalid repository specification 'invalid'. Expected format repo=/absolute/path.");
  });
});
