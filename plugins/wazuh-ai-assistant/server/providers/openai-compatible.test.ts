import assert from 'node:assert/strict';
import { OpenAiCompatibleAdapter } from './openai-compatible';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';

// Covers three fixes that all land on this adapter's request/response handling:
//  - the reasoning-channel fallback (issue 02-read-reasoning-delta.md): some reasoning models
//    (gpt-oss, qwen3.x) stream their entire answer on `delta.reasoning` instead of
//    `delta.content`, which this adapter previously discarded outright, producing a
//    billed-but-blank answer;
//  - the final-round tools/tool_choice omission (issue 03-tool-choice-none-final-round.md);
//  - the outbound `temperature` plumbing (issue 05-set-temperature-for-tool-calls.md).

function userMessage(content: string): ChatMessage {
  return { role: 'user', content };
}

const BASE_CONFIG: ProviderConfig = {
  id: 'oa-1',
  name: 'OpenAI-compatible',
  type: 'openai_compatible',
  // A literal loopback IP: no DNS resolution path is exercised (assertProviderUrlAllowed's
  // literal-IP branch is synchronous), so this test has no network dependency at all.
  baseUrl: 'http://127.0.0.1:19999/v1',
  model: 'gpt-oss-120b',
  apiKey: 'test-key',
};

/** Builds an SSE body out of raw JSON chunk objects, terminated with the `[DONE]` sentinel every
 * OpenAI-compatible provider sends — matches this adapter's `[DONE]`-exit path. */
function sseBody(chunks: Array<Record<string, unknown>>): string {
  return (
    chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') +
    'data: [DONE]\n\n'
  );
}

async function drain(
  iterable: AsyncIterable<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

function withFakeFetch<T>(
  responseBody: string,
  run: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )) as unknown as typeof fetch;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

/** Same as withFakeFetch, but also captures every outbound request body -- needed to assert on
 * what the adapter actually sent (issue 03's final-round shape, issue 05's temperature). */
function withFakeFetchCapturingBody(
  responseBody: string,
  run: (capturedBodies: Array<Record<string, unknown>>) => Promise<unknown>,
): Promise<Array<Record<string, unknown>>> {
  const original = globalThis.fetch;
  const capturedBodies: Array<Record<string, unknown>> = [];
  globalThis.fetch = ((_url: string, init?: RequestInit) => {
    if (typeof init?.body === 'string') {
      capturedBodies.push(JSON.parse(init.body));
    }
    return Promise.resolve(
      new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );
  }) as unknown as typeof fetch;
  // Resolves with the CAPTURED BODIES, not `run`'s own result: every caller writes
  // `const capturedBodies = await withFakeFetchCapturingBody(...)` and asserts on the outbound
  // request bodies. (An earlier version resolved with run()'s drained events instead, which made
  // all four body-shape assertions inspect StreamEvents -- caught by the first real jest run.)
  return run(capturedBodies)
    .then(() => capturedBodies)
    .finally(() => {
      globalThis.fetch = original;
    });
}

test('chatStream: a stream carrying only delta.reasoning (no delta.content at all) renders the accumulated reasoning as the answer', async () => {
  const body = sseBody([
    {
      choices: [
        { index: 0, delta: { reasoning: 'The', channel: 'analysis' } },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: { reasoning: ' user asks about hosts.', channel: 'analysis' },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('what should I look at?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'a reasoning-only stream must still surface non-empty text instead of an empty done',
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'The user asks about hosts.',
  );
});

test('chatStream: a normal delta.content stream is unchanged (regression) — no reasoning text appended', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: { reasoning: 'thinking about it...', channel: 'analysis' },
        },
      ],
    },
    {
      choices: [{ index: 0, delta: { content: 'The cluster is healthy.' } }],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('status?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'exactly one delta must reach the caller -- the reasoning text must not be appended',
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'The cluster is healthy.',
    'must be the content delta only, never the reasoning text mixed in',
  );
});

test('chatStream: reasoning deltas followed by a tool call, closed only by [DONE] (no finish_reason, no content) -- must yield the tool call and NO delta text', async () => {
  // The hazard this guards against: a provider can close a tool round through the `[DONE]` exit
  // without ever sending `finish_reason: 'tool_calls'` (gpt-oss/Groq happens to send it, but
  // nothing in the wire format guarantees that). Reasoning routinely precedes a tool call on the
  // analysis channel, so `reasoningBuffer` is typically non-empty exactly when this happens --
  // without the `hadToolCalls` gate, that buffered chain-of-thought would be injected as if it
  // were the answer for what is actually a TOOL round with no answer due yet.
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            reasoning: 'I should check the agent list.',
            channel: 'analysis',
          },
        },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    "no delta event must be emitted -- the buffered reasoning must not leak into a tool round's answer text",
  );
});

test('chatStream: a stream with neither content nor reasoning still ends cleanly with just done (no phantom fallback text)', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: {} }] }]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(BASE_CONFIG, [userMessage('hi')], controller.signal),
    );
  });
  assert.deepEqual(events.map(event => event.type), ['done']);
});

// --- final-round tools/tool_choice omission (issue 03-tool-choice-none-final-round.md) --------
// chat.ts's orchestrate() now sends `{}` (no `tools` at all) instead of
// `{tools, toolChoice: 'none'}` on the final round, relying on this adapter's existing
// `if (options?.tools?.length)` guard to drop `tools`/`tool_choice` from the wire body for free.

test('chatStream: with no `tools` in options, the outbound body carries neither `tools` nor `tool_choice` (final-round shape)', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Done.' } }] },
  ]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('final answer please')],
        controller.signal,
        {},
      ),
    );
  });
  assert.equal(capturedBodies.length, 1);
  assert.ok(
    !('tools' in capturedBodies[0]),
    'tools must be entirely absent, not an empty array',
  );
  assert.ok(!('tool_choice' in capturedBodies[0]));
});

test('chatStream: with `tools` present, the outbound body still carries `tools` and `tool_choice` (regression)', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Done.' } }] },
  ]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
        {
          tools: [
            {
              name: 'get_agents',
              description: 'list agents',
              parameters: { type: 'object', properties: {} },
            },
          ],
          toolChoice: 'auto',
        },
      ),
    );
  });
  assert.equal(capturedBodies.length, 1);
  assert.ok('tools' in capturedBodies[0]);
  assert.equal(capturedBodies[0].tool_choice, 'auto');
});

// --- temperature plumbing (issue 05-set-temperature-for-tool-calls.md) ------------------------
// chat.ts sets 0 for the stage-1 router call and 0.2 on tool-bearing orchestrate rounds; this
// adapter's job is just to forward whatever is given, verbatim, including a literal 0.

test('chatStream: options.temperature is forwarded verbatim on the outbound body, including 0', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('route this')],
        controller.signal,
        { temperature: 0 },
      ),
    );
  });
  assert.equal(
    capturedBodies[0].temperature,
    0,
    'temperature: 0 must survive -- a truthiness check would silently drop it',
  );
});

test('chatStream: a tool-bearing request with temperature 0.2 carries it alongside tools', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
        {
          tools: [
            {
              name: 'get_agents',
              description: 'list agents',
              parameters: { type: 'object', properties: {} },
            },
          ],
          toolChoice: 'auto',
          temperature: 0.2,
        },
      ),
    );
  });
  assert.equal(capturedBodies[0].temperature, 0.2);
  assert.ok('tools' in capturedBodies[0]);
});

test('chatStream: omitting options.temperature leaves the field out of the body entirely (regression -- no default injected)', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('plain chat, no options')],
        controller.signal,
      ),
    );
  });
  assert.ok(!('temperature' in capturedBodies[0]));
});

// --- inline reasoning markup stripping (issue 18-strip-inline-reasoning-markup.md) -------------
// Unit coverage for the character-level tag-matching/holdback logic itself lives beside the
// filter (inline-reasoning-markup-filter.test.ts, following markdown-table-filter.test.ts's
// style). These tests cover this ADAPTER's wiring of it: every exit path flushes it, `sawContent`
// reflects the FILTERED result (not raw `delta.content`), and the reasoning-channel fallback's
// precedence against fully-stripped inline content.

test('chatStream: a <think> block in delta.content is stripped before reaching the client', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            content: '<think>\nI should check the host facts.\n</think>\n\nIt has 16GB RAM.',
          },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('how much RAM does this host have?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(events.map(event => event.type), ['delta', 'done']);
  assert.equal((events[0] as { content: string }).content, '\n\nIt has 16GB RAM.');
});

test('chatStream: a <think> tag straddling two SSE chunks is still stripped', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Sure. <thi' } }] },
    { choices: [{ index: 0, delta: { content: 'nk>hidden</think> here it is.' } }] },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('question')],
        controller.signal,
      ),
    );
  });
  const text = events
    .filter(event => event.type === 'delta')
    .map(event => (event as { content: string }).content)
    .join('');
  assert.equal(text, 'Sure.  here it is.');
});

test('chatStream: an unclosed <think> running to [DONE] is dropped, not shown', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: { content: 'Answer first. <think>never closes, stream just ends' },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('question')],
        controller.signal,
      ),
    );
  });
  const text = events
    .filter(event => event.type === 'delta')
    .map(event => (event as { content: string }).content)
    .join('');
  assert.equal(text, 'Answer first. ');
});

test('chatStream: <tool_call>/<function=>/<parameter=> markup emitted as delta.content text (not a real tool call) is stripped', async () => {
  // Verbatim shape from the issue: the model attempts a tool call AS TEXT instead of a structured
  // `tool_calls` delta, and the block is left unclosed when the stream ends.
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            content:
              '<tool_call>\n<function=search_wazuh_data>\n<parameter=index_pattern>\nwazuh-states-*\n',
          },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('how much RAM and what CPU does this host have?')],
        controller.signal,
      ),
    );
  });
  // Entirely markup, no real answer text at all -- no delta at all, just done (the route-level
  // no-text fallback in chat.ts, not this adapter, is what turns this into a user-facing sentence;
  // see the `noTextFallbackMessage`-interaction test below for the adapter's own analogous case).
  assert.deepEqual(events.map(event => event.type), ['done']);
});

test('chatStream: a legitimate <script> mention and a "size < 500" comparison are preserved verbatim (regression)', async () => {
  const answer =
    'The rule flags any payload containing a <script> tag. Only alerts where size < 500 and severity > 3 were kept.';
  const body = sseBody([{ choices: [{ index: 0, delta: { content: answer } }] }]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('explain the rule')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(events.map(event => event.type), ['delta', 'done']);
  assert.equal(
    (events[0] as { content: string }).content,
    answer,
    'ordinary angle brackets/comparisons must never be touched by the markup filter',
  );
});

test('chatStream: a gpt-oss-style clean stream (no inline markup at all) is byte-identical', async () => {
  const answer = 'The cluster is healthy. 3 agents are active and reporting.';
  const body = sseBody([{ choices: [{ index: 0, delta: { content: answer } }] }]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(BASE_CONFIG, [userMessage('status?')], controller.signal),
    );
  });
  assert.deepEqual(events, [{ type: 'delta', content: answer }, { type: 'done' }]);
});

test('chatStream: content that is ENTIRELY <think> markup is treated as no content -- the reasoning-channel buffer wins instead', async () => {
  // Precedence case: the provider sends the SAME deliberation on both channels -- the dedicated
  // `reasoning` field (issue 02's fallback) and, leaked, inline in `content` wrapped in <think>.
  // Once inline `content` is fully stripped, `sawContent` must reflect that (not the raw
  // `delta.content` presence) so `reasoningFallback` can still supply an answer instead of the
  // turn silently ending with no text at all.
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            content: '<think>the host has 16GB RAM and 4 vCPUs</think>',
            reasoning: 'the host has 16GB RAM and 4 vCPUs',
            channel: 'analysis',
          },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('how much RAM does this host have?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'a fully-stripped content delta must not count as "the model produced an answer"',
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'the host has 16GB RAM and 4 vCPUs',
    'reasoningBuffer must step in once inline content evaporates entirely',
  );
});

test('chatStream: markup preceding a real tool call is stripped and flushed before the tool_call event (finish_reason exit)', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: { content: '<think>I should check the agent list.</think>' },
        },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    'the fully-stripped <think> block must not surface as a phantom delta ahead of the tool call',
  );
});
