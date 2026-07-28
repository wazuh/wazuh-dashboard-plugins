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
      messages: messages.map(toOpenAiMessage),
    };
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

    try {
      for await (const payload of iterateSseLines(response.body, signal)) {
        if (payload === '[DONE]') {
          const finalized = finalizeToolCalls(toolCalls);
          yield* finalized;
          if (!hasToolCallError(finalized)) {
            yield { type: 'done' };
          }
          return;
        }
        let parsed: {
          choices?: Array<{
            delta?: {
              content?: string;
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
          yield { type: 'delta', content: delta };
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
