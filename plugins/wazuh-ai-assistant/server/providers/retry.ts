import { StreamEvent } from '../../common/types';
import { describeConnectionError } from './types';
import { ProviderStallError, providerFirstByteTimeoutMs } from './sse-utils';
import { getOutOfCreditsMessage } from '../plugin-services';

/**
 * Transient-failure retry for the initial provider request (the "adapters are pure transport"
 * rule keeps this in the transport layer). Only the pre-stream
 * fetch is retried — once a byte of SSE has been forwarded to the client a retry would emit
 * duplicate events, so in-stream failures stay terminal.
 *
 * Rate limits are a normal operating condition, not an error: free-tier providers (e.g. Groq,
 * 12k tokens/min) reject the second orchestration round of a tool-calling turn because each
 * round re-sends the full tool schemas. Those responses carry precise wait hints
 * (`Retry-After` header, or "try again in 7.03s" in the body) that we honor.
 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529]);
const MAX_RETRIES = 2;
const FALLBACK_DELAYS_MS = [2000, 8000];
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 30000;

/** Upper bound on how much of a raw provider error body is embedded in a client-facing `error`
 * event — independent of, and much smaller than, any upstream body size limit. */
const MAX_ERROR_BODY_CHARS = 500;

/**
 * HTTP 400 from Groq (and OpenAI-compatible providers with a similar contract) when the MODEL's
 * tool-call generation is malformed — the body carries `error.code === "tool_use_failed"` and a
 * `failed_generation` field with the raw broken output. This is a model-capability problem, not a
 * transient server one, so it is not folded into RETRYABLE_STATUSES/MAX_RETRIES below: it gets its
 * own tiny one-shot retry budget (`TOOL_USE_FAILED_MAX_RETRIES`) and a terminal message we write
 * ourselves rather than Groq's developer-facing "adjust your prompt" text.
 */
const TOOL_USE_FAILED_MARKERS = ['tool_use_failed', 'failed_generation'];
const TOOL_USE_FAILED_MAX_RETRIES = 1;
const TOOL_USE_FAILED_RETRY_DELAY_MS = 1000;

/** Upper bound on how much of the `failed_generation` field is embedded in the terminal error
 * message when present — independent of, and smaller than, MAX_ERROR_BODY_CHARS. */
const MAX_FAILED_GENERATION_SNIPPET_CHARS = 200;

/** Our own terminal message for a tool_use_failed 400 that didn't recover after one retry — shown
 * instead of Groq's raw `"Failed to call a function. Please adjust your prompt..."` text, which is
 * developer-facing and confusing to an end user. */
const TOOL_USE_FAILED_TERMINAL_MESSAGE =
  'The AI model could not generate a valid tool call for this question. This model may not be ' +
  'reliable at tool use. Try rephrasing the question, or switch to a model with stronger ' +
  'tool-calling support (for example GPT-4o, Claude Sonnet, or llama-3.3-70b; see the Model field ' +
  'hint in Settings).';

/** In-stream counterpart of TOOL_USE_FAILED_TERMINAL_MESSAGE. Worded differently on purpose: this
 * frame arrives on HTTP 200 mid-stream, no retry budget was spent, and it carries no
 * `failed_generation` field, so there is no snippet to append and no recovery to report. */
const TOOL_USE_FAILED_STREAM_MESSAGE =
  "The assistant couldn't get a valid tool call from the configured model for this request. " +
  "This usually means the model's function-calling support isn't reliable enough for this kind " +
  'of question. Try a model with stronger tool-calling support, or ask a simpler question.';

/** Maps a provider in-stream `error.message` (HTTP-200 SSE error frame, which carries only a
 * plain message string -- unlike the HTTP-400 `tool_use_failed` body, there is no
 * `failed_generation` field here to append as a snippet) to our own friendly copy when it is a
 * tool_use_failed report; returns undefined for every other error so callers keep the raw
 * message. */
export function describeToolUseFailedStreamMessage(
  rawMessage: string,
): string | undefined {
  return TOOL_USE_FAILED_MARKERS.some(marker => rawMessage.includes(marker))
    ? TOOL_USE_FAILED_STREAM_MESSAGE
    : undefined;
}

/** True when a rejected response is Groq's (or a compatible provider's) tool_use_failed shape. */
function isToolUseFailedBody(status: number, bodyText: string): boolean {
  return (
    status === 400 &&
    TOOL_USE_FAILED_MARKERS.some(marker => bodyText.includes(marker))
  );
}

/**
 * Substrings real providers use to report an out-of-credits condition — a billing failure, not
 * the transient rate limiting RETRYABLE_STATUSES handles. Deliberately specific phrases rather
 * than the bare word "quota", which a genuine transient rate-limit message can also use.
 */
const OUT_OF_CREDITS_MARKERS = [
  'credit balance',
  'insufficient_quota',
  'insufficient credit',
  'out of credit',
  'purchase credits',
];

/** True when a rejected response's body reports an out-of-credits condition. No status gate:
 * different providers report it at different HTTP statuses. */
function isOutOfCreditsBody(bodyText: string): boolean {
  const lowered = bodyText.toLowerCase();
  return OUT_OF_CREDITS_MARKERS.some(marker => lowered.includes(marker));
}

/**
 * Swaps a terminal provider-error message for the operator-configured
 * `wazuh_ai_assistant.outOfCreditsMessage` when the body reports an out-of-credits condition and
 * an override is configured. Returns `defaultMessage` unchanged in every other case, so an
 * unconfigured deployment sees exactly the original text. Shared with wazuh-brain.ts so both
 * provider paths apply the same detection and precedence.
 */
export function describeOutOfCreditsMessage(
  bodyText: string,
  defaultMessage: string,
): string {
  if (!isOutOfCreditsBody(bodyText)) {
    return defaultMessage;
  }
  return getOutOfCreditsMessage() ?? defaultMessage;
}

/** Builds the terminal-message text for a rejected response: the 429-friendly copy, or the raw
 * sanitized body for every other status. Factored out so the retry-skipping short-circuit below
 * and the normal exhausted-retries branch compute it identically instead of drifting apart. */
function buildTerminalMessage(
  status: number,
  bodyText: string,
  secret?: string,
): string {
  return status === 429
    ? 'The AI provider rejected this request due to rate limits — try again in a moment.'
    : `Provider responded with HTTP ${status}: ${sanitizeProviderErrorBody(
        extractProviderErrorMessage(bodyText),
        secret,
      )}`;
}

/** Pulls the `failed_generation` field out of a tool_use_failed error body, if present and the
 * body is parseable JSON, sanitized and truncated to a short snippet safe to append to the
 * client-facing terminal message. Returns undefined rather than throwing on any shape mismatch —
 * the snippet is a nice-to-have, not load-bearing for the terminal message itself. */
function extractFailedGenerationSnippet(
  bodyText: string,
  secret?: string,
): string | undefined {
  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { failed_generation?: string };
    };
    const raw = parsed.error?.failed_generation;
    if (!raw) {
      return undefined;
    }
    const sanitized = sanitizeProviderErrorBody(raw, secret);
    return sanitized.length > MAX_FAILED_GENERATION_SNIPPET_CHARS
      ? `${sanitized.slice(0, MAX_FAILED_GENERATION_SNIPPET_CHARS)}…`
      : sanitized;
  } catch {
    return undefined;
  }
}

/** Credential-shaped substrings that must never reach the client verbatim: a misbehaving
 * gateway echoing a decrypted Authorization/x-api-key header back into a diagnostic error body
 * must not leak it to the browser. Deliberately broad/conservative — over-redacting a false
 * positive (e.g. a long non-secret hex id) only costs a little error-message readability, whereas
 * missing a real credential does not.
 *
 * The key name may be wrapped in a quote character, which is what lets one pattern match
 * `"api_key":"..."`, `api_key: ...` and `api_key=...` alike. The quoted form is not optional
 * polish: wazuh-brain.ts sends the API key in a JSON request BODY rather than only a header, and
 * webhook platforms commonly echo the request body verbatim into diagnostic error responses, so a
 * pattern requiring `\s*[:=]` immediately after the key name would miss every JSON-shaped leak. */
const SECRET_PATTERNS: RegExp[] = [
  /bearer\s+[a-z0-9._-]+/gi,
  /["']?(?:api[-_]?key|authorization|x-api-key)["']?\s*[:=]\s*["']?[a-z0-9._-]{8,}["']?/gi,
  /\b[a-f0-9]{32,}\b/gi, // long hex blobs (tokens, hashes, request ids that could be keys)
  /\b[a-z0-9+/]{40,}={0,2}\b/gi, // long base64 blobs
];

/** Replaces every literal occurrence of `secret` (and, cheaply, its URI-encoded form) with
 * `[redacted]`. Uses split/join rather than building a RegExp from `secret` — the secret is
 * caller-controlled data (a stored API key), so turning it into regex source text would risk a
 * regex-injection/ReDoS surface for no benefit; split/join does an exact literal-substring
 * replacement with no special-character interpretation. This is the "exact-value" layer: it
 * doesn't need to guess a key's shape (Bearer/header/JSON/etc) because it is handed the real value
 * up front, so it also catches short or oddly-shaped keys the pattern layer below can't reliably
 * recognize (e.g. a short self-hosted-gateway key that doesn't meet the pattern's 8-char threshold
 * or use a recognizable prefix). */
function redactExactSecret(text: string, secret: string): string {
  let out = text.split(secret).join('[redacted]');
  const encoded = encodeURIComponent(secret);
  if (encoded !== secret) {
    out = out.split(encoded).join('[redacted]');
  }
  return out;
}

/** Sanitizes a raw provider HTTP error body before it can be embedded in a client-facing
 * `error` event's message: truncates to `MAX_ERROR_BODY_CHARS` and redacts anything shaped like a
 * credential. Exported so wazuh_brain.ts's non-streaming adapter (which hits the same raw-body-in-
 * error-message shape) reuses it rather than duplicating the redaction patterns. Does not change
 * any control/retry flow — purely a text transform on the message that would otherwise be yielded.
 *
 * `secret` (optional): the caller's OWN configured API key, when available. When supplied
 * (non-empty), every literal occurrence of it is redacted FIRST, before the shape-pattern pass
 * below runs — this is the strong layer (exact match, no shape-guessing), and every adapter plus
 * settings.ts's provider-test route (via each adapter's `chatStream`) passes `config.apiKey`
 * here. `SECRET_PATTERNS` remains the second, weaker layer that still catches an UNKNOWN secret
 * (e.g. one echoed from a different provider/header than the caller's own) shaped like a
 * recognizable credential. */
export function sanitizeProviderErrorBody(
  bodyText: string,
  secret?: string,
): string {
  let out = bodyText;
  if (secret) {
    out = redactExactSecret(out, secret);
  }
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[redacted]');
  }
  return out.length > MAX_ERROR_BODY_CHARS
    ? `${out.slice(0, MAX_ERROR_BODY_CHARS)}…`
    : out;
}

/** Tries the ONE JSON error-body shape real providers actually use: OpenAI, Groq, Anthropic and
 * the OpenAI-compatible gateways (vLLM, Ollama, LM Studio...) all nest the human message at
 * `error.message`. Deliberately narrow — a bare top-level `{error: "..."}` or `{message: "..."}`
 * is NOT unwrapped, even though some ad-hoc gateways use that shape, because such a body may carry
 * OTHER top-level fields (e.g. a misbehaving gateway echoing the request body/credentials
 * alongside a generic error string) that unwrapping to just one field would silently drop from the
 * message sanitizeProviderErrorBody redacts — better to fall through to the raw, fully-redacted
 * body than to risk narrowing past something that still needed redaction. Returns undefined —
 * never throws — on non-JSON input or a shape mismatch, so the caller falls through to the next
 * candidate. */
function extractJsonErrorMessage(bodyText: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }
  const nestedError = (parsed as Record<string, unknown>).error;
  if (nestedError && typeof nestedError === 'object') {
    const message = (nestedError as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return undefined;
}

/** A gateway/proxy sitting in front of the provider (a load balancer, an nginx front door, a
 * corporate egress proxy) commonly rejects the request before it ever reaches the provider's own
 * API, returning ITS OWN HTML error page rather than the provider's JSON error contract — e.g. a
 * 502 from an nginx front door, or an SSO/captive-portal redirect page. `<title>` is normally the
 * terse human-readable summary of such a page ("502 Bad Gateway", "Access Denied"); the
 * tag-stripped body text is the fallback for a page that omits one. Returns undefined (never
 * throws) for anything that doesn't look like HTML, so the caller falls through to the raw body. */
function extractHtmlErrorMessage(bodyText: string): string | undefined {
  const trimmed = bodyText.trim();
  if (
    !/^<(!doctype html|html)\b/i.test(trimmed) &&
    !/<html[\s>]/i.test(trimmed)
  ) {
    return undefined;
  }
  const decodeEntities = (text: string): string =>
    text
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/gi, '&');
  const titleMatch = trimmed.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim()
    : '';
  if (title) {
    return title;
  }
  const text = decodeEntities(trimmed.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}

/** Turns a raw provider/gateway HTTP error body into a short, human-meaningful message before
 * `sanitizeProviderErrorBody` truncates/redacts it: a JSON body in one of the shapes providers
 * actually use, or an HTML error page's `<title>`, is unwrapped to just its message text; anything
 * else (an unrecognized JSON shape, plain text, a truncated/malformed body) is passed through
 * unchanged so the existing raw-body behavior is preserved — "capture some cases, else display
 * all". Exported so wazuh-brain.ts's non-streaming adapter, which hits the same raw-body-in-error
 * shape, reuses it rather than duplicating the parsing. */
export function extractProviderErrorMessage(bodyText: string): string {
  return (
    extractJsonErrorMessage(bodyText) ??
    extractHtmlErrorMessage(bodyText) ??
    bodyText
  );
}

/** Wait hint from a rejected response: Retry-After header, else a "try again in Xs/Xms" body. */
function parseWaitHintMs(
  retryAfterHeader: string | null,
  bodyText: string,
): number | undefined {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1000;
    }
  }
  const match = bodyText.match(/try again in (\d+(?:\.\d+)?)\s*(ms|s)\b/i);
  if (match) {
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'ms' ? value : value * 1000;
  }
  return undefined;
}

/**
 * Provider stall watchdog, header-arrival half (see
 * sse-utils.ts's file-header doc comment for the full two-budget design). Races `doFetch()` against
 * `providerFirstByteTimeoutMs()`, throwing a `ProviderStallError` if the timer wins -- covers a
 * provider that never even sends response headers (a `fetch()` that never settles), which is a
 * distinct failure mode from a body that starts then stalls (that half lives in sse-utils.ts's
 * `iterateSseLines`, which owns the reader and so can call `reader.cancel()` directly).
 *
 * `doFetch` is a closure the caller (an adapter) already built around its own `signal` reference
 * (baked into the `fetch(url, {signal, ...})` call), so this function has no `AbortController` of
 * its own to cancel that in-flight `fetch()` with directly. Instead, `AbortSignal.any` is avoided
 * (unverified on the OSD 3.6 bundled Node) in favor of a manual `addEventListener`
 * composition: this also listens to `signal` directly (the exact same pattern
 * `abortableSleep` below already uses) so a client disconnect while we're waiting on `doFetch()` is
 * noticed immediately -- instead of this promise blocking on our own timer, or on a `doFetch()` that
 * may itself never settle -- rather than only relying on `doFetch()`'s own eventual abort-driven
 * rejection. A response that arrives AFTER we've already timed out or been aborted is not left
 * dangling: its body (if any) is cancelled immediately so the socket isn't held open just because
 * nobody will ever read it.
 */
export function fetchWithHeaderTimeout(
  doFetch: () => Promise<Response>,
  signal: AbortSignal,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new ProviderStallError());
    }, providerFirstByteTimeoutMs());

    // Hoisted function declarations: cleanup/onAbort/timer form a closure
    // cycle, so declaration order alone cannot satisfy define-before-use.
    function cleanup() {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }

    function onAbort() {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new DOMException('The chat request was aborted.', 'AbortError'));
    }
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    doFetch().then(
      response => {
        if (settled) {
          response.body?.cancel().catch(() => undefined);
          return;
        }
        settled = true;
        cleanup();
        resolve(response);
      },
      error => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      },
    );
  });
}

/** Resolves false normally, true if the signal aborted before the delay elapsed. */
function abortableSleep(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise(resolve => {
    if (signal.aborted) {
      resolve(true);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(false);
    }, ms);
    // Hoisted for the same closure-cycle reason as fetchWithHeaderTimeout.
    function onAbort() {
      clearTimeout(timer);
      resolve(true);
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Runs `doFetch` with up to MAX_RETRIES retries on retryable HTTP statuses, yielding a `status`
 * StreamEvent before each wait so the user sees why the turn is paused. Returns the OK response,
 * or undefined after yielding a terminal `error` event (or on abort) — callers just `return`.
 *
 * The success return is narrowed to guarantee a non-null `body`: it is only returned after the
 * `response.ok && response.body` check below, so the two SSE-consuming adapters can iterate
 * `response.body` without a redundant null-guard (fetch types `Response.body` as nullable).
 *
 * `secret` (optional): the caller's configured API key, threaded straight through to every
 * `sanitizeProviderErrorBody`/`extractFailedGenerationSnippet` call below so a gateway that echoes
 * the request body (which carries the key) into an error response never leaks it verbatim to the
 * client. Both adapters that call this (openai-compatible.ts, anthropic.ts) pass `config.apiKey`.
 */
export async function* fetchProviderWithRetry(
  doFetch: () => Promise<Response>,
  signal: AbortSignal,
  secret?: string,
): AsyncGenerator<
  StreamEvent,
  (Response & { body: ReadableStream<Uint8Array> }) | undefined
> {
  let toolUseFailedRetries = 0;
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      // eslint-disable-next-line no-await-in-loop -- each retry attempt must finish before the next starts
      response = await fetchWithHeaderTimeout(doFetch, signal);
    } catch (error) {
      if (error instanceof ProviderStallError) {
        if (!signal.aborted) {
          yield { type: 'error', message: error.message };
        }
        return undefined;
      }
      if (!signal.aborted) {
        yield { type: 'error', message: describeConnectionError(error) };
      }
      return undefined;
    }

    if (response.ok && response.body) {
      return response as Response & { body: ReadableStream<Uint8Array> };
    }

    // eslint-disable-next-line no-await-in-loop -- the error body must be read before deciding whether to retry
    const bodyText = await safeReadText(response);

    if (isToolUseFailedBody(response.status, bodyText)) {
      if (toolUseFailedRetries < TOOL_USE_FAILED_MAX_RETRIES) {
        toolUseFailedRetries += 1;
        yield {
          type: 'status',
          message: 'The model produced an invalid tool call, retrying...',
        };
        // eslint-disable-next-line no-await-in-loop -- bounded retry delay is deliberately serial
        if (await abortableSleep(TOOL_USE_FAILED_RETRY_DELAY_MS, signal)) {
          return undefined;
        }
        continue;
      }
      const snippet = extractFailedGenerationSnippet(bodyText, secret);
      yield {
        type: 'error',
        message: snippet
          ? `${TOOL_USE_FAILED_TERMINAL_MESSAGE} Details (failed_generation): ${snippet}`
          : TOOL_USE_FAILED_TERMINAL_MESSAGE,
      };
      return undefined;
    }

    // Out-of-credits is never transient, so it is checked before the retry decision below and
    // regardless of status: a provider reporting it on an otherwise-retryable status (e.g.
    // `insufficient_quota` on a 429) must not be pointlessly retried.
    if (isOutOfCreditsBody(bodyText)) {
      yield {
        type: 'error',
        message: describeOutOfCreditsMessage(
          bodyText,
          buildTerminalMessage(response.status, bodyText, secret),
        ),
      };
      return undefined;
    }

    if (!RETRYABLE_STATUSES.has(response.status) || attempt >= MAX_RETRIES) {
      // Every retry attempt already yields an honest, provider-attributed, mechanism-free STATUS
      // line for a 429 ("Provider rate limit reached — retrying in Ns…", above). Once the retry
      // budget is exhausted, a 429 gets its own terminal copy: still honest (it says the rejection
      // came from the AI provider, never a generic "something went wrong") and still
      // mechanism-free (no retry count, backoff, or budget vocabulary), but framed as a transient
      // condition worth retrying rather than a bare status dump. Every OTHER retryable status
      // (500/502/503/504/529) uses the generic "Provider responded with HTTP {status}: {raw
      // sanitized body}" message — this framing is scoped to 429 specifically.
      const defaultMessage = buildTerminalMessage(
        response.status,
        bodyText,
        secret,
      );
      yield {
        type: 'error',
        message: defaultMessage,
      };
      return undefined;
    }

    const hintedMs = parseWaitHintMs(
      response.headers.get('retry-after'),
      bodyText,
    );
    const delayMs = Math.min(
      Math.max(
        hintedMs ??
          FALLBACK_DELAYS_MS[Math.min(attempt, FALLBACK_DELAYS_MS.length - 1)],
        MIN_DELAY_MS,
      ),
      MAX_DELAY_MS,
    );
    yield {
      type: 'status',
      message:
        response.status === 429
          ? `Provider rate limit reached — retrying in ${Math.ceil(
              delayMs / 1000,
            )}s…`
          : `Provider unavailable (HTTP ${
              response.status
            }) — retrying in ${Math.ceil(delayMs / 1000)}s…`,
    };
    // eslint-disable-next-line no-await-in-loop -- retry backoff is deliberately serial
    if (await abortableSleep(delayMs, signal)) {
      return undefined;
    }
  }
}

/**
 * Reads a provider response body as text with a REAL memory bound.
 *
 * Must NOT be reduced to `await response.text()` plus a length check by the caller: `text()`
 * fully consumes and buffers the entire body into a JS string before any length comparison can
 * run, so a hostile or misbehaving gateway returning hundreds of MB is read to completion in the
 * dashboard's heap regardless of the cap (a 200 MB body buffers in roughly 300 ms). A cap applied
 * after the fact — `MAX_ERROR_BODY_CHARS` here, `MAX_RESPONSE_BODY_CHARS` in wazuh-brain.ts — is
 * cosmetic.
 *
 * This reads incrementally and CANCELS the stream as soon as the cap is passed, so peak memory is
 * bounded by `maxChars` regardless of what the peer sends.
 *
 * It deliberately reads up to `maxChars + 1` characters, one past the cap: callers detect "the body
 * was too big" with `text.length > cap`, so stopping exactly AT the cap would make an oversized body
 * indistinguishable from one that merely reached it (wazuh-brain.ts would accept it, and this file's
 * error-body truncation would drop its trailing ellipsis). One extra character preserves every
 * caller's existing observable behavior while still bounding memory.
 */
export async function safeReadText(
  response: Response,
  maxChars: number = MAX_ERROR_BODY_CHARS,
): Promise<string> {
  try {
    if (!response.body) {
      // No readable stream (e.g. a synthetic/empty response): nothing to stream-cancel, and there
      // is no body to blow up memory either. Fall back and still honour the cap.
      const whole = await response.text();
      return whole.length > maxChars ? whole.slice(0, maxChars + 1) : whole;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const limit = maxChars + 1;
    let out = '';
    try {
      for (;;) {
        // eslint-disable-next-line no-await-in-loop -- stream chunks are read sequentially by nature
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        out += decoder.decode(value, { stream: true });
        if (out.length >= limit) {
          out = out.slice(0, limit);
          // eslint-disable-next-line no-await-in-loop -- cancel must complete before the loop can safely exit
          await reader.cancel();
          break;
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Already released by cancel() — nothing to do.
      }
    }
    return out;
  } catch {
    return '<unreadable body>';
  }
}
