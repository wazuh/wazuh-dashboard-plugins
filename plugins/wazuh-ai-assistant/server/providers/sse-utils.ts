/**
 * Shared helper for reading an upstream fetch() response body as newline-delimited SSE frames
 * without ever buffering the whole response in memory. Each adapter owns interpreting the
 * `data: ...` payload; this only handles the chunk/partial-line bookkeeping.
 */

/**
 * Provider stall watchdog. Without a timeout on both the provider fetch and every mid-stream
 * read, a provider that connects and then goes silent holds the SSE stream -- and the underlying
 * socket -- open until the client itself disconnects. Two budgets, ONE mechanism (`readWithStallTimeout` below, reused for every `reader.read()` call):
 *   - `PROVIDER_FIRST_BYTE_TIMEOUT_MS`: from fetch dispatch until the first stream chunk arrives.
 *     Split across two call sites for this same budget: `retry.ts`'s `fetchWithHeaderTimeout`
 *     covers "headers never arrive" (the `doFetch()` call itself never settles), and this file's
 *     very first `reader.read()` covers "headers arrived (200 OK, SSE content-type) but the body
 *     never starts" -- exactly what `eval/mock_provider.js`'s `[[mock:stall:MS]]` marker simulates
 *     when a caller passes a first-byte override shorter than MS.
 *   - `PROVIDER_IDLE_TIMEOUT_MS`: between chunks mid-stream -- every `reader.read()` after the
 *     first. This is what a provider that sends one delta then goes silent (again, exactly
 *     `[[mock:stall:MS]]`) actually trips in practice.
 *
 * Both are overridable via env var ONLY so unit tests (and interactive live-testing against
 * the stall marker) can exercise them without waiting 30s/120s for real -- there is no supported way
 * to change these outside tests; production always gets the hardcoded defaults below.
 */
export const PROVIDER_FIRST_BYTE_TIMEOUT_MS = 30_000;
export const PROVIDER_IDLE_TIMEOUT_MS = 120_000;

function readOverrideMs(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Test-only override (`WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS`); see the file-header doc comment. */
export function providerFirstByteTimeoutMs(): number {
  return readOverrideMs(
    'WZ_AI_PROVIDER_FIRST_BYTE_TIMEOUT_MS',
    PROVIDER_FIRST_BYTE_TIMEOUT_MS,
  );
}

/** Test-only override (`WZ_AI_PROVIDER_IDLE_TIMEOUT_MS`); see the file-header doc comment. */
export function providerIdleTimeoutMs(): number {
  return readOverrideMs(
    'WZ_AI_PROVIDER_IDLE_TIMEOUT_MS',
    PROVIDER_IDLE_TIMEOUT_MS,
  );
}

/** Clear, user-facing message for a stalled provider (chat.ts's existing `error` StreamEvent
 * conventions: server/providers/types.ts's `describeConnectionError` passes a non-network-shaped
 * Error's message through unchanged, so this is exactly what the browser sees -- see
 * `ProviderStallError`'s doc comment). Deliberately contains none of `describeConnectionError`'s
 * `isNetworkFailure` trigger words (fetch failed/ECONNREFUSED/ENOTFOUND/ECONNRESET/EAI_AGAIN/
 * aborted), so it is never rewritten into the generic "Could not reach the provider endpoint" text. */
export const PROVIDER_STALL_MESSAGE = 'The AI provider stopped responding.';

/**
 * Distinguishable error type for a stall-timeout firing (as opposed to a genuine read/network
 * failure) -- thrown by `readWithStallTimeout` below and by `retry.ts`'s `fetchWithHeaderTimeout`.
 * Both adapters' existing `catch (error) { yield {type:'error', message: describeConnectionError(
 * error)}; }` blocks handle this with no changes needed on their part: `describeConnectionError`
 * treats any non-network-shaped `Error` as already-safe-to-show and returns its `message` verbatim.
 */
export class ProviderStallError extends Error {
  constructor(message: string = PROVIDER_STALL_MESSAGE) {
    super(message);
    this.name = 'ProviderStallError';
  }
}

/**
 * Races one `reader.read()` against `timeoutMs`. On timeout: cancels the reader (releasing the
 * underlying socket -- the same cleanup `iterateSseLines`'s own abort listener performs below) and
 * rejects with a `ProviderStallError` instead of leaving the read pending forever. A `reader.read()`
 * that settles first (either outcome) clears the timer and resolves/rejects normally, so the
 * common, non-stalled path costs nothing but one extra `setTimeout`/`clearTimeout` pair.
 */
function readWithStallTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
  // Derive the read-result type from the reader's own `read()` signature rather than naming a
  // global (`ReadableStreamReadResult`/`ReadableStreamDefaultReadResult`) whose spelling differs
  // across the DOM lib and @types/node versions — this is correct under whichever one is in scope.
): Promise<
  Awaited<ReturnType<ReadableStreamDefaultReader<Uint8Array>['read']>>
> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reader.cancel().catch(() => undefined);
      reject(new ProviderStallError());
    }, timeoutMs);

    reader.read().then(
      result => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(result);
      },
      error => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Async-iterates raw `data: <payload>` strings out of a ReadableStream<Uint8Array>, buffering
 * only the (small) trailing partial line between chunks.
 *
 * Every read is bounded by the stall watchdog above: `providerFirstByteTimeoutMs()` for the first
 * chunk, `providerIdleTimeoutMs()` for every one after -- a provider that connects and then goes
 * silent no longer holds this generator (and the socket underneath it) open indefinitely; it throws
 * a `ProviderStallError`, which propagates out of the calling adapter's `for await` loop into its
 * existing `catch` block exactly like any other read failure.
 */
export async function* iterateSseLines(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let receivedFirstChunk = false;

  const onAbort = () => {
    reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', onAbort);

  try {
    while (true) {
      if (signal.aborted) {
        return;
      }
      const timeoutMs = receivedFirstChunk
        ? providerIdleTimeoutMs()
        : providerFirstByteTimeoutMs();
      // eslint-disable-next-line no-await-in-loop -- SSE chunks must be read one at a time to enforce the stall timeout
      const { done, value } = await readWithStallTimeout(reader, timeoutMs);
      receivedFirstChunk = true;
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Last element may be an incomplete line; keep it buffered for the next chunk.
      buffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) {
          continue;
        }
        yield line.slice('data:'.length).trim();
      }
    }
    const trailing = buffer.trim();
    if (trailing.startsWith('data:')) {
      yield trailing.slice('data:'.length).trim();
    }
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}
