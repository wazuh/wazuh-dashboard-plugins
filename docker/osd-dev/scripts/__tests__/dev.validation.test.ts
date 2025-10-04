import fs from 'fs';
import os from 'os';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';
import {
  setupTestEnv,
  teardownTestEnv,
  SavedProcessState,
} from './helpers/setupTests';

describe('dev.ts - Input validations', () => {
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-val-' });
    saved = ctx.saved;
  });

  afterEach(() => {
    teardownTestEnv(saved);
    jest.restoreAllMocks();
  });

  test("'-r invalid' fails when shorthand cannot be resolved under sibling", async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    await expect(
      mainWithDeps(['-r', 'invalid', 'up'], { logger, processRunner: runner }),
    ).rejects.toThrow();

    // No docker compose attempt should be made
    expect(runner.spawnCalls.length).toBe(0);
  });
});
