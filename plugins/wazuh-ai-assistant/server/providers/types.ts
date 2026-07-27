import {
  CanonicalToolChoice,
  ChatMessage,
  ProviderConfig,
  StreamEvent,
  ToolSpec,
} from '../../common/types';

/**
 * Tool-calling parameters for a single `chatStream` turn. Optional so every existing call site
 * (plain chat, provider connectivity test) keeps compiling and behaving identically when no tools
 * are involved.
 */
export interface ChatStreamOptions {
  tools?: ToolSpec[];
  toolChoice?: CanonicalToolChoice;
}

/**
 * Every provider adapter turns a canonical ChatMessage[] into a canonical StreamEvent stream.
 * Adapters must never buffer the full upstream response: read the body as it arrives and yield
 * events incrementally so the route can forward them to the browser as SSE frames.
 */
export interface ProviderAdapter {
  chatStream(
    config: ProviderConfig,
    messages: ChatMessage[],
    signal: AbortSignal,
    options?: ChatStreamOptions,
  ): AsyncIterable<StreamEvent>;

  /**
   * Transport capability, not access control: declares whether this adapter's `chatStream` does
   * anything with `ChatStreamOptions.tools`/`toolChoice` at all. Defaults to `true` (assume tool
   * support) when omitted, so every existing adapter that doesn't set this keeps behaving exactly
   * as before. Set to `false` only when the adapter itself ignores the options param (e.g.
   * `WazuhBrainAdapter`, whose upstream webhook has no tool-calling contract yet) — the route
   * (server/routes/chat.ts) uses this to skip the stage-1 router and the tool catalog entirely for
   * that provider instead of paying for a stage-1 round trip whose result would just be discarded.
   */
  supportsTools?: boolean;
}

/** True when the raw error text looks like a network-level failure rather than an application error. */
function isNetworkFailure(error: unknown, rawMessage: string): boolean {
  return (
    error instanceof TypeError ||
    /fetch failed|ECONNREFUSED|ENOTFOUND|ECONNRESET|EAI_AGAIN|aborted/i.test(
      rawMessage,
    )
  );
}

/**
 * Describes a connection-level error (failed fetch, DNS failure, connection refused/reset,
 * aborted request) with a message that is safe and useful to show to a user, while keeping the
 * raw Node/fetch error text in parentheses for debugging. Shared by every provider adapter so
 * the mapping only lives in one place; call this instead of reading `error.message` directly in
 * a `catch` block around `fetch(...)` or around consuming its stream.
 */
export function describeConnectionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (isNetworkFailure(error, raw)) {
    return `Could not reach the provider endpoint. Check the base URL and network access. (${raw})`;
  }
  return raw;
}

/** Shared by the anthropic/openai-compatible adapters when normalizing a configured base URL. */
export function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
