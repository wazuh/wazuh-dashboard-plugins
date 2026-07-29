import assert from 'node:assert/strict';
import {
  iterateSseLines,
  ProviderStallError,
  PROVIDER_STALL_MESSAGE,
} from './sse-utils';
import { fetchProviderWithRetry } from './retry';
import { StreamEvent } from '../../common/types';

/**
 * Provider stall watchdog: without it, a provider fetch that connects and then goes silent keeps
 * the stream -- and its socket -- open until the client itself disconnects. These tests exercise both halves via the env-var overrides
 * (`WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS`/`WZ_AI_PROVIDER_IDLE_TIMEOUT_MS`, test-only -- see
 * sse-utils.ts's file-header doc comment) so they run in milliseconds instead of the real
 * 30s/120s production budgets. No fake-timer machinery is used (no precedent for it elsewhere in
 * this harness) -- these use small real `setTimeout`/`setInterval` delays instead, which keeps
 * each test in the tens-of-milliseconds range.
 */

/** Minimal controllable SSE body: lets a test push chunks, close, or simply do nothing (to
 * simulate a provider that never sends anything) while observing whether `.cancel()` was called
 * (the stall watchdog's socket-release mechanism, same as the existing abort-listener cleanup). */
function makeStallableStream() {
  let controllerRef: ReadableStreamDefaultController<Uint8Array>;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      cancelled = true;
    },
  });
  const encoder = new TextEncoder();
  return {
    stream,
    push(text: string): void {
      controllerRef.enqueue(encoder.encode(text));
    },
    close(): void {
      controllerRef.close();
    },
    wasCancelled(): boolean {
      return cancelled;
    },
  };
}

async function expectRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail('expected the promise to reject');
}

// --- iterateSseLines: idle timeout (timer resets on activity, stalls when activity stops) -------

test('iterateSseLines: a steady trickle of chunks within the idle window never stalls (timer resets on activity)', async () => {
  process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS = '80';
  try {
    const harness = makeStallableStream();
    const payloads = ['{"n":1}', '{"n":2}', '{"n":3}'];
    let index = 0;
    const interval = setInterval(() => {
      if (index >= payloads.length) {
        clearInterval(interval);
        harness.close();
        return;
      }
      harness.push(`data: ${payloads[index]}\n\n`);
      index += 1;
      // Each chunk arrives well inside the 80ms idle window, so the per-read timer that started
      // after the PREVIOUS chunk should have been reset by this one, not fired.
    }, 25);

    const controller = new AbortController();
    const received: string[] = [];
    for await (const line of iterateSseLines(
      harness.stream,
      controller.signal,
    )) {
      received.push(line);
    }

    assert.deepEqual(received, payloads);
    assert.equal(
      harness.wasCancelled(),
      false,
      'a clean finish must not cancel the reader',
    );
  } finally {
    delete process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS;
  }
});

test('iterateSseLines: going silent mid-stream past the idle window throws ProviderStallError and cancels the reader', async () => {
  process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS = '40';
  try {
    const harness = makeStallableStream();
    harness.push('data: {"hello":true}\n\n');
    // No further pushes and no close() -- the provider "connected, sent one chunk, then went
    // silent forever", exactly what eval/mock_provider.js's `[[mock:stall:MS]]` marker simulates.

    const controller = new AbortController();
    const iterator = iterateSseLines(harness.stream, controller.signal);

    const first = await iterator.next();
    assert.equal(first.done, false);
    assert.equal(first.value, '{"hello":true}');

    const error = await expectRejection(iterator.next());
    assert.ok(
      error instanceof ProviderStallError,
      'expected a ProviderStallError, not some other rejection',
    );
    assert.equal((error as Error).message, PROVIDER_STALL_MESSAGE);
    assert.equal(
      harness.wasCancelled(),
      true,
      'expected the reader to be cancelled so the socket is released',
    );
  } finally {
    delete process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS;
  }
});

test('iterateSseLines: a provider that never sends anything at all trips the first-byte timeout', async () => {
  process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS = '30';
  try {
    const harness = makeStallableStream();
    // No push(), no close() -- headers arrived (this is already inside iterateSseLines, i.e. past
    // fetchWithHeaderTimeout in retry.ts) but the body itself never starts.

    const controller = new AbortController();
    const iterator = iterateSseLines(harness.stream, controller.signal);

    const error = await expectRejection(iterator.next());
    assert.ok(error instanceof ProviderStallError);
    assert.equal((error as Error).message, PROVIDER_STALL_MESSAGE);
    assert.equal(harness.wasCancelled(), true);
  } finally {
    delete process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS;
  }
});

test('iterateSseLines: a real client abort during the wait still wins over the stall timer (no regression)', async () => {
  process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS = '5000'; // deliberately long; the abort must win, not this
  try {
    const harness = makeStallableStream();
    harness.push('data: {"hello":true}\n\n');

    const controller = new AbortController();
    const iterator = iterateSseLines(harness.stream, controller.signal);
    const first = await iterator.next();
    assert.equal(first.value, '{"hello":true}');

    setTimeout(() => controller.abort(), 15);
    const started = Date.now();
    const second = await iterator.next();
    const elapsedMs = Date.now() - started;

    assert.equal(
      second.done,
      true,
      'an aborted read should end the generator, not throw a stall error',
    );
    assert.ok(
      elapsedMs < 1000,
      `expected the abort to win well before the 5s idle timer (took ${elapsedMs}ms)`,
    );
    assert.equal(
      harness.wasCancelled(),
      true,
      'abort must still cancel the reader',
    );
  } finally {
    delete process.env.WZ_AI_PROVIDER_IDLE_TIMEOUT_MS;
  }
});

// --- retry.ts's fetchWithHeaderTimeout (via fetchProviderWithRetry) ------------------------------

/** Same minimal drain helper as retry.test.ts (duplicated rather than imported -- test
 * files intentionally don't depend on each other). */
async function drain(
  gen: AsyncGenerator<StreamEvent, unknown>,
): Promise<{ events: StreamEvent[]; result: unknown }> {
  const events: StreamEvent[] = [];
  let step = await gen.next();
  while (!step.done) {
    events.push(step.value);
    // eslint-disable-next-line no-await-in-loop -- generator steps are sequential by contract
    step = await gen.next();
  }
  return { events, result: step.value };
}

function fakeOkResponse(): Response {
  return {
    ok: true,
    status: 200,
    body: {} as ReadableStream<Uint8Array>,
    headers: { get: () => null } as unknown as Headers,
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

test('fetchProviderWithRetry: a doFetch that never resolves trips the first-byte stall timeout with a terminal error', async () => {
  process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS = '30';
  try {
    const doFetch = () => new Promise<Response>(() => undefined); // never settles on its own
    const controller = new AbortController();
    const { events, result } = await drain(
      fetchProviderWithRetry(doFetch, controller.signal),
    );

    assert.equal(result, undefined);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'error');
    assert.equal(
      (events[0] as { message: string }).message,
      PROVIDER_STALL_MESSAGE,
    );
  } finally {
    delete process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS;
  }
});

test('fetchProviderWithRetry: aborting while doFetch is still pending resolves promptly with no error event', async () => {
  process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS = '5000'; // deliberately long; abort must win, not this
  try {
    const doFetch = () => new Promise<Response>(() => undefined);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 20);

    const started = Date.now();
    const { events, result } = await drain(
      fetchProviderWithRetry(doFetch, controller.signal),
    );
    const elapsedMs = Date.now() - started;

    assert.equal(
      events.length,
      0,
      'an aborted wait must not surface an error event',
    );
    assert.equal(result, undefined);
    assert.ok(
      elapsedMs < 1000,
      `expected the abort composition to win well before the 5s timer (took ${elapsedMs}ms)`,
    );
  } finally {
    delete process.env.WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS;
  }
});

test('fetchProviderWithRetry: the header-timeout wrapper does not affect a normal fast success', async () => {
  const doFetch = () => Promise.resolve(fakeOkResponse());
  const controller = new AbortController();
  const { events, result } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 0);
  assert.ok(
    result,
    'expected the successful response to be returned unchanged',
  );
});
