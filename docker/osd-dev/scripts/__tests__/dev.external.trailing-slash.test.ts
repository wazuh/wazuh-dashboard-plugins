import fs from 'fs';
import os from 'os';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';
import { setupTestEnv, teardownTestEnv, SavedProcessState } from './helpers/setupTests';

describe('dev.ts - External repo trailing slash is trimmed', () => {
  let tmpdir: string;
  let externalDir: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-ext-ts-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-ext-trailing-'));
  });

  afterEach(() => {
    try { fs.rmSync(externalDir, { recursive: true, force: true }); } catch {}
    teardownTestEnv(saved);
  });

  test('override device path has no trailing slash', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    await mainWithDeps(['-r', `custom=${externalDir}/`, 'up'], { logger, processRunner: runner });
    await new Promise((r) => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    expect(content).toContain(`device: ${externalDir}`);
    expect(content).not.toContain(`device: ${externalDir}/`);
  });
});
