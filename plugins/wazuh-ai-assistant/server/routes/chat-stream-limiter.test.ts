import assert from 'node:assert/strict';
import {
  acquireStreamSlot,
  releaseStreamSlotWhenDone,
  MAX_CONCURRENT_STREAMS_PER_USER,
  MAX_CONCURRENT_STREAMS_GLOBAL,
} from './chat';

/**
 * Concurrent-stream cap: without it, one user or script can open unlimited concurrent chat
 * streams. `acquireStreamSlot`/`releaseStreamSlotWhenDone` are chat.ts's enforcement, exported for
 * unit testing only and not part of the route's HTTP contract.
 *
 * NOTE (needs the OSD tree to actually run): server/routes/chat.ts imports
 * `../../../../src/core/server` and `@osd/config-schema`, which only resolve inside the full
 * wazuh-dashboard checkout this repo is normally built against (see tsconfig.test.json / CI.md).
 * This file cannot execute standalone outside that checkout (no OSD tree, no
 * node_modules) -- it follows the same colocated-unit-test conventions as every other test here and
 * needs the platform runner (or CI) to actually run. sse-utils.ts/retry.ts have no such dependency and WERE
 * verified locally (see server/providers/provider-stall-watchdog.test.ts).
 *
 * `globalActiveStreams`/`perUserActiveStreams` are module-level state shared by every test below
 * (real production behavior -- see chat.ts's doc comment for why this one counter is exempt from
 * the "no module-level caches" rule). Every test here releases everything it acquires before
 * finishing so later tests in this file start from a clean (zero) baseline regardless of order,
 * and every test uses a fresh random username so per-user state never leaks between tests either.
 */

function uniqueUser(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

test('acquireStreamSlot: accounting is correct and release is idempotent under a double-release attempt', () => {
  const user = uniqueUser('double-release');

  const first = acquireStreamSlot(user);
  assert.equal(first.ok, true);
  if (!first.ok) {
    return;
  }
  first.release();
  first.release(); // deliberate double-release: must not free two slots for one acquire

  // If the double-release had (incorrectly) freed two slots, this user would be able to acquire
  // MAX_CONCURRENT_STREAMS_PER_USER + 1 streams from here. It must be exactly the cap.
  const acquired: Array<{ ok: true; release: () => void }> = [];
  for (let i = 0; i < MAX_CONCURRENT_STREAMS_PER_USER; i += 1) {
    const result = acquireStreamSlot(user);
    assert.equal(
      result.ok,
      true,
      `expected acquire #${
        i + 1
      } of ${MAX_CONCURRENT_STREAMS_PER_USER} to succeed`,
    );
    if (result.ok) {
      acquired.push(result);
    }
  }
  const overLimit = acquireStreamSlot(user);
  assert.equal(
    overLimit.ok,
    false,
    'expected the cap to still be exactly MAX_CONCURRENT_STREAMS_PER_USER',
  );

  acquired.forEach(entry => entry.release());
});

test('acquireStreamSlot: per-user cap 429s the 6th stream for the same user, but a distinct user is unaffected', () => {
  const userA = uniqueUser('user-a');
  const userB = uniqueUser('user-b');

  const acquiredA: Array<{ ok: true; release: () => void }> = [];
  for (let i = 0; i < MAX_CONCURRENT_STREAMS_PER_USER; i += 1) {
    const result = acquireStreamSlot(userA);
    assert.equal(result.ok, true);
    if (result.ok) {
      acquiredA.push(result);
    }
  }

  const rejectedA = acquireStreamSlot(userA);
  assert.equal(rejectedA.ok, false);
  if (!rejectedA.ok) {
    assert.match(rejectedA.message, /already have \d+ answers streaming/i);
  }

  const okB = acquireStreamSlot(userB);
  assert.equal(
    okB.ok,
    true,
    'a distinct user must not be affected by userA already being at its own cap',
  );

  acquiredA.forEach(entry => entry.release());
  if (okB.ok) {
    okB.release();
  }
});

test('acquireStreamSlot: global cap rejects a brand-new user once MAX_CONCURRENT_STREAMS_GLOBAL streams are open', () => {
  const acquired: Array<{ ok: true; release: () => void }> = [];
  let remaining = MAX_CONCURRENT_STREAMS_GLOBAL;
  let userIndex = 0;
  while (remaining > 0) {
    const user = uniqueUser(`global-${userIndex}`);
    userIndex += 1;
    const take = Math.min(MAX_CONCURRENT_STREAMS_PER_USER, remaining);
    for (let i = 0; i < take; i += 1) {
      const result = acquireStreamSlot(user);
      assert.equal(
        result.ok,
        true,
        'expected this acquire to succeed while under both the per-user and global caps',
      );
      if (result.ok) {
        acquired.push(result);
      }
      remaining -= 1;
    }
  }
  assert.equal(acquired.length, MAX_CONCURRENT_STREAMS_GLOBAL);

  // A brand-new user, nowhere near their OWN per-user cap, must still be rejected: the global cap
  // is checked first (see acquireStreamSlot's doc comment).
  const overflowUser = uniqueUser('global-overflow');
  const overflow = acquireStreamSlot(overflowUser);
  assert.equal(overflow.ok, false);
  if (!overflow.ok) {
    assert.match(overflow.message, /at capacity/i);
  }

  acquired.forEach(entry => entry.release());

  // Confirms the release loop above actually returned the global counter to zero: this brand-new
  // user can now acquire, proving the earlier rejection was really about capacity, not something
  // permanently broken.
  const afterRelease = acquireStreamSlot(overflowUser);
  assert.equal(afterRelease.ok, true);
  if (afterRelease.ok) {
    afterRelease.release();
  }
});

// --- releaseStreamSlotWhenDone: release-once across every exit path ------------------------------

async function* fakeFrames(values: string[]): AsyncGenerator<string> {
  for (const value of values) {
    yield value;
  }
}

async function* throwingFrames(): AsyncGenerator<string> {
  yield 'first';
  throw new Error('boom');
}

test('releaseStreamSlotWhenDone: release fires exactly once on normal completion', async () => {
  let releaseCount = 0;
  const release = () => {
    releaseCount += 1;
  };
  const out: string[] = [];
  for await (const frame of releaseStreamSlotWhenDone(
    fakeFrames(['a', 'b']),
    release,
  )) {
    out.push(frame);
  }
  assert.deepEqual(out, ['a', 'b']);
  assert.equal(releaseCount, 1);
});

test('releaseStreamSlotWhenDone: release fires exactly once when the wrapped generator throws', async () => {
  let releaseCount = 0;
  const release = () => {
    releaseCount += 1;
  };
  const out: string[] = [];
  let caught: unknown;
  try {
    for await (const frame of releaseStreamSlotWhenDone(
      throwingFrames(),
      release,
    )) {
      out.push(frame);
    }
  } catch (error) {
    caught = error;
  }
  assert.deepEqual(out, ['first']);
  assert.ok(caught instanceof Error);
  assert.equal(releaseCount, 1);
});

test('releaseStreamSlotWhenDone: release fires exactly once when the consumer stops early (simulates Readable.from destroying the stream on client abort)', async () => {
  let releaseCount = 0;
  const release = () => {
    releaseCount += 1;
  };
  const wrapped = releaseStreamSlotWhenDone(
    fakeFrames(['a', 'b', 'c']),
    release,
  );

  const first = await wrapped.next();
  assert.equal(first.value, 'a');

  // Node calls the generator's own `.return()` when a Readable created via `Readable.from` is
  // destroyed early -- this IS that mechanism, not a stand-in for it.
  const returned = await wrapped.return(undefined);
  assert.equal(returned.done, true);
  assert.equal(releaseCount, 1);

  // A second `.return()` on an already-completed generator must not double-release.
  await wrapped.return(undefined);
  assert.equal(releaseCount, 1);
});
