/**
 * SSE keep-alive for the chat stream. A reasoning model or a slow tool can keep a turn silent for
 * minutes, and the dashboard's `server.socketTimeout` (120 s) or a reverse proxy then closes the
 * idle response ("Stream interrupted: network error"). SSE comment frames keep bytes flowing; the
 * browser client only parses `data:` lines, so it never sees them.
 */

export const KEEPALIVE_INTERVAL_MS = 15_000;

export const SSE_KEEPALIVE_FRAME = ': keepalive\n\n';

const KEEPALIVE_TICK = Symbol('keepalive-tick');

/**
 * Passes `frames` through and writes `SSE_KEEPALIVE_FRAME` into every gap longer than `intervalMs`.
 * Only one `next()` of the source is ever pending: a tick races it, and the same promise is reused
 * afterwards. On an early stop with a pull pending, the source's `return()` is requested but not
 * awaited, since an async generator queues it behind that pull.
 */
export async function* withSseKeepalive(
  frames: AsyncIterable<string>,
  intervalMs: number = KEEPALIVE_INTERVAL_MS,
): AsyncGenerator<string> {
  const iterator = frames[Symbol.asyncIterator]();
  let pending: Promise<IteratorResult<string>> | undefined;
  try {
    while (true) {
      if (!pending) {
        pending = iterator.next();
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const tick = new Promise<typeof KEEPALIVE_TICK>(resolve => {
        timer = setTimeout(() => resolve(KEEPALIVE_TICK), intervalMs);
      });
      let winner: IteratorResult<string> | typeof KEEPALIVE_TICK;
      try {
        // eslint-disable-next-line no-await-in-loop -- frames must be written strictly in order
        winner = await Promise.race([pending, tick]);
      } finally {
        clearTimeout(timer);
      }
      if (winner === KEEPALIVE_TICK) {
        yield SSE_KEEPALIVE_FRAME;
        continue;
      }
      pending = undefined;
      if (winner.done) {
        return;
      }
      yield winner.value;
    }
  } finally {
    // Calling return() on a source that already finished is a no-op.
    if (pending) {
      pending.catch(() => undefined);
      Promise.resolve(iterator.return?.()).catch(() => undefined);
    } else {
      await iterator.return?.();
    }
  }
}
