import fs from 'fs';
import os from 'os';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';

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
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    await expect(
      mainWithDeps(['-r', 'invalid', 'up'], { logger, processRunner: runner })
    ).rejects.toThrow(/Invalid repository specification 'invalid'. Expected format repo=\/absolute\/path\./);

    // No docker compose attempt should be made
    expect(runner.spawnCalls.length).toBe(0);
  });
});
