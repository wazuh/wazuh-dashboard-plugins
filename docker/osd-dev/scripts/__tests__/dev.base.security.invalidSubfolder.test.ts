import fs from 'fs';
import path from 'path';
import os from 'os';
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
import { ValidationError } from '../src/errors';

describe('dev.ts - --base rejects -r security=.../plugins/... paths', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-sec-subfolder-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    clearRepoDerivedEnv();
    setCurrentRepoEnv(repoRoot);

    // Create a sibling root with dashboard for --base
    siblingRoot = createSiblingRootUnder(tmpdir);

    dashboardBase = path.join(siblingRoot, 'wazuh-dashboard');
    fs.mkdirSync(dashboardBase, { recursive: true });
    fs.writeFileSync(path.join(dashboardBase, '.nvmrc'), '18.17.0\n');
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('throws ValidationError when -r path points to plugin subfolder', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    // Prepare a fake subfolder path that exists (so accessibility passes) but includes /plugins/
    const badRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-bad-'));
    const badPath = path.join(
      badRoot,
      'some-repo',
      'plugins',
      'wazuh-security-dashboards',
    );
    fs.mkdirSync(badPath, { recursive: true });
    // mimic container visibility equals host path in tests
    process.env.SIBLING_REPO_HOST_ROOT = path.dirname(path.dirname(badPath));
    process.env.SIBLING_CONTAINER_ROOT = process.env.SIBLING_REPO_HOST_ROOT;

    await expect(
      mainWithDeps(
        ['--base', '-r', `security=${badPath}`, 'up'],
        { logger, processRunner: runner },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

