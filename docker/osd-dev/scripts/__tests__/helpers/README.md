# StubRunner (process runner test double)

Purpose

- `StubRunner` is a lightweight test double for process execution used by the dev scripts tests.
- It replaces real `child_process` calls so tests never run Docker or shell scripts, yet still allow assertions on the exact arguments passed to `docker compose`.

Location

- Implementation: `docker/osd-dev/scripts/__tests__/helpers/stubRunner.ts`
- Type contract it implements: `ProcessRunner` from `docker/osd-dev/scripts/src/types/deps.ts`

Behavior

- `execSync(cmd, opts)` is a no‑op (prevents running shell scripts, e.g., network setup).
- `spawn(cmd, args, opts)` records the call in `spawnCalls` and returns an `EventEmitter` that emits `close(0)` on the next tick to simulate success.

Quick usage

```ts
import { mainWithDeps } from '../src/app/main';
import { MockLogger } from '../__mocks__/mockLogger';
import { StubRunner } from './helpers/stubRunner';

test('runs compose with expected args', async () => {
  const logger = new MockLogger('test');
  const runner = new StubRunner();

  await mainWithDeps(['up'], { logger, processRunner: runner });
  await new Promise(r => setImmediate(r));

  expect(runner.spawnCalls.length).toBe(1);
  const args = runner.spawnCalls[0].args;
  expect(args).toEqual(
    expect.arrayContaining([
      'compose',
      '--profile',
      'standard',
      '-f',
      'dev.yml',
      'up',
      '-Vd',
    ]),
  );
});
```

Asserting override generation

```ts
// After mainWithDeps(...)
const overridePath = path.join(tmpdir, 'dev.override.generated.yml');
expect(fs.existsSync(overridePath)).toBe(true);
const content = fs.readFileSync(overridePath, 'utf-8');
expect(content).toContain(
  "- 'external-test:/home/node/kbn/plugins/external-test'",
);
expect(content).toContain('volumes:');
expect(content).toContain(`      device: ${externalPath}`);
```

Simulating failures (optional)

```ts
import { EventEmitter } from 'events';

const failing = new StubRunner();
failing.spawn = (cmd, args) => {
  const ee = new EventEmitter();
  process.nextTick(() => ee.emit('close', 1)); // non‑zero exit
  failing.spawnCalls.push({ cmd, args });
  return ee as any;
};
```

Notes

- Prefer `mainWithDeps(argv, { logger, processRunner: runner })` in tests instead of importing the CLI entrypoint. It keeps tests fast, deterministic, and independent from the host.
- If you need to assert that the network setup script would have been invoked, extend `StubRunner` to capture `execSync` invocations (e.g., by pushing `cmd` into an `execCalls` array).
