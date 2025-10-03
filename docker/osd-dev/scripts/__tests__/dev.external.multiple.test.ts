import fs from 'fs';
import os from 'os';
import path from 'path';

// Avoid real docker; simulate successful compose
jest.mock('child_process', () => {
  const events = require('events');
  return {
    execSync: jest.fn(() => undefined),
    spawn: jest.fn(() => {
      const ee = new events.EventEmitter();
      process.nextTick(() => ee.emit('close', 0));
      return ee as any;
    }),
  };
});

describe('dev.ts - Multiple external repos in override', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const siblingRoot = path.resolve(repoRoot, '..');

  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;
  let external1: string;
  let external2: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-ext-multi-'));
    process.chdir(tmpdir);

    // Map current/sibling repo for path translation
    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;

    external1 = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-external1-'));
    external2 = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-external2-'));
  });

  afterEach(() => {
    try { fs.rmSync(external1, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(external2, { recursive: true, force: true }); } catch {}
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  test('override contains both volumes and device mappings', async () => {
    process.argv = ['node', 'dev.ts', '-r', `custom1=${external1}`, '-r', `custom2=${external2}`, 'up'];

    await import('../dev');
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

