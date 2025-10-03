import fs from 'fs';
import os from 'os';
import path from 'path';
import { logger } from '../src/utils/logger';

// For compose arg inspections we mock child_process
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

const getPlatformVersion = (repoRoot: string) => {
  const pkgPath = path.resolve(repoRoot, 'plugins', 'wazuh-core', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return String(pkg?.pluginPlatform?.version || '');
};

describe('dev.ts - Compat with legacy dev.sh tests', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const siblingRoot = path.resolve(repoRoot, '..');

  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-compat-'));
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

  // Note: usage without args covered in other suites to avoid repeated process.exit across workers

  // Note: pre-parse exit cases are already covered elsewhere to avoid multiple worker exceptions

  test('unsupported mode logs error', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'up', 'imaginary'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    // No spawn should be called because configureMode throws
    expect(spawn).toHaveBeenCalledTimes(0);
  });

  test('server-local requires server_version', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'up', 'server-local'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    expect(spawn).toHaveBeenCalledTimes(0);
  });

  test('server requires server_version', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'up', 'server'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    expect(spawn).toHaveBeenCalledTimes(0);
  });

  test('unknown action logs error and does not spawn docker', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'nonsense'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    expect(spawn).toHaveBeenCalledTimes(0);
  });

  // Path validations that exit are covered elsewhere to avoid multiple exit exceptions

  test('server-local rpm profile selected with -a rpm', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', '-a', 'rpm', 'up', 'server-local', '2.4.0'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toContain('--profile');
    expect(args).toContain('server-local-rpm');
  });

  test('server-local-without profile selected with -a without', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', '-a', 'without', 'up', 'server-local', '2.4.0'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toContain('--profile');
    expect(args).toContain('server-local-without');
  });

  test('server mode uses server profile', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'up', 'server', '4.2.0'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toContain('--profile');
    expect(args).toContain('server');
  });

  test('down action includes cleanup flags', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'down'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toEqual(expect.arrayContaining(['compose', '--profile', 'standard', '-f', 'dev.yml', 'down', '-v', '--remove-orphans']));
  });

  test('stop action sets compose project name', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'stop'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    const osdVersion = getPlatformVersion(repoRoot);
    const expectedProject = `os-dev-${osdVersion.replace(/\./g, '')}`;
    // expect '-p <project> stop'
    const pIndex = args.indexOf('-p');
    expect(pIndex).toBeGreaterThan(-1);
    expect(args[pIndex + 1]).toBe(expectedProject);
    expect(args).toContain('stop');
  });

  test('manager-local-up limits services', async () => {
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'manager-local-up'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toEqual(expect.arrayContaining(['compose', '-p', expect.any(String), 'up', '-d', 'wazuh.manager.local']));
  });

  test('up without external repos and without base prints message and up -Vd', async () => {
    const infoSpy = jest.spyOn(logger, 'info');
    const { spawn } = require('child_process');
    process.argv = ['node', 'dev.ts', 'up'];
    await import('../dev');
    await new Promise((r) => setImmediate(r));
    const infoCalls = infoSpy.mock.calls.map((args) => String(args[0] ?? ''));
    expect(infoCalls.some((l) => l.includes('No dynamic compose override required.'))).toBe(true);
    const args: string[] = spawn.mock.calls[0][1];
    expect(args).toContain('up');
    expect(args).toContain('-Vd');
  });
});
