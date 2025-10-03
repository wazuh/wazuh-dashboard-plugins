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

describe('dev.ts - External repo trailing slash is trimmed', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const siblingRoot = path.resolve(repoRoot, '..');

  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;
  let externalDir: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-ext-ts-'));
    process.chdir(tmpdir);

    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;

    externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-ext-trailing-'));
  });

  afterEach(() => {
    try { fs.rmSync(externalDir, { recursive: true, force: true }); } catch {}
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  test('override device path has no trailing slash', async () => {
    process.argv = ['node', 'dev.ts', '-r', `custom=${externalDir}/`, 'up'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    expect(content).toContain(`device: ${externalDir}`);
    expect(content).not.toContain(`device: ${externalDir}/`);
  });
});

