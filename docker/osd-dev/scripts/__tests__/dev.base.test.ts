import fs from 'fs';
import os from 'os';
import path from 'path';
import { main } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';

describe('dev.ts - Base startup with auto-detection (-base)', () => {
  const repoRoot = path.resolve(__dirname, '../../../..');
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  const originalArgv = [...process.argv];

  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let securityPluginPath: string;

  beforeEach(() => {
    jest.resetModules();
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-jest-base-'));
    process.chdir(tmpdir);

    // Use repo root mapping for current repo (to find entrypoint under docker/osd-dev/dashboard-src)
    process.env.WDP_CONTAINER_ROOT = repoRoot;
    process.env.CURRENT_REPO_HOST_ROOT = repoRoot;

    // Create a sibling root in tmp dir, with a wazuh-dashboard checkout
    siblingRoot = path.join(tmpdir, 'sibling-root');
    fs.mkdirSync(siblingRoot, { recursive: true });
    process.env.SIBLING_REPO_HOST_ROOT = siblingRoot;
    process.env.SIBLING_CONTAINER_ROOT = siblingRoot;

    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(dashboardBase, { recursive: true });
    // Provide .nvmrc to derive NODE_VERSION
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');

    // Provide security plugin inside dashboard base
    securityPluginPath = path.join(dashboardBase, 'plugins', 'wazuh-security-dashboards');
    fs.mkdirSync(securityPluginPath, { recursive: true });
    fs.writeFileSync(path.join(securityPluginPath, 'package.json'), '{"name":"wazuh-security-dashboards"}');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  test('auto-detects dashboard base, sets NODE_VERSION, generates override and enforces dashboard-src profile', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    const logSpy = jest.spyOn(logger, 'info');

    // Run up with -base auto-detection (no path provided)
    await main(['-base', 'up'], { logger, processRunner: runner });
    await new Promise((r) => setImmediate(r));

    // Validations
    expect(process.env.SRC_DASHBOARD).toBe(dashboardBase);
    expect(process.env.NODE_VERSION).toBe('18.17.0');
    expect(process.env.SRC_SECURITY_PLUGIN).toBe(securityPluginPath);

    // Log includes base usage message
    const logs = logSpy.mock.calls.map((c) => String(c[0]));
    expect(logs.some((l) => l.includes(`Using wazuh-dashboard sources from ${dashboardBase}`))).toBe(true);

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');

    // Override contains dashboard-src-installer service and mounts
    expect(content).toContain('dashboard-src-installer:');
    expect(content).toContain("image: node:${NODE_VERSION}");
    expect(content).toContain("- '${SRC_DASHBOARD}:/home/node/kbn'");
    expect(content).toContain("- '${SRC_SECURITY_PLUGIN}:/home/node/kbn/plugins/wazuh-security-dashboards'");
    expect(content).toContain("- ./dashboard-src/entrypoint.sh:/entrypoint.sh:ro");

    // docker compose gets both profiles: standard and dashboard-src, and includes override file
    expect(runner.spawnCalls.length).toBe(1);
    const args: string[] = runner.spawnCalls[0].args;
    expect(args[0]).toBe('compose');
    expect(args).toContain('--profile');
    expect(args).toContain('standard');
    expect(args).toContain('dashboard-src');
    expect(args).toContain('-f');
    expect(args).toContain('dev.yml');
    expect(args).toContain('dev.override.generated.yml');
    expect(args).toContain('up');

    // Now run down and ensure the override is removed
    await main(['down'], { logger, processRunner: runner });
    await new Promise((r) => setImmediate(r));
    expect(fs.existsSync(overridePath)).toBe(false);
    logSpy.mockRestore();
  });
});
