import assert from 'node:assert/strict';
import {
  DigestRecord,
  NO_TEXT_SYNTHESIS_INSTRUCTION,
  summarizeDigestForFallback,
  synthesizeNoTextFallback,
} from './chat';
import { Pseudonymizer } from '../tools/privacy';
import { PrivacyContext } from '../tools/executor';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * FORCED SYNTHESIS (measured design, replacing the "No additional analysis — see the results
 * above." live failure -- 2/36 GA runs + manual sessions, a canned non-answer rendered ABOVE a
 * collapsed table with real, non-empty results).
 *
 * Drives `synthesizeNoTextFallback` directly with a scripted fake adapter -- same pattern as
 * chat-stage1-usage.test.ts's `runStage1Routing` harness -- rather than standing up a whole
 * `orchestrate` turn for every case, since this mechanism's contract (one retry call, no tools
 * offered, same scrub/depseudonymize pipeline, deterministic fallback derived from the digest) is
 * fully exercised at this one function's boundary.
 *
 * NOTE (needs the OSD tree to actually run): imports `./chat`, which imports
 * `@osd/config-schema` -- unresolvable outside the full wazuh-dashboard checkout this repo is
 * normally built against. Same colocated-unit-test convention as every other chat-*.test.ts file
 * in this directory.
 */

const PROVIDER_CONFIG: ProviderConfig = {
  id: 'p-1',
  name: 'test provider',
  type: 'openai_compatible',
  baseUrl: 'http://127.0.0.1:19999/v1',
  model: 'gpt-oss-120b',
};

const TURN_MESSAGES: ChatMessage[] = [
  { role: 'system', content: 'system prompt' },
  { role: 'user', content: 'which agents have critical findings?' },
  {
    role: 'assistant',
    content: '',
    toolCalls: [
      { id: 'call_1', name: 'get_critical_findings', arguments: {} },
    ],
  },
  {
    role: 'tool',
    content: JSON.stringify({
      tool: 'get_critical_findings',
      counts: { total: 15, returned: 15, truncated: false },
      samples: [],
    }),
    toolCallId: 'call_1',
  },
];

function nonEmptyDigest(overrides: Record<string, unknown> = {}): DigestRecord {
  return {
    toolName: 'get_critical_findings',
    content: JSON.stringify({
      tool: 'get_critical_findings',
      counts: { total: 15, returned: 15, truncated: false },
      samples: [],
      ...overrides,
    }),
  };
}

/** Scripted single-call fake adapter: captures the `messages`/`options` it was invoked with (so
 * tests can assert no tools were offered and the outbound messages carry the synthesis
 * instruction), and streams back exactly the given events. */
function scriptedAdapter(events: StreamEvent[] | (() => never)): {
  adapter: ProviderAdapter;
  calls: Array<{ messages: ChatMessage[]; options: ChatStreamOptions | undefined }>;
} {
  const calls: Array<{
    messages: ChatMessage[];
    options: ChatStreamOptions | undefined;
  }> = [];
  return {
    calls,
    adapter: {
      async *chatStream(
        _config: ProviderConfig,
        messages: ChatMessage[],
        _signal: AbortSignal,
        options?: ChatStreamOptions,
      ): AsyncIterable<StreamEvent> {
        calls.push({ messages, options });
        if (typeof events === 'function') {
          events();
          return;
        }
        for (const event of events) {
          yield event;
        }
      },
    },
  };
}

async function drain(
  gen: AsyncGenerator<StreamEvent, { usage?: unknown }, void>,
): Promise<{ events: StreamEvent[]; result: { usage?: unknown } }> {
  const events: StreamEvent[] = [];
  let step = await gen.next();
  while (!step.done) {
    events.push(step.value);
    // eslint-disable-next-line no-await-in-loop -- generator steps are sequential by contract
    step = await gen.next();
  }
  return { events, result: step.value };
}

// --- summarizeDigestForFallback: truthful, deterministic, digest-derived ----------------------

test('summarizeDigestForFallback: states the returned count from the digest', () => {
  const sentence = summarizeDigestForFallback(
    nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } }),
  );
  assert.match(sentence, /returned 15 rows/);
  assert.doesNotMatch(
    sentence,
    /No additional analysis/,
    'must never be the layout-lying copy this mechanism replaces',
  );
});

test('summarizeDigestForFallback: states BOTH returned and total when they differ (truncation)', () => {
  const sentence = summarizeDigestForFallback(
    nonEmptyDigest({ counts: { total: 300, returned: 20, truncated: true } }),
  );
  assert.match(sentence, /returned 20 rows of 300 total/);
});

test('summarizeDigestForFallback: singular "row" for exactly one result', () => {
  const sentence = summarizeDigestForFallback(
    nonEmptyDigest({ counts: { returned: 1, truncated: false } }),
  );
  assert.match(sentence, /returned 1 row;/);
});

test('summarizeDigestForFallback: degrades gracefully on unparseable digest content', () => {
  const sentence = summarizeDigestForFallback({
    toolName: 'get_critical_findings',
    content: 'not json',
  });
  assert.match(sentence, /get_critical_findings/);
  assert.doesNotMatch(sentence, /No additional analysis/);
});

// --- synthesizeNoTextFallback: case (a) — the model-authored retry ----------------------------

test('synthesizeNoTextFallback: retries with NO tools offered and the synthesis instruction appended', async () => {
  const { adapter, calls } = scriptedAdapter([
    { type: 'delta', content: '15 critical findings were found across agents.' },
    { type: 'done', usage: { inputTokens: 40, outputTokens: 12 } },
  ]);
  const controller = new AbortController();

  const { events, result } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest()],
    ),
  );

  assert.equal(calls.length, 1, 'exactly one retry call is made');
  assert.deepEqual(
    calls[0].options,
    {},
    'the retry offers no tools -- it cannot re-enter the tool loop',
  );
  const lastOutbound = calls[0].messages[calls[0].messages.length - 1];
  assert.equal(lastOutbound.role, 'system');
  assert.equal(lastOutbound.content, NO_TEXT_SYNTHESIS_INSTRUCTION);
  assert.equal(
    calls[0].messages.length,
    TURN_MESSAGES.length + 1,
    'appended to a COPY, the turn messages themselves are untouched',
  );

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    type: 'delta',
    content: '15 critical findings were found across agents.',
  });
  assert.deepEqual(result, { usage: { inputTokens: 40, outputTokens: 12 } });
});

test('synthesizeNoTextFallback: streams the retry text through the SAME depseudonymize pipeline', async () => {
  const pseudonymizer = new Pseudonymizer([
    { value: '10.0.0.5', pseudonym: 'IP_1' },
  ]);
  const privacyCtx: PrivacyContext = { pseudonymizer, fieldPolicy: [] };
  const { adapter } = scriptedAdapter([
    { type: 'delta', content: 'The agent at IP_1 has 15 findings.' },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      privacyCtx,
      [nonEmptyDigest()],
    ),
  );

  const text = events
    .filter((e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta')
    .map(e => e.content)
    .join('');
  assert.match(
    text,
    /10\.0\.0\.5/,
    'the real IP must be restored before the delta reaches the client, same as every other round',
  );
  assert.doesNotMatch(text, /IP_1/);
});

// --- synthesizeNoTextFallback: case (b) — errors or empty retry fall back to the digest sentence

test('synthesizeNoTextFallback: an adapter error falls back to the truthful digest sentence, never the layout-lying copy', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'error', message: 'upstream 500' },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } })],
    ),
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'delta');
  assert.match((events[0] as { content: string }).content, /returned 15 rows/);
  assert.doesNotMatch(
    (events[0] as { content: string }).content,
    /No additional analysis/,
  );
});

test('synthesizeNoTextFallback: a retry that throws mid-stream falls back to the digest sentence', async () => {
  const adapter: ProviderAdapter = {
    // eslint-disable-next-line require-yield -- the generator throws before any event, on purpose
    async *chatStream() {
      throw new Error('network died');
    },
  };
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } })],
    ),
  );

  assert.equal(events.length, 1);
  assert.match((events[0] as { content: string }).content, /returned 15 rows/);
});

test('synthesizeNoTextFallback: a retry that ends with only whitespace text falls back to the digest sentence', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'delta', content: '   \n\n  ' },
    { type: 'done', usage: { inputTokens: 5, outputTokens: 1 } },
  ]);
  const controller = new AbortController();

  const { events, result } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } })],
    ),
  );

  const deltas = events.filter(
    (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
  );
  assert.ok(
    deltas.some(e => /returned 15 rows/.test(e.content)),
    'whitespace-only model output must not count as an answer',
  );
  // Usage is still accounted even though the retry produced nothing usable.
  assert.deepEqual(result, { usage: { inputTokens: 5, outputTokens: 1 } });
});

// --- synthesizeNoTextFallback: hard bounds (c) -------------------------------------------------

test('synthesizeNoTextFallback: an already-aborted signal makes NO retry call, only the deterministic sentence', async () => {
  const { adapter, calls } = scriptedAdapter([
    { type: 'delta', content: 'should never be read' },
    { type: 'done', usage: { inputTokens: 999, outputTokens: 999 } },
  ]);
  const controller = new AbortController();
  controller.abort();

  const { events, result } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } })],
    ),
  );

  assert.equal(calls.length, 0, '(c): no extra adapter call is made once aborted');
  assert.equal(events.length, 1);
  assert.match((events[0] as { content: string }).content, /returned 15 rows/);
  assert.deepEqual(
    result,
    { usage: undefined },
    'no call was made, so no usage is fabricated for it',
  );
});

test('synthesizeNoTextFallback: an empty digest list makes no retry call and yields nothing', async () => {
  const { adapter, calls } = scriptedAdapter([
    { type: 'delta', content: 'should never be read' },
    { type: 'done', usage: { inputTokens: 999, outputTokens: 999 } },
  ]);
  const controller = new AbortController();

  const { events, result } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [],
    ),
  );

  assert.equal(calls.length, 0);
  assert.deepEqual(events, []);
  assert.deepEqual(result, { usage: undefined });
});

test('synthesizeNoTextFallback: aborting MID-STREAM stops forwarding further deltas', async () => {
  const controller = new AbortController();
  const adapter: ProviderAdapter = {
    async *chatStream(): AsyncIterable<StreamEvent> {
      yield { type: 'delta', content: 'first sentence. ' };
      controller.abort();
      yield { type: 'delta', content: 'second sentence should not reach the client.' };
      yield { type: 'done', usage: { inputTokens: 10, outputTokens: 10 } };
    },
  };

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } })],
    ),
  );

  const text = events
    .filter((e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta')
    .map(e => e.content)
    .join('');
  assert.doesNotMatch(text, /second sentence/);
});
