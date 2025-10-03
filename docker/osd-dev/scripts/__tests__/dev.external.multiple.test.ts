import fs from 'fs';
import os from 'os';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';
import { setupTestEnv, teardownTestEnv, SavedProcessState } from './helpers/setupTests';

describe('dev.ts - Multiple external repos in override', () => {
  let tmpdir: string;
  let external1: string;
  let external2: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-ext-multi-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    external1 = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-external1-'));
    external2 = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-external2-'));
  });

  afterEach(() => {
    try { fs.rmSync(external1, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(external2, { recursive: true, force: true }); } catch {}
    teardownTestEnv(saved);
  });

  test('override contains both volumes and device mappings', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    await mainWithDeps(['-r', `custom1=${external1}`, '-r', `custom2=${external2}`, 'up'], { logger, processRunner: runner });
    await new Promise((r) => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');

    // Services/osd mounts
    expect(content).toContain("- 'custom1:/home/node/kbn/plugins/custom1'");
    expect(content).toContain("- 'custom2:/home/node/kbn/plugins/custom2'");

    // Volumes block with device bindings
    expect(content).toContain('volumes:');
    expect(content).toContain('  custom1:');
    expect(content).toContain(`      device: ${external1}`);
    expect(content).toContain('  custom2:');
    expect(content).toContain(`      device: ${external2}`);
  });
});
