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

describe('dev.ts - Dynamic mounting of external repos', () => {
  let tmpdir: string;
  let extRepoPath: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-ext-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    // Prepare a fake external repository outside allowed roots to ensure validation is skipped
    extRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-external-'));
    fs.mkdirSync(extRepoPath, { recursive: true });
  });

  afterEach(() => {
    // Cleanup created directory
    try {
      fs.rmSync(extRepoPath, { recursive: true, force: true });
    } catch {}
    teardownTestEnv(saved);
  });

  test('generates override with external volume and removes it on down', async () => {
    // 1) Run up with external repo
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    await mainWithDeps(['-r', `external-test=${extRepoPath}`, 'up'], {
      logger,
      processRunner: runner,
    });
    await new Promise(r => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    const normalized = content.replaceAll(extRepoPath, '${extRepoPath}');
    const expected = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'override_external_single.yml'),
      'utf-8',
    );
    expect(normalized.trim()).toBe(expected.trim());

    // 4) Run down without flags and verify the override file is removed
    await mainWithDeps(['down'], { logger, processRunner: runner });
    await new Promise(r => setImmediate(r));

    expect(fs.existsSync(overridePath)).toBe(false);
  });
});
