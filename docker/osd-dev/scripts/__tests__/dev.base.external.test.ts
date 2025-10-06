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
  createSiblingRootUnder,
  setCurrentRepoEnv,
} from './helpers/setupTests';

describe('dev.ts - Base mode + external repo dynamic volumes', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let securityPluginPath: string;
  let externalRepo: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-base-ext-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    // Ensure clean derived env and map current repo
    clearRepoDerivedEnv();
    setCurrentRepoEnv(repoRoot);

    // Create sibling root + dashboard checkout for autodetect
    siblingRoot = createSiblingRootUnder(tmpdir);

    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(dashboardBase, { recursive: true });
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');

    // Provide security plugin inside dashboard base
    securityPluginPath = path.join(
      dashboardBase,
      'plugins',
      'wazuh-security-dashboards',
    );
    fs.mkdirSync(securityPluginPath, { recursive: true });
    fs.writeFileSync(
      path.join(securityPluginPath, 'package.json'),
      '{"name":"wazuh-security-dashboards"}',
    );

    // External repo path can be anywhere, validation is skipped for non-required repos
    externalRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-ext-'));
  });

  afterEach(() => {
    teardownTestEnv(saved);
    try {
      fs.rmSync(externalRepo, { recursive: true, force: true });
    } catch {}
  });

  test('generates override with external volume, includes dashboard-src profile, and removes override on down', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    const logSpy = jest.spyOn(logger, 'info');

    await mainWithDeps(
      ['--base', '-r', `external-test=${externalRepo}`, 'up'],
      {
        logger,
        processRunner: runner,
      },
    );
    await new Promise(tick => setImmediate(tick));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    const normalized = content.replaceAll(externalRepo, '${externalRepo}');
    const expected = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'override_base_external.yml'),
      'utf-8',
    );
    expect(normalized.trim()).toBe(expected.trim());

    // dashboard-src profile enforced
    expect(runner.spawnCalls.length).toBe(1);
    const args: string[] = runner.spawnCalls[0].args;
    expect(args).toContain('--profile');
    expect(args).toContain('dashboard-src');
    expect(args).toContain('-f');
    expect(args).toContain('dev.override.generated.yml');

    // Logs show base sources path
    const logs = logSpy.mock.calls.map(call => String(call[0]));
    expect(
      logs.some(line =>
        line.includes(`Using wazuh-dashboard sources from ${dashboardBase}`),
      ),
    ).toBe(true);

    // Down cleans override
    await mainWithDeps(['down'], { logger, processRunner: runner });
    await new Promise(tick => setImmediate(tick));
    expect(fs.existsSync(overridePath)).toBe(false);
    logSpy.mockRestore();
  });
});
