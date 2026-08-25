import { randomUUID } from 'crypto';
import {
  CanonicalToolChoice,
  ChatMessage,
  ProviderConfig,
  StreamEvent,
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
import {
  fetchProviderWithRetry,
  describeToolUseFailedStreamMessage,
} from './retry';
import {
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  DEFAULT_ANTHROPIC_VERSION,
} from '../../common/constants';
import {
  assertProviderUrlAllowed,
  PROVIDER_FETCH_REDIRECT_POLICY,
} from './url-guard';
import { fetchWithTemperatureFallback } from './temperature-fallback';

/** Per content-block-index accumulation of a streamed `tool_use` block until it closes. */
interface ToolUseAccumulator {
  id: string;
  name: string;
  json: string;
}

/**
 * Adapter for the Anthropic Messages API. Unlike the OpenAI-compatible shape, system messages
 * are a top-level field (not part of the messages array) and `max_tokens` is required.
 */
export class AnthropicAdapter implements ProviderAdapter {
  async *chatStream(
    config: ProviderConfig,
    messages: ChatMessage[],
    signal: AbortSignal,
    options?: ChatStreamOptions,
  ): AsyncIterable<StreamEvent> {
    const url = `${trimTrailingSlash(config.baseUrl)}/v1/messages`;

    // Fetch-time SSRF guard -- see server/providers/url-guard.ts for the full policy and
    // why this must run here rather than only at settings.ts save time.
    try {
      await assertProviderUrlAllowed(url);
    } catch (error) {
      yield { type: 'error', message: describeError(error) };
      return;
    }

    const systemMessages = messages.filter(
      message => message.role === 'system',
    );
    const conversationMessages = messages.filter(
      message => message.role !== 'system',
    );

    const toolChoice = options?.toolChoice ?? 'auto';
    // 'none' means the model must not call any tool at all; the only way to guarantee that on
    // the Anthropic wire is to omit `tools` entirely rather than pass a tool_choice value for it.
    const includeTools =
      Boolean(options?.tools?.length) && toolChoice !== 'none';

    const doFetch = (includeTemperature: boolean): Promise<Response> =>
      fetch(url, {
        method: 'POST',
        signal,
        redirect: PROVIDER_FETCH_REDIRECT_POLICY,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey ?? '',
          'anthropic-version': DEFAULT_ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          max_tokens: DEFAULT_ANTHROPIC_MAX_TOKENS,
          // Checked for `undefined`, not truthiness -- same reasoning as
          // openai-compatible.ts's identical guard: a caller-sent `temperature: 0` must survive.
          // `includeTemperature` additionally gates it on whether this model is already known (this
          // process) to reject the parameter outright, which on the Anthropic Messages API is not an
          // edge case but the norm for every current model: `temperature` was REMOVED on Claude
          // Opus 4.7 and later (Opus 4.7/4.8, Opus 5, Sonnet 5, Fable 5) and is answered with a 400.
          // Because the stage-1 router sends `temperature: 0` on EVERY turn (routes/chat.ts) and the
          // tool-bearing rounds send 0.2, without this fallback an Anthropic provider on any of
          // those models could not complete a single turn -- the 400 ended the turn and the UI
          // showed nothing but "Response interrupted".
          ...(includeTemperature && options?.temperature !== undefined
            ? { temperature: options.temperature }
            : {}),
          ...(systemMessages.length
            ? {
                system: systemMessages
                  .map(message => message.content)
                  .join('\n\n'),
              }
            : {}),
          messages: conversationMessages.map(toAnthropicMessage),
          ...(includeTools && options?.tools
            ? {
                tools: toAnthropicTools(options.tools),
                tool_choice: {
                  ...toAnthropicToolChoice(toolChoice),
                  disable_parallel_tool_use: true,
                },
              }
            : {}),
        }),
      });

    const response = yield* fetchProviderWithRetry(
      // Shared with openai-compatible.ts -- see temperature-fallback.ts's doc comment.
      () => fetchWithTemperatureFallback(config, options?.temperature, doFetch),
      signal,
      // See server/providers/retry.ts's sanitizeProviderErrorBody doc comment for why the
      // exact configured key is passed through here.
      config.apiKey,
    );
    if (!response) {
      return;
    }

    const toolUses = new Map<number, ToolUseAccumulator>();

    try {
      for await (const payload of iterateSseLines(response.body, signal)) {
        let parsed: {
          type?: string;
          index?: number;
          content_block?: { type?: string; id?: string; name?: string };
          delta?: { type?: string; text?: string; partial_json?: string };
          usage?: { input_tokens?: number; output_tokens?: number };
          message?: {
            usage?: { input_tokens?: number; output_tokens?: number };
          };
          error?: { message?: string };
        };
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        const blockIndex = parsed.index ?? 0;

        if (
          parsed.type === 'content_block_start' &&
          parsed.content_block?.type === 'tool_use'
        ) {
          toolUses.set(blockIndex, {
            id: parsed.content_block.id ?? randomUUID(),
            name: parsed.content_block.name ?? '',
            json: '',
          });
        } else if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'input_json_delta'
        ) {
          const entry = toolUses.get(blockIndex);
          if (entry) {
            entry.json += parsed.delta.partial_json ?? '';
          }
        } else if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.text
        ) {
          yield { type: 'delta', content: parsed.delta.text };
        } else if (parsed.type === 'content_block_stop') {
          const entry = toolUses.get(blockIndex);
          if (entry) {
            let parsedArguments: Record<string, unknown>;
            try {
              parsedArguments = entry.json.trim() ? JSON.parse(entry.json) : {};
            } catch {
              yield {
                type: 'error',
                message:
                  `Provider returned malformed tool call arguments for ` +
                  `"${entry.name}": ${entry.json}`,
              };
              return;
            }
            yield {
              type: 'tool_call',
              toolCall: {
                id: entry.id,
                name: entry.name,
                arguments: parsedArguments,
              },
            };
            toolUses.delete(blockIndex);
          }
        } else if (parsed.type === 'error') {
          const rawMessage = parsed.error?.message ?? 'Unknown provider error';
          yield {
            type: 'error',
            message:
              describeToolUseFailedStreamMessage(rawMessage) ?? rawMessage,
          };
          return;
        } else if (parsed.type === 'message_stop') {
          yield { type: 'done' };
          return;
        } else if (parsed.type === 'message_delta' && parsed.usage) {
          yield {
            type: 'done',
            usage: {
              inputTokens: parsed.usage.input_tokens,
              outputTokens: parsed.usage.output_tokens,
            },
          };
          return;
        }
      }
      yield { type: 'done' };
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      yield { type: 'error', message: describeConnectionError(error) };
    }
  }
}

/** Maps a canonical ChatMessage onto the Anthropic Messages API wire shape for one message. */
function toAnthropicMessage(message: ChatMessage): Record<string, unknown> {
  if (message.role === 'tool') {
    return {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: message.toolCallId,
          content: message.content,
        },
      ],
    };
  }
  if (message.role === 'assistant' && message.toolCalls?.length) {
    const blocks: Array<Record<string, unknown>> = [];
    // Defense in depth: chat.ts already trims round narration before it lands in history (issue
    // C4 follow-up), but a whitespace-only `content` (e.g. a bare priming "\n\n" a model streams
    // before a tool call) must never become a text block here either -- Anthropic's Messages API
    // rejects a whitespace-only text block with a 400.
    if (message.content && message.content.trim()) {
      blocks.push({ type: 'text', text: message.content });
    }
    for (const call of message.toolCalls) {
      blocks.push({
        type: 'tool_use',
        id: call.id,
        name: call.name,
        input: call.arguments,
      });
    }
    return { role: 'assistant', content: blocks };
  }
  return { role: message.role, content: message.content };
}

function toAnthropicTools(tools: ToolSpec[]): Array<Record<string, unknown>> {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: widenNumericTypes(tool.parameters),
  }));
}

function toAnthropicToolChoice(
  choice: CanonicalToolChoice,
): Record<string, unknown> {
  if (choice === 'required') {
    return { type: 'any' };
  }
  if (typeof choice === 'object') {
    return { type: 'tool', name: choice.name };
  }
  // 'auto' (and 'none', which never reaches here — see includeTools above).
  return { type: 'auto' };
}
