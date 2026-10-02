/**
 * @jest-environment node
 */
import {
  KEEPALIVE_INTERVAL_MS,
  SSE_KEEPALIVE_FRAME,
  withSseKeepalive,
} from './sse-keepalive';

/**
 * Drives `withSseKeepalive` with fake timers and a hand-rolled source whose frames are released by
 * the test, so the only timers in play are the keep-alive's own and `jest.getTimerCount()` proves
 * none is left behind.
 */

interface ControlledSource extends AsyncIterable<string> {
  /** Releases the pending `next()` with a frame. */
  emit(frame: string): void;
  /** Ends the source (the pending `next()` resolves `done`). */
  end(): void;
  /** Makes the pending `next()` reject. */
  fail(error: Error): void;
  nextCalls: number;
  returnCalls: number;
}

function controlledSource(): ControlledSource {
  let settle:
    | {
        resolve: (r: IteratorResult<string>) => void;
        reject: (e: Error) => void;
      }
    | undefined;
  const source: ControlledSource = {
    nextCalls: 0,
    returnCalls: 0,
    emit(frame) {
      settle?.resolve({ value: frame, done: false });
      settle = undefined;
    },
    end() {
      settle?.resolve({ value: undefined, done: true });
      settle = undefined;
    },
    fail(error) {
      settle?.reject(error);
      settle = undefined;
    },
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          source.nextCalls += 1;
          if (settle) {
            // The contract under test: never a second pull while one is pending.
            throw new Error(
              'next() called while a previous next() was still pending',
            );
          }
          return new Promise<IteratorResult<string>>((resolve, reject) => {
            settle = { resolve, reject };
          });
        },
        return: () => {
          source.returnCalls += 1;
          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };
  return source;
}

/** Lets pending promise callbacks run; fake timers never touch the microtask queue. */
async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
}

/** Resolves to the settled value of `promise`, or `'pending'` if it has not settled yet. */
async function peek<T>(promise: Promise<T>): Promise<T | 'pending'> {
  const marker = Symbol('pending');
  const result = await Promise.race([
    promise,
    flushMicrotasks().then(() => marker),
  ]);
  return result === marker ? 'pending' : (result as T);
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('writes a keep-alive comment frame after a 15 s gap, then resumes with the real frame', async () => {
  const source = controlledSource();
  const frames = withSseKeepalive(source);

  const first = frames.next();
  source.emit('data: a\n\n');
  expect(await first).toEqual({ value: 'data: a\n\n', done: false });

  const second = frames.next();
  await flushMicrotasks();
  jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS - 1);
  expect(await peek(second)).toBe('pending');
  jest.advanceTimersByTime(1);
  expect(await second).toEqual({ value: SSE_KEEPALIVE_FRAME, done: false });

  // A second silent interval writes a second keep-alive, on the SAME pending pull.
  const third = frames.next();
  await flushMicrotasks();
  jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS);
  expect(await third).toEqual({ value: SSE_KEEPALIVE_FRAME, done: false });

  const fourth = frames.next();
  await flushMicrotasks();
  source.emit('data: b\n\n');
  expect(await fourth).toEqual({ value: 'data: b\n\n', done: false });
  // Two frames pulled, however many keep-alives were written in between.
  expect(source.nextCalls).toBe(2);

  const end = frames.next();
  await flushMicrotasks();
  source.end();
  expect(await end).toEqual({ value: undefined, done: true });
});

test('writes no keep-alive while frames arrive faster than the interval', async () => {
  const source = controlledSource();
  const frames = withSseKeepalive(source);
  const written: string[] = [];

  for (const frame of ['data: 1\n\n', 'data: 2\n\n', 'data: 3\n\n']) {
    const next = frames.next();
    // eslint-disable-next-line no-await-in-loop
    await flushMicrotasks();
    jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS - 1_000);
    source.emit(frame);
    // eslint-disable-next-line no-await-in-loop
    const result = await next;
    written.push(result.value as string);
  }

  expect(written).toEqual(['data: 1\n\n', 'data: 2\n\n', 'data: 3\n\n']);
});

test('after the source ends, nothing more is written and no timer is left', async () => {
  const source = controlledSource();
  const frames = withSseKeepalive(source);

  const first = frames.next();
  source.emit('data: {"type":"done"}\n\n');
  await first;
  const end = frames.next();
  await flushMicrotasks();
  source.end();
  expect(await end).toEqual({ value: undefined, done: true });

  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS * 4);
  expect(await frames.next()).toEqual({ value: undefined, done: true });
});

test('when the source throws, the error propagates and no timer is left', async () => {
  const source = controlledSource();
  const frames = withSseKeepalive(source);

  const next = frames.next();
  await flushMicrotasks();
  source.fail(new Error('boom'));
  await expect(next).rejects.toThrow('boom');

  expect(jest.getTimerCount()).toBe(0);
  expect(await frames.next()).toEqual({ value: undefined, done: true });
});

test('a consumer that stops early while a pull is pending clears the timer and closes the source', async () => {
  const source = controlledSource();
  const frames = withSseKeepalive(source);

  const first = frames.next();
  await flushMicrotasks();
  jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS);
  expect(await first).toEqual({ value: SSE_KEEPALIVE_FRAME, done: false });

  // The response was destroyed (client disconnect): Readable.from calls return().
  expect(await frames.return(undefined)).toEqual({
    value: undefined,
    done: true,
  });
  expect(jest.getTimerCount()).toBe(0);
  // Requested without waiting for the pending pull to settle.
  expect(source.returnCalls).toBe(1);
  // The pending pull settling later must not throw an unhandled rejection or write anything.
  source.fail(new Error('aborted'));
  await flushMicrotasks();
  jest.advanceTimersByTime(KEEPALIVE_INTERVAL_MS * 2);
  expect(await frames.next()).toEqual({ value: undefined, done: true });
});

test('a consumer that stops early between frames closes the source and runs its cleanup', async () => {
  let cleanedUp = false;
  async function* source(): AsyncGenerator<string> {
    try {
      yield 'data: a\n\n';
      yield 'data: b\n\n';
    } finally {
      cleanedUp = true;
    }
  }
  const frames = withSseKeepalive(source());

  expect(await frames.next()).toEqual({ value: 'data: a\n\n', done: false });
  await frames.return(undefined);

  expect(cleanedUp).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});
