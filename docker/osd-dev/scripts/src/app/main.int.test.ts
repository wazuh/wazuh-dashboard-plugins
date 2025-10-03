import { mainWithDeps } from './main';
import { MockLogger } from '../../__mocks__/mockLogger';
import { StubRunner } from '../../__tests__/helpers/stubRunner';
import { setupTestEnv, teardownTestEnv, SavedProcessState } from '../../__tests__/helpers/setupTests';

/**
 * Light integration check wiring real services together via mainWithDeps.
 * Uses the existing test helpers to map container/host paths against the repo tree.
 */
describe('app/main (integration)', () => {
  let saved!: SavedProcessState;

  beforeEach(() => {
    const ctx = setupTestEnv({ prefix: 'wdp-integ-' });
    saved = ctx.saved;
  });

  afterEach(() => {
    teardownTestEnv(saved);
  });

  it('performs a minimal down invocation end-to-end', async () => {
    const logger = new MockLogger('test');
    const runner = new StubRunner();
    await mainWithDeps(['down'], { logger, processRunner: runner });
    await new Promise((r) => setImmediate(r));
    expect(runner.spawnCalls.length).toBe(1);
    const args = runner.spawnCalls[0].args;
    expect(args).toEqual(expect.arrayContaining(['compose', '--profile', 'standard', '-f', 'dev.yml', 'down', '-v', '--remove-orphans']));
  });
});

