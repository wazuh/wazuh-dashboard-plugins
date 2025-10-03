import fs from 'fs';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';
import { setupTestEnv, teardownTestEnv, repoRoot, SavedProcessState, clearRepoDerivedEnv } from './helpers/setupTests';

const getPluginPlatformVersion = (baseRoot: string) => {
  const pkgPath = path.resolve(baseRoot, 'plugins', 'wazuh-core', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return (pkg?.pluginPlatform?.version as string) || '';
};

describe('dev.ts - Auto-detection without flags', () => {
  let tmpdir: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;

    // Clear potentially set variables from previous runs
    clearRepoDerivedEnv();
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('does not generate override file and sets mounts and compose args', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    await mainWithDeps(['up'], { logger, processRunner: runner });
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

    expect(runner.spawnCalls.length).toBe(1);
    const args: string[] = runner.spawnCalls[0].args;

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
