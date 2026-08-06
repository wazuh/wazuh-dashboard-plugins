import { randomUUID } from 'crypto';
import {
  CanonicalToolChoice,
  ChatMessage,
  ProviderConfig,
  StreamEvent,
  ToolCall,
  ToolSpec,
} from '../../common/types';
import { describeError } from '../../common/errors';
import {
  ChatStreamOptions,
  ProviderAdapter,
  describeConnectionError,
  trimTrailingSlash,
} from './types';
import { widenNumericTypes } from './wire-schema';
import { iterateSseLines } from './sse-utils';
import { fetchProviderWithRetry } from './retry';
import {
  assertProviderUrlAllowed,
  PROVIDER_FETCH_REDIRECT_POLICY,
} from './url-guard';

/** Per-index accumulation of a streamed `tool_calls` delta until the provider closes it out. */
interface ToolCallAccumulator {
  id?: string;
  name?: string;
  args: string;
}

/**
 * Adapter for any server exposing the OpenAI chat-completions wire format: OpenAI itself,
 * Google Gemini's OpenAI-compatible endpoint, Ollama, LM Studio, vLLM, and most local model
 * servers. Provider choice is transport only; the system prompt / message shape is the same
 * canonical ChatMessage[] regardless of who answers.
 */
export class OpenAiCompatibleAdapter implements ProviderAdapter {
  async *chatStream(
    config: ProviderConfig,
    messages: ChatMessage[],
    signal: AbortSignal,
    options?: ChatStreamOptions,
  ): AsyncIterable<StreamEvent> {
    const url = `${trimTrailingSlash(config.baseUrl)}/chat/completions`;

    // Fetch-time SSRF guard -- see server/providers/url-guard.ts for the full policy and
    // why this must run here rather than only at settings.ts save time.
    try {
      await assertProviderUrlAllowed(url);
    } catch (error) {
      yield { type: 'error', message: describeError(error) };
      return;
    }

    const body: Record<string, unknown> = {
      model: config.model,
      stream: true,
      // The OpenAI streaming contract only emits the terminal `usage` frame when this is set.
      // Groq sends it unprompted, which is why the omission went unnoticed -- every usage number
      // this plugin has recorded so far came from Groq. Amazon Bedrock's chat-completions endpoint
      // does not: without this, every turn reports `usage: null` and token accounting (including
      // the stage-1 router's own spend) reads blank. Providers that don't recognise the field
      // ignore it, and the `if (parsed.usage)` exit below is unchanged either way -- note that
      // frame arrives with an EMPTY `choices` array, which the per-choice handling above already
      // tolerates (`parsed.choices?.[0]` is simply undefined).
      stream_options: { include_usage: true },
      messages: messages.map(toOpenAiMessage),
    };
    // Checked for `undefined`, not truthiness -- callers deliberately send `temperature: 0` (the
    // stage-1 router; see ChatStreamOptions's doc comment), which a `if (options?.temperature)`
    // guard would treat as absent and silently drop.
    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options?.tools?.length) {
      body.tools = toOpenAiTools(options.tools);
      body.tool_choice = toOpenAiToolChoice(options.toolChoice ?? 'auto');
      body.parallel_tool_calls = false;
    }

    const response = yield* fetchProviderWithRetry(
      () =>
        fetch(url, {
          method: 'POST',
          signal,
          redirect: PROVIDER_FETCH_REDIRECT_POLICY,
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey
              ? { Authorization: `Bearer ${config.apiKey}` }
              : {}),
          },
          body: JSON.stringify(body),
        }),
      signal,
      // See server/providers/retry.ts's sanitizeProviderErrorBody doc comment for why the
      // exact configured key is passed through here.
      config.apiKey,
    );
    if (!response) {
      return;
    }

    const toolCalls = new Map<number, ToolCallAccumulator>();

    // Reasoning-channel fallback (see the `parsed` type below and issue
    // 02-read-reasoning-delta.md): some reasoning models (gpt-oss, qwen3.x) stream their entire
    // answer on `delta.reasoning` instead of `delta.content` — confirmed on a `general`-routed
    // (no-tool) turn, where 636 output tokens were billed and 0 characters reached the user.
    // `content` is always the answer when it arrives; `reasoningBuffer` only exists to be shown
    // as a LAST-RESORT stand-in, and only once the whole call is known to have produced no
    // `content` at all — never appended alongside a working answer.
    let sawContent = false;
    let reasoningBuffer = '';
    /** Emits the buffered reasoning text as one `delta`, but only if `content` never arrived this
     * call AND this exit finalized no tool calls. Two exits are excluded, not one:
     *  - the `finish_reason === 'tool_calls'` exit (a round that ends in a tool call has no answer
     *    due yet, so there is nothing to fall back for) never calls this at all;
     *  - the `[DONE]`/usage/loop-end exits below DO call this, but must still suppress it when
     *    `hadToolCalls` is true — a provider can close a tool round through one of THOSE exits
     *    without ever sending `finish_reason: 'tool_calls'` (gpt-oss/Groq happens to send it, but
     *    the wire format doesn't guarantee it), and reasoning routinely precedes a tool call on the
     *    analysis channel, so the buffer is typically full exactly when a tool round is ending.
     *    Without this, that reasoning text would be injected as the answer for a TOOL round instead
     *    of being correctly treated as "no answer due yet". */
    function* reasoningFallback(hadToolCalls: boolean): Generator<StreamEvent> {
      if (!sawContent && !hadToolCalls && reasoningBuffer) {
        yield { type: 'delta', content: reasoningBuffer };
      }
    }

    try {
      for await (const payload of iterateSseLines(response.body, signal)) {
        if (payload === '[DONE]') {
          const finalized = finalizeToolCalls(toolCalls);
          yield* finalized;
          if (!hasToolCallError(finalized)) {
            yield* reasoningFallback(finalized.length > 0);
            yield { type: 'done' };
          }
          return;
        }
        let parsed: {
          choices?: Array<{
            delta?: {
              content?: string;
              // Reasoning-channel fields (gpt-oss/qwen3.x-style providers): `reasoning` carries the
              // text, `channel` distinguishes intermediate reasoning ("analysis") from the final
              // answer ("final") when the provider bothers to send it — not read here, since the
              // fallback-only treatment below never needs to tell the two apart (see doc comment
              // above); kept on the type so a future, more elaborate treatment doesn't have to
              // rediscover the wire shape.
              reasoning?: string;
              channel?: string;
              tool_calls?: Array<{
                index?: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
            finish_reason?: string | null;
          }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
          error?: { message?: string };
        };
        try {
          parsed = JSON.parse(payload);
        } catch {
          // Skip malformed/partial frames rather than aborting the whole stream.
          continue;
        }
        if (parsed.error) {
          // Some providers (e.g. Groq) report failures as an in-stream error frame on HTTP 200.
          yield {
            type: 'error',
            message: parsed.error.message ?? 'Unknown provider error',
          };
          return;
        }
        const choice = parsed.choices?.[0];
        const delta = choice?.delta?.content;
        if (delta) {
          sawContent = true;
          yield { type: 'delta', content: delta };
        }
        if (choice?.delta?.reasoning) {
          reasoningBuffer += choice.delta.reasoning;
        }
        accumulateToolCallDeltas(toolCalls, choice?.delta?.tool_calls);

        if (choice?.finish_reason === 'tool_calls') {
          const finalized = finalizeToolCalls(toolCalls);
          yield* finalized;
          if (!hasToolCallError(finalized)) {
            yield { type: 'done' };
          }
          return;
        }
        if (parsed.usage) {
          const finalized = finalizeToolCalls(toolCalls);
          yield* finalized;
          if (!hasToolCallError(finalized)) {
            yield* reasoningFallback(finalized.length > 0);
            yield {
              type: 'done',
              usage: {
                inputTokens: parsed.usage.prompt_tokens,
                outputTokens: parsed.usage.completion_tokens,
              },
            };
          }
          return;
        }
      }
      const finalized = finalizeToolCalls(toolCalls);
      yield* finalized;
      if (!hasToolCallError(finalized)) {
        yield* reasoningFallback(finalized.length > 0);
        yield { type: 'done' };
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      yield { type: 'error', message: describeConnectionError(error) };
    }
  }
}

/** Maps a canonical ChatMessage onto the OpenAI chat-completions wire shape for one message. */
function toOpenAiMessage(message: ChatMessage): Record<string, unknown> {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      tool_call_id: message.toolCallId,
      content: message.content,
    };
  }
  if (message.role === 'assistant' && message.toolCalls?.length) {
    return {
      role: 'assistant',
      content: message.content || null,
      tool_calls: message.toolCalls.map(call => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    };
  }
  return { role: message.role, content: message.content };
}

function toOpenAiTools(tools: ToolSpec[]): Array<Record<string, unknown>> {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: widenNumericTypes(tool.parameters),
    },
  }));
}

function toOpenAiToolChoice(choice: CanonicalToolChoice): unknown {
  if (choice === 'auto' || choice === 'none') {
    return choice;
  }
  if (choice === 'required') {
    return 'required';
  }
  return { type: 'function', function: { name: choice.name } };
}

/** Folds one `delta.tool_calls` frame into the per-index accumulators. */
function accumulateToolCallDeltas(
  accumulator: Map<number, ToolCallAccumulator>,
  deltas:
    | Array<{
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>
    | undefined,
): void {
  if (!deltas) {
    return;
  }
  deltas.forEach((delta, position) => {
    const index = delta.index ?? position;
    const entry = accumulator.get(index) ?? { args: '' };
    if (delta.id) {
      entry.id = delta.id;
    }
    if (delta.function?.name) {
      entry.name = delta.function.name;
    }
    if (delta.function?.arguments) {
      entry.args += delta.function.arguments;
    }
    accumulator.set(index, entry);
  });
}

/**
 * Parses every accumulated tool call's arguments into one canonical `tool_call` event per call,
 * in index order. Stops at the first malformed JSON payload and returns a single `{type:'error'}`
 * event instead — the orchestration loop owns retrying.
 */
function finalizeToolCalls(
  accumulator: Map<number, ToolCallAccumulator>,
): StreamEvent[] {
  const indices = [...accumulator.keys()].sort((left, right) => left - right);
  const events: StreamEvent[] = [];
  for (const index of indices) {
    const entry = accumulator.get(index) as ToolCallAccumulator;
    const name = entry.name ?? '';
    let parsedArguments: Record<string, unknown>;
    try {
      parsedArguments = entry.args.trim() ? JSON.parse(entry.args) : {};
    } catch {
      return [
        {
          type: 'error',
          message: `Provider returned malformed tool call arguments for "${name}": ${entry.args}`,
        },
      ];
    }
    const toolCall: ToolCall = {
      id: entry.id ?? randomUUID(),
      name,
      arguments: parsedArguments,
    };
    events.push({ type: 'tool_call', toolCall });
  }
  return events;
}

/** True when finalizeToolCalls() had to bail out on malformed JSON instead of parsing cleanly. */
function hasToolCallError(events: StreamEvent[]): boolean {
  return events.some(event => event.type === 'error');
}
