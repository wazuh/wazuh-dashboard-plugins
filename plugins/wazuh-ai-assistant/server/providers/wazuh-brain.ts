import { createHash } from 'crypto';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { describeError } from '../../common/errors';
import {
  ChatStreamOptions,
  ProviderAdapter,
  describeConnectionError,
} from './types';
// Raw HTTP error bodies can echo a credential from a misbehaving gateway; reuse retry.ts's
// truncate+redact helper rather than forwarding the body verbatim (see its doc comment).
import {
  describeOutOfCreditsMessage,
  extractProviderErrorMessage,
  fetchWithHeaderTimeout,
  safeReadText,
  sanitizeProviderErrorBody,
} from './retry';
import { ProviderStallError } from './sse-utils';
import {
  assertProviderUrlAllowed,
  PROVIDER_FETCH_REDIRECT_POLICY,
} from './url-guard';

/** Upper bound on how much of
 * a successful (HTTP 200) provider response body this adapter will read before giving up, mirroring
 * retry.ts's MAX_ERROR_BODY_CHARS pattern but sized for a real answer rather than a truncated error
 * snippet -- a hostile or compromised gateway returning an unbounded body must not be buffered into
 * memory in full just because the status code was 200. 128KB comfortably covers any real chat
 * answer this adapter would ever produce (this webhook returns a single non-streamed answer, not a
 * multi-turn transcript) while still being a hard, cheap-to-check ceiling. */
const MAX_RESPONSE_BODY_CHARS = 128 * 1024;

/**
 * Adapter for the Wazuh AI Assistant hosted brain (today: an n8n webhook in front of a
 * Bedrock/Claude pipeline on AWS). The webhook contract is non-streaming JSON today, so this
 * v1 wraps the full answer as a single `delta` followed by `done`. The UI still sees the
 * canonical streaming contract, so when the hosted brain gains real SSE support later, only
 * this adapter changes; nothing in public/ or the other adapters needs to move.
 */
export class WazuhBrainAdapter implements ProviderAdapter {
  // Transport capability (server/providers/types.ts's doc comment): this v1 webhook contract has
  // no tool-calling support at all, so the route skips the stage-1 router (and the catalog)
  // entirely for this provider rather than running it only to discard the result.
  readonly supportsTools = false;

  async *chatStream(
    config: ProviderConfig,
    messages: ChatMessage[],
    signal: AbortSignal,
    // Tool calling is a later phase for the hosted brain; the
    // adapter seam accepts the option so the route can call every adapter uniformly, but this v1
    // brain ignores it.
    _options?: ChatStreamOptions,
  ): AsyncIterable<StreamEvent> {
    const lastUserMessage = [...messages]
      .reverse()
      .find(message => message.role === 'user');
    const sessionId = deriveSessionId(messages);

    // Fetch-time SSRF guard -- see server/providers/url-guard.ts for the full policy and
    // why this must run here rather than only at settings.ts save time. This adapter appends no
    // path to `baseUrl`, so the guard runs on the exact same value the fetch below uses.
    try {
      await assertProviderUrlAllowed(config.baseUrl);
    } catch (error) {
      yield { type: 'error', message: describeError(error) };
      return;
    }

    // Wrapped in the same first-byte timeout the SSE adapters get through
    // `fetchProviderWithRetry`: this webhook answers in one shot, so a gateway that accepts the
    // connection and then never sends response headers would otherwise hold the request open until
    // the browser gives up. No retry wrapper — a non-idempotent webhook POST must not be replayed.
    let response: Response;
    try {
      response = await fetchWithHeaderTimeout(
        () =>
          fetch(config.baseUrl, {
            method: 'POST',
            signal,
            redirect: PROVIDER_FETCH_REDIRECT_POLICY,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatInput: lastUserMessage?.content ?? '',
              sessionId,
              api_key: config.apiKey ?? '',
            }),
          }),
        signal,
      );
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      yield {
        type: 'error',
        message:
          error instanceof ProviderStallError
            ? error.message
            : describeConnectionError(error),
      };
      return;
    }

    if (!response.ok) {
      const bodyText = await safeReadText(response);
      const defaultMessage = `Provider responded with HTTP ${
        response.status
      }: ${sanitizeProviderErrorBody(
        extractProviderErrorMessage(bodyText),
        config.apiKey,
      )}`;
      yield {
        type: 'error',
        // Out-of-credits override, same detection/precedence as retry.ts's SSE adapters — see
        // describeOutOfCreditsMessage's doc comment.
        message: describeOutOfCreditsMessage(
          response.status,
          bodyText,
          defaultMessage,
        ),
      };
      return;
    }

    // Response size cap: read as text under a hard cap BEFORE parsing, rather than
    // `await response.json()`, which would buffer an arbitrarily large body into memory with no
    // limit -- a hostile/compromised gateway returning gigabytes of JSON on a 200 would otherwise
    // be read in full. The cap is passed EXPLICITLY: `safeReadText`'s own default is the much
    // smaller error-body cap, and it now streams-and-cancels rather than buffering the whole body
    // first (see its doc comment -- the earlier version of this check bounded nothing).
    let rawText: string;
    try {
      rawText = await safeReadText(response, MAX_RESPONSE_BODY_CHARS);
    } catch (error) {
      yield {
        type: 'error',
        message: `Could not read provider response: ${describeError(error)}`,
      };
      return;
    }
    if (rawText.length > MAX_RESPONSE_BODY_CHARS) {
      yield {
        type: 'error',
        message:
          `Provider response exceeded the maximum allowed size ` +
          `(${MAX_RESPONSE_BODY_CHARS} bytes) and was rejected.`,
      };
      return;
    }

    let text: string;
    try {
      const json = JSON.parse(rawText) as {
        output?: unknown;
        text?: unknown;
        answer?: unknown;
      };
      const candidate = json.output ?? json.text ?? json.answer ?? '';
      // Runtime shape validation: `json.output ?? json.text ?? json.answer` was cast,
      // not validated -- a gateway returning a non-string (e.g. an object or number) for any of
      // these fields would violate StreamEvent's `content: string` contract for the `delta` event
      // yielded below. Reject explicitly instead of forwarding a non-string value downstream.
      if (typeof candidate !== 'string') {
        yield {
          type: 'error',
          message:
            'Provider response had an unexpected (non-string) content field.',
        };
        return;
      }
      text = candidate;
    } catch (error) {
      yield {
        type: 'error',
        message: `Could not parse provider response: ${describeError(error)}`,
      };
      return;
    }

    if (text) {
      yield { type: 'delta', content: text };
    }
    yield { type: 'done' };
  }
}

/**
 * Correlation key sent to the hosted brain as `sessionId`. Derived defensively from the only input
 * this adapter has: `chatStream(config, messages, signal, options)` carries no username and no
 * conversation id, so the hash of the first user message plus the message count is the narrowest
 * key available. Two requests collide only when two users open a conversation with byte-identical
 * first messages AND reach the same message count.
 *
 * Deliberately NOT a stable per-conversation key: because the count is part of the hash, every turn
 * produces a different id, so the brain cannot accumulate server-side memory across turns of one
 * conversation. That is the safe direction to fail — a stable key derived from message content
 * alone would let any two users who opened with the same text share one brain-side memory — but it
 * does mean the hosted provider answers each turn without the previous ones. Giving the brain real
 * session continuity requires threading a per-user, per-conversation id from the route through
 * `ProviderAdapter.chatStream`; until that exists, this adapter sends only the latest user message
 * (see `chatStream` above) and the plugin keeps conversation history itself.
 *
 * Exported for unit testing; every other caller in this file uses it directly.
 */
export function deriveSessionId(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(message => message.role === 'user');
  const digest = createHash('sha256')
    .update(firstUserMessage?.content ?? '')
    .digest('hex')
    .slice(0, 16);
  return `wazuh-ai-assistant-${digest}-${messages.length}`;
}
