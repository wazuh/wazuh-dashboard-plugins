import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock child_process before importing the script
jest.mock('child_process', () => {
  const events = require('events');
  return {
    execSync: jest.fn(() => undefined),
    spawn: jest.fn(() => {
      const ee = new events.EventEmitter();
      // Simulate successful docker compose run
      process.nextTick(() => ee.emit('close', 0));
      return ee as any;
    }),
  };
});

const getPluginPlatformVersion = (baseRoot: string) => {
  const pkgPath = path.resolve(baseRoot, 'plugins', 'wazuh-core', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return (pkg?.pluginPlatform?.version as string) || '';
};

describe('dev.ts - Auto-detection without flags', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const siblingRoot = path.resolve(repoRoot, '..');

  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-'));
    process.chdir(tmpdir);

    // Ensure environment variables simulate execution from this repo
    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;
    // Clear potentially set variables from previous runs
    delete process.env.REPO_MAIN;
    delete process.env.REPO_WAZUH_CORE;
    delete process.env.REPO_WAZUH_CHECK_UPDATES;
    delete process.env.COMPOSE_PROJECT_NAME;

    // Simulate CLI invocation: ./dev.sh up
    process.argv = ['node', 'dev.ts', 'up'];
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  test('does not generate override file and sets mounts and compose args', async () => {
    // Import runs main() immediately
    await import('../dev');

    // Allow async close handler to run
    await new Promise((r) => setImmediate(r));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(false);

    // Verify repo env vars for required plugins
    expect(process.env.REPO_MAIN).toBe(path.join(repoRoot, 'plugins', 'main'));
    expect(process.env.REPO_WAZUH_CORE).toBe(path.join(repoRoot, 'plugins', 'wazuh-core'));
    expect(process.env.REPO_WAZUH_CHECK_UPDATES).toBe(path.join(repoRoot, 'plugins', 'wazuh-check-updates'));

    // Verify compose project name derived from OSD version
    const osdVersion = getPluginPlatformVersion(repoRoot);
    const expectedProject = `os-dev-${osdVersion.replace(/\./g, '')}`;
    expect(process.env.COMPOSE_PROJECT_NAME).toBe(expectedProject);

    const { spawn } = require('child_process');
    expect(spawn).toHaveBeenCalledTimes(1);
    const args: string[] = spawn.mock.calls[0][1];

    // docker compose --profile standard -f dev.yml up -Vd
    expect(args[0]).toBe('compose');
    expect(args).toContain('--profile');
    expect(args).toContain('standard');
    expect(args).toContain('-f');
    expect(args).toContain('dev.yml');
    expect(args).toContain('up');
    expect(args).toContain('-Vd');
    // Should not include override file when no external repos and no sources mode
    expect(args).not.toContain('dev.override.generated.yml');
  });
});
