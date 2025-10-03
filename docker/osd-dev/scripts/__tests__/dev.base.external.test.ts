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

describe('dev.ts - Base mode + external repo dynamic volumes', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let securityPluginPath: string;
  let externalRepo: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-base-ext-'));
    process.chdir(tmpdir);

    // Map current repo
    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;

    // Create sibling root + dashboard checkout for autodetect
    siblingRoot = path.join(tmpdir, 'sibling-root');
    fs.mkdirSync(siblingRoot, { recursive: true });
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;

    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(dashboardBase, { recursive: true });
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');

    // Provide security plugin inside dashboard base
    securityPluginPath = path.join(dashboardBase, 'plugins', 'wazuh-security-dashboards');
    fs.mkdirSync(securityPluginPath, { recursive: true });
    fs.writeFileSync(path.join(securityPluginPath, 'package.json'), '{"name":"wazuh-security-dashboards"}');

    // External repo path can be anywhere, validation is skipped for non-required repos
    externalRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-ext-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    try { fs.rmSync(externalRepo, { recursive: true, force: true }); } catch {}
  });

  test('generates override with external volume, includes dashboard-src profile, and removes override on down', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { spawn } = require('child_process');

    // Up with base autodetect and one external repo
    process.argv = ['node', 'dev.ts', '-base', '-r', `external-test=${externalRepo}`, 'up'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');

    // services include osd and dashboard-src-installer
    expect(content).toContain('services:');
    expect(content).toContain('dashboard-src-installer:');
    expect(content).toMatch(/\n\s*osd:\n/);

    // external-test mounted under osd service and declared under volumes with device
    expect(content).toContain("- 'external-test:/home/node/kbn/plugins/external-test'");
    expect(content).toContain('volumes:');
    expect(content).toContain('  external-test:');
    expect(content).toContain(`      device: ${externalRepo}`);

    // dashboard-src profile enforced
    expect(spawn).toHaveBeenCalledTimes(1);
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toContain('--profile');
    expect(args).toContain('dashboard-src');
    expect(args).toContain('-f');
    expect(args).toContain('dev.override.generated.yml');

    // Logs show base sources path
    const logs = logSpy.mock.calls.map((c) => String(c[0]));
    expect(logs.some((l) => l.includes(`[INFO] Using wazuh-dashboard sources from ${dashboardBase}`))).toBe(true);

    // Down cleans override
    jest.resetModules();
    process.argv = ['node', 'dev.ts', 'down'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    expect(fs.existsSync(overridePath)).toBe(false);

    logSpy.mockRestore();
  });
});
