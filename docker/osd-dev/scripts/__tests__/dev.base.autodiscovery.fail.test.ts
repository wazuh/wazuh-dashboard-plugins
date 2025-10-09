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
import { ConfigurationError } from '../src/errors';

describe('dev.ts - Auto-discovery does not search inside dashboardBase', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-base-auto-fail-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    clearRepoDerivedEnv();
    setCurrentRepoEnv(repoRoot);

    // Sibling root exists but WITHOUT the security repo
    siblingRoot = createSiblingRootUnder(tmpdir);

    // Place dashboard checkout and plugin under dashboardBase only
    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    const pluginDir = path.join(
      dashboardBase,
      'plugins',
      'wazuh-security-dashboards',
    );
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');
    fs.writeFileSync(
      path.join(pluginDir, 'package.json'),
      '{"name":"wazuh-security-dashboards"}',
    );
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('throws when only dashboardBase contains the plugin', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    await expect(
      mainWithDeps(['--base', 'up'], { logger, processRunner: runner }),
    ).rejects.toBeInstanceOf(ConfigurationError);
  });
});
