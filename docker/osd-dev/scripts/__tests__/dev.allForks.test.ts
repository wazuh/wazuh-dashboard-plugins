import fs from 'fs';
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

describe('dev.ts - --all-forks auto-discovers sibling repositories', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let pluginAlphaPath: string;
  let pluginBetaPath: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-all-forks-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    clearRepoDerivedEnv();
    setCurrentRepoEnv(repoRoot);

    siblingRoot = createSiblingRootUnder(tmpdir);

    // Two valid plugin repos (have package.json)
    pluginAlphaPath = path.join(siblingRoot, 'plugin-alpha');
    pluginBetaPath = path.join(siblingRoot, 'plugin-beta');
    for (const p of [pluginAlphaPath, pluginBetaPath]) {
      fs.mkdirSync(p, { recursive: true });
      fs.writeFileSync(
        path.join(p, 'package.json'),
        JSON.stringify({ name: path.basename(p) }),
      );
    }

    // A directory without package.json — must be ignored
    const noPackage = path.join(siblingRoot, 'not-a-plugin');
    fs.mkdirSync(noPackage, { recursive: true });

    // wazuh-dashboard with package.json — must be ignored (reserved for --base)
    const wazuhDashboard = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(wazuhDashboard, { recursive: true });
    fs.writeFileSync(
      path.join(wazuhDashboard, 'package.json'),
      JSON.stringify({ name: 'wazuh-dashboard' }),
    );
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('mounts valid sibling repos and ignores excluded / no-package.json dirs', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    await mainWithDeps(['--all-forks', 'up'], { logger, processRunner: runner });
    await new Promise(tick => setImmediate(tick));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);

    const content = fs.readFileSync(overridePath, 'utf-8');

    // Should contain plugin-alpha and plugin-beta
    expect(content).toContain('plugin-alpha');
    expect(content).toContain('plugin-beta');
    expect(content).toContain(pluginAlphaPath);
    expect(content).toContain(pluginBetaPath);

    // Should NOT contain wazuh-dashboard or not-a-plugin
    expect(content).not.toContain('wazuh-dashboard');
    expect(content).not.toContain('not-a-plugin');

    // Compose was called with the override file
    const args: string[] = runner.spawnCalls[0].args;
    expect(args).toContain('dev.override.generated.yml');
  });

  test('does not mount a sibling explicitly added via -r again', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    // plugin-alpha is explicitly added via -r, --all-forks should not duplicate it
    await mainWithDeps(
      ['-r', `plugin-alpha=${pluginAlphaPath}`, '--all-forks', 'up'],
      { logger, processRunner: runner },
    );
    await new Promise(tick => setImmediate(tick));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    const content = fs.readFileSync(overridePath, 'utf-8');

    // plugin-alpha appears exactly once as a volume device
    const matches = content.split(pluginAlphaPath).length - 1;
    expect(matches).toBe(1);
  });

  test('logs discovered repositories', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    const logSpy = jest.spyOn(logger, 'info');

    await mainWithDeps(['--all-forks', 'up'], { logger, processRunner: runner });
    await new Promise(tick => setImmediate(tick));

    const logs = logSpy.mock.calls.map(call => String(call[0]));
    expect(logs.some(line => line.includes('--all-forks'))).toBe(true);
    logSpy.mockRestore();
  });
});
