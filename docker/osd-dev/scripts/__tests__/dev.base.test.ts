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
  repoRoot,
  clearRepoDerivedEnv,
  setCurrentRepoEnv,
  createSiblingRootUnder,
} from './helpers/setupTests';
import {
  setupTestEnv,
  teardownTestEnv,
  SavedProcessState,
  repoRoot,
} from './helpers/setupTests';

describe('dev.ts - Base startup with auto-detection (--base)', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let securityPluginPath: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-base-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    clearRepoDerivedEnv();
    setCurrentRepoEnv(repoRoot);

    // Create a sibling root in tmp dir, with a wazuh-dashboard checkout
    siblingRoot = createSiblingRootUnder(tmpdir);

    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(dashboardBase, { recursive: true });
    // Provide .nvmrc to derive NODE_VERSION
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');

    // Provide security plugin as sibling alias (auto-discovery source)
    securityPluginPath = path.join(siblingRoot, 'wazuh-security-dashboards-plugin');
    fs.mkdirSync(securityPluginPath, { recursive: true });
    fs.writeFileSync(
      path.join(securityPluginPath, 'package.json'),
      '{"name":"wazuh-security-dashboards"}',
    );
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('auto-detects dashboard base, sets NODE_VERSION, generates override and enforces dashboard-src profile', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    const logSpy = jest.spyOn(logger, 'info');

    // Run up with --base auto-detection (no path provided)
    await mainWithDeps(['--base', 'up'], { logger, processRunner: runner });
    await new Promise(tick => setImmediate(tick));

    // Validations
    expect(process.env.SRC_DASHBOARD).toBe(dashboardBase);
    expect(process.env.NODE_VERSION).toBe('18.17.0');
    expect(process.env.SRC_SECURITY_PLUGIN).toBe(securityPluginPath);

    // Log includes base usage message
    const logs = logSpy.mock.calls.map(call => String(call[0]));
    expect(
      logs.some(line =>
        line.includes(`Using wazuh-dashboard sources from ${dashboardBase}`),
      ),
    ).toBe(true);

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    const expected = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'override_base.yml'),
      'utf-8',
    );
    expect(content.trim()).toBe(expected.trim());

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
    await mainWithDeps(['down'], { logger, processRunner: runner });
    await new Promise(tick => setImmediate(tick));
    expect(fs.existsSync(overridePath)).toBe(false);
    logSpy.mockRestore();
  });
});
