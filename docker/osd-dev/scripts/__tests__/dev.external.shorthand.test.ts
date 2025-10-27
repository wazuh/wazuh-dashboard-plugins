import fs from 'fs';
import path from 'path';
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';
import {
  setupTestEnv,
  teardownTestEnv,
  SavedProcessState,
  createSiblingRootUnder,
} from './helpers/setupTests';

describe('dev.ts - Shorthand -r <name> resolves under sibling', () => {
  let tmpdir: string;
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-jest-ext-sh-' });
    saved = ctx.saved;
    tmpdir = ctx.tmpdir;
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  test('generates override using sibling path when -r name provided', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();

    // Create sibling repo folder visible in container (/sibling/<name>)
    const siblingRoot = createSiblingRootUnder(tmpdir, 'sibling-root-sh');
    const name = 'wazuh-dashboard-reporting';
    const hostPath = path.join(siblingRoot, name);
    const containerPath = path.join(siblingRoot, name); // In tests, sibling container root == sibling host path
    fs.mkdirSync(hostPath, { recursive: true });
    fs.mkdirSync(containerPath, { recursive: true });
    fs.writeFileSync(
      path.join(containerPath, 'package.json'),
      '{"name":"wazuh-dashboard-reporting"}',
    );

    await mainWithDeps(['-r', name, 'up'], {
      logger,
      processRunner: runner,
    });
    await new Promise(tick => setImmediate(tick));

    const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
    expect(fs.existsSync(overridePath)).toBe(true);
    const content = fs.readFileSync(overridePath, 'utf-8');
    const normalized = content.replaceAll(hostPath, '${hostPath}');
    const expected = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'override_external_shorthand.yml'),
      'utf-8',
    );
    expect(normalized.trim()).toBe(expected.trim());
  });
});
