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

describe('dev.ts - --base with -r security alias override (no internal resolution)', () => {
  let tmpdir: string;
  let siblingRoot: string;
  let dashboardBase: string;
  let securityRepoRoot: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-base-sec-ovr-' });
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

    // Provide canonical security repo folder under sibling (package.json at repo root)
    securityRepoRoot = path.join(
      siblingRoot,
      'wazuh-security-dashboards-plugin',
    );
    fs.mkdirSync(securityRepoRoot, { recursive: true });
    fs.writeFileSync(
      path.join(securityRepoRoot, 'package.json'),
      '{"name":"wazuh-security-dashboards"}',
    );
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('sets SRC_SECURITY_PLUGIN to sibling canonical folder when using -r security alias', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    await mainWithDeps(['--base', '-r', 'security', 'up'], {
      logger,
      processRunner: runner,
    });
    await new Promise(tick => setImmediate(tick));

    expect(process.env.SRC_SECURITY_PLUGIN).toBe(securityRepoRoot);
    expect(process.env.NODE_VERSION).toBe('18.17.0');
  });
});

