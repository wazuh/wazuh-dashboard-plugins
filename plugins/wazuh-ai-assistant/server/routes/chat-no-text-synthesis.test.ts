import assert from 'node:assert/strict';
import {
  DigestRecord,
  NO_TEXT_SYNTHESIS_INSTRUCTION,
  NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY,
  summarizeDigestForFallback,
  summarizeDigestsForFallback,
  synthesizeNoTextFallback,
  withNoTextSynthesisInstruction,
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
    toolCalls: [{ id: 'call_1', name: 'get_critical_findings', arguments: {} }],
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
  calls: Array<{
    messages: ChatMessage[];
    options: ChatStreamOptions | undefined;
  }>;
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

// --- BLOCKER FIX: residual single-digest collapse -----------------------------------------------

test(
  "summarizeDigestForFallback: names the tool's plain-language domain, not just the bare " +
    '"The query returned..." wording',
  () => {
    const sentence = summarizeDigestForFallback(
      nonEmptyDigest({ counts: { total: 1, returned: 1, truncated: false } }),
    );
    // get_critical_findings -> "critical findings" (verb prefix stripped), same convention
    // buildNoMatchingResultsMessage already uses for the empty-result sibling of this fallback.
    assert.match(sentence, /The critical findings query returned 1 row/);
  },
);

test(
  'summarizeDigestForFallback: names the row schema (field names) when the digest carries ' +
    'columns (a single search_wazuh_data findings result)',
  () => {
    const sentence = summarizeDigestForFallback({
      toolName: 'search_wazuh_data',
      content: JSON.stringify({
        counts: { total: 1, returned: 1, truncated: false },
        samples: [{}],
        columns: ['detector.name', 'wazuh.rule.title', '@timestamp'],
      }),
    });
    assert.match(sentence, /returned 1 row/);
    assert.match(
      sentence,
      /fields: detector\.name, wazuh\.rule\.title, @timestamp/,
    );
  },
);

test('summarizeDigestForFallback: caps the named fields and says "+N more" for a wide row schema', () => {
  const sentence = summarizeDigestForFallback({
    toolName: 'search_wazuh_data',
    content: JSON.stringify({
      counts: { total: 1, returned: 1 },
      samples: [{}],
      columns: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }),
  });
  assert.match(sentence, /fields: a, b, c, d, e, \+2 more/);
});

test(
  'summarizeDigestForFallback: a digest with no columns field degrades to the pre-fix ' +
    'sentence shape (no "fields:" clause)',
  () => {
    const sentence = summarizeDigestForFallback(
      nonEmptyDigest({ counts: { total: 15, returned: 15, truncated: false } }),
    );
    assert.doesNotMatch(sentence, /fields:/);
  },
);

test('summarizeDigestForFallback: degrades gracefully on unparseable digest content', () => {
  const sentence = summarizeDigestForFallback({
    toolName: 'get_critical_findings',
    content: 'not json',
  });
  assert.match(sentence, /get_critical_findings/);
  assert.doesNotMatch(sentence, /No additional analysis/);
});

// --- summarizeDigestsForFallback: BLOCKER FIX for a sweep collapse -------------------------------

test('summarizeDigestsForFallback: single digest degrades to the same sentence as summarizeDigestForFallback', () => {
  const digest = nonEmptyDigest({
    counts: { total: 15, returned: 15, truncated: false },
  });
  assert.equal(
    summarizeDigestsForFallback([digest]),
    summarizeDigestForFallback(digest),
  );
});

test('summarizeDigestsForFallback: covers EVERY tool call, not just the last one', () => {
  const digests: DigestRecord[] = [
    {
      toolName: 'get_top_rules',
      content: JSON.stringify({ counts: { total: 10, returned: 10 } }),
    },
    {
      toolName: 'get_critical_findings',
      content: JSON.stringify({ counts: { total: 15, returned: 15 } }),
    },
    {
      toolName: 'get_top_agents',
      content: JSON.stringify({ counts: { total: 6, returned: 6 } }),
    },
    {
      toolName: 'get_mitre_summary',
      content: JSON.stringify({ counts: { total: 20, returned: 20 } }),
    },
    {
      toolName: 'get_field_values',
      content: JSON.stringify({ counts: { total: 3, returned: 3 } }),
    },
  ];
  const sentence = summarizeDigestsForFallback(digests);
  // Every tool's own result must be named, not just get_field_values' (previously "The query
  // returned 3 rows" described ONLY the last of five successful calls).
  assert.match(sentence, /get_top_rules/);
  assert.match(sentence, /get_critical_findings/);
  assert.match(sentence, /get_top_agents/);
  assert.match(sentence, /get_mitre_summary/);
  assert.match(sentence, /get_field_values/);
  assert.match(sentence, /5 requested parts/);
});

test('summarizeDigestsForFallback: degrades gracefully per-record on unparseable content', () => {
  const sentence = summarizeDigestsForFallback([
    nonEmptyDigest({ counts: { total: 10, returned: 10 } }),
    { toolName: 'get_weird_tool', content: 'not json' },
  ]);
  assert.match(sentence, /get_critical_findings/);
  assert.match(sentence, /get_weird_tool/);
});

// --- synthesizeNoTextFallback: case (a) — the model-authored retry ----------------------------

test('synthesizeNoTextFallback: retries with NO tools offered and the synthesis instruction appended', async () => {
  const { adapter, calls } = scriptedAdapter([
    {
      type: 'delta',
      content: '15 critical findings were found across agents.',
    },
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
  // `user`, not `system` -- see `withNoTextSynthesisInstruction`'s doc comment for the Anthropic
  // system-hoisting reason the role matters.
  assert.equal(lastOutbound.role, 'user');
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
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
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

test('synthesizeNoTextFallback: a 5-digest sweep whose retry produces no text still names EVERY tool, not just the last one', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'done', usage: { inputTokens: 20, outputTokens: 0 } },
  ]);
  const controller = new AbortController();
  const digests: DigestRecord[] = [
    {
      toolName: 'get_top_rules',
      content: JSON.stringify({ counts: { total: 10, returned: 10 } }),
    },
    {
      toolName: 'get_critical_findings',
      content: JSON.stringify({ counts: { total: 15, returned: 15 } }),
    },
    {
      toolName: 'get_top_agents',
      content: JSON.stringify({ counts: { total: 6, returned: 6 } }),
    },
    {
      toolName: 'get_mitre_summary',
      content: JSON.stringify({ counts: { total: 20, returned: 20 } }),
    },
    {
      toolName: 'get_field_values',
      content: JSON.stringify({ counts: { total: 3, returned: 3 } }),
    },
  ];

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      digests,
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(text, /get_top_rules/);
  assert.match(text, /get_critical_findings/);
  assert.match(text, /get_top_agents/);
  assert.match(text, /get_mitre_summary/);
  assert.match(text, /get_field_values/);
  assert.notEqual(
    text.trim(),
    'The query returned 3 rows; the table below has the details.',
    'must never collapse to describing only the last tool call',
  );
});

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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
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

test('summarizeDigestForFallback: notes truncation without inventing the missing total', () => {
  const sentence = summarizeDigestForFallback(
    nonEmptyDigest({ counts: { returned: 20, truncated: true } }),
  );
  assert.match(sentence, /returned 20 rows.*truncated/);
});

// --- synthesizeNoTextFallback: buffer draining on error/abort (integration-review fix) ---------

test('synthesizeNoTextFallback: flushes held-back text on adapter error instead of losing it', async () => {
  const { adapter } = scriptedAdapter([
    // No trailing newline -- MarkdownTableSuppressor holds this in its line buffer until a
    // flush, exactly the text an unflushed error break used to drop on the floor.
    {
      type: 'delta',
      content: 'Fifteen findings were found across three agents',
    },
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(
    text,
    /Fifteen findings were found across three agents/,
    'held-back text must survive the error break, not be dropped',
  );
  assert.doesNotMatch(
    text,
    /the table below has the details/,
    'the flushed model text already produced an answer, so the deterministic digest sentence must not also be appended',
  );
});

test('synthesizeNoTextFallback: flushes held-back text on mid-stream abort instead of losing it', async () => {
  const controller = new AbortController();
  const adapter: ProviderAdapter = {
    async *chatStream(): AsyncIterable<StreamEvent> {
      yield { type: 'delta', content: 'Fifteen findings across three agents' };
      controller.abort();
      yield {
        type: 'delta',
        content: 'more text that must never reach the client',
      };
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(
    text,
    /Fifteen findings across three agents/,
    'text already streamed before the abort must not be dropped on the mid-stream-abort return',
  );
  assert.doesNotMatch(text, /more text that must never reach the client/);
});

// --- synthesizeNoTextFallback: reasoning-fallback text must not count as an answer -------------

test('synthesizeNoTextFallback: reasoning-fallback deltas do not suppress the truthful digest sentence', async () => {
  const { adapter } = scriptedAdapter([
    {
      type: 'delta',
      content: 'Deliberating over which tool would answer this...\n',
      reasoningFallback: true,
    },
    { type: 'done', usage: { inputTokens: 8, outputTokens: 4 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(
    text,
    /Deliberating over which tool would answer this/,
    'reasoning-fallback text is still forwarded to the client',
  );
  assert.match(
    text,
    /returned 15 rows/,
    'but it must NOT count as the retry producing an answer -- the truthful digest sentence must still be appended',
  );
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
    ),
  );

  assert.equal(
    calls.length,
    0,
    '(c): no extra adapter call is made once aborted',
  );
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
      yield {
        type: 'delta',
        content: 'second sentence should not reach the client.',
      };
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
      [
        nonEmptyDigest({
          counts: { total: 15, returned: 15, truncated: false },
        }),
      ],
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.doesNotMatch(text, /second sentence/);
});

// --- The ZERO-ROW turn is synthesizable too ----------------------------------------------------
//
// An all-empty turn (every tool call returned 0 rows) must still be ASKED for an answer rather than
// ending on `buildNoMatchingResultsMessage`'s canned line. Three things are pinned for that shape:
// which instruction is sent, that duplicate-table suppression stays OFF, and that a failed retry
// degrades to the caller's own copy rather than to a "table below" sentence pointing at an empty
// table.

function emptyDigest(): DigestRecord {
  return {
    toolName: 'get_critical_findings',
    content: JSON.stringify({
      tool: 'get_critical_findings',
      counts: { total: 0, returned: 0, truncated: false },
      hint: '0 rows. Filters applied: wazuh.rule.level, @timestamp.',
      samples: [],
    }),
  };
}

test('synthesizeNoTextFallback: a zero-row turn gets the EMPTY-result instruction, not the totals one', async () => {
  const { adapter, calls } = scriptedAdapter([
    {
      type: 'delta',
      content:
        'No findings at critical severity were recorded in the last 24 hours.',
    },
    { type: 'done', usage: { inputTokens: 30, outputTokens: 9 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [emptyDigest()],
      { tableOnScreen: false, lastResortMessage: 'CANNED NO-MATCH COPY' },
    ),
  );

  assert.equal(calls.length, 1, 'the zero-row turn now gets its one retry too');
  const lastOutbound = calls[0].messages[calls[0].messages.length - 1];
  assert.equal(lastOutbound.content, NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY);
  assert.notEqual(
    lastOutbound.content,
    NO_TEXT_SYNTHESIS_INSTRUCTION,
    'the non-empty instruction asks for totals and observations, which an empty result has none of',
  );
  assert.deepEqual(calls[0].options, {}, 'still no tools offered');
  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(text, /No findings at critical severity/);
  assert.doesNotMatch(
    text,
    /CANNED NO-MATCH COPY/,
    'the model answered, so the deterministic last resort must not also be appended',
  );
});

test('NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY: asks for a plain answer and fences speculation', () => {
  assert.match(NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY, /no matching rows/i);
  assert.match(
    NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY,
    /Do not speculate about why/i,
  );
  assert.match(NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY, /Do not call any tools/i);
  assert.doesNotMatch(
    NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY,
    /the table below/i,
    'there is no table on screen for an all-empty turn -- the copy must never point at one',
  );
});

test('synthesizeNoTextFallback: a failed zero-row retry degrades to the CALLER copy, never a "table below" sentence', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'done', usage: { inputTokens: 12, outputTokens: 0 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [emptyDigest()],
      {
        tableOnScreen: false,
        lastResortMessage:
          'No matching results were found for that query. (Searched: critical findings.)',
      },
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.equal(
    text,
    'No matching results were found for that query. (Searched: critical findings.)',
    'the floor never drops below the answer this shape already shipped',
  );
  assert.doesNotMatch(text, /the table below has the details/);
});

test('synthesizeNoTextFallback: with NO table on screen a model-written markdown table is NOT suppressed', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'delta', content: 'Nothing matched. For reference:\n' },
    {
      type: 'delta',
      content: '| policy | failed |\n| --- | --- |\n| cis | 0 |\n',
    },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 10 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [emptyDigest()],
      { tableOnScreen: false, lastResortMessage: 'CANNED' },
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(
    text,
    /\| policy \| failed \|/,
    'with nothing rendered there is no duplicate to suppress, so the suppressor must stay off',
  );
});

test('synthesizeNoTextFallback: with a table on screen the suppressor still strips a duplicate table', async () => {
  const { adapter } = scriptedAdapter([
    { type: 'delta', content: 'Fifteen critical findings.\n' },
    {
      type: 'delta',
      content: '| agent | level |\n| --- | --- |\n| a | high |\n',
    },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 10 } },
  ]);
  const controller = new AbortController();

  const { events } = await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      undefined,
      [nonEmptyDigest()],
    ),
  );

  const text = events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
  assert.match(text, /Fifteen critical findings/);
  assert.doesNotMatch(
    text,
    /\| agent \| level \|/,
    'default (tableOnScreen) behaviour is unchanged: a duplicate of the rendered table is held back',
  );
});

// --- The instruction must land at the CONVERSATION TAIL, not in `system` -----------------------

test('withNoTextSynthesisInstruction: appends the instruction as a trailing USER message, so it survives the Anthropic system-hoist', () => {
  const out = withNoTextSynthesisInstruction(TURN_MESSAGES, true);

  assert.equal(out.length, TURN_MESSAGES.length + 1);
  assert.deepEqual(
    out.slice(0, TURN_MESSAGES.length),
    TURN_MESSAGES,
    'outbound COPY only -- the turn history itself is untouched',
  );
  const last = out[out.length - 1];
  // The whole point: anthropic.ts filters every `system`-role message OUT of `messages` and joins
  // them into the top-level `system` field, so a `system` instruction never reaches the tail.
  assert.equal(last.role, 'user');
  assert.equal(last.content, NO_TEXT_SYNTHESIS_INSTRUCTION);
  assert.notEqual(
    last.role,
    'system',
    'a system-role instruction is hoisted into the prompt prefix on the Anthropic wire',
  );
});

test('withNoTextSynthesisInstruction: picks the zero-row copy when no table is on screen', () => {
  const out = withNoTextSynthesisInstruction(TURN_MESSAGES, false);
  const last = out[out.length - 1];

  assert.equal(last.role, 'user');
  assert.equal(last.content, NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY);
});

test('NO_TEXT_SYNTHESIS_INSTRUCTION: asks for an answer to the QUESTION, not only row totals, and for rejected calls to be disclosed', () => {
  // The row-count boilerplate shape ("the search returned 12 rows") is what a totals-only
  // instruction produces even when it works; the multi-part shape, one totals sentence per
  // digest, is its multi-digest sibling. Both are answers to the wrong question.
  assert.match(
    NO_TEXT_SYNTHESIS_INSTRUCTION,
    /answer the question in its own terms/i,
  );
  assert.match(NO_TEXT_SYNTHESIS_INSTRUCTION, /rejected or errored/i);
  // Non-fabrication fences stay exactly where they were.
  assert.match(
    NO_TEXT_SYNTHESIS_INSTRUCTION,
    /Using only the tool results already gathered/i,
  );
  assert.match(
    NO_TEXT_SYNTHESIS_INSTRUCTION,
    /Do not state anything the results do not show/i,
  );
  assert.match(NO_TEXT_SYNTHESIS_INSTRUCTION, /Do not call any tools/i);
});

test('synthesizeNoTextFallback: the instruction is appended AFTER the outbound scrub, so the pseudonymizer never rewrites our own copy', async () => {
  // 'results' is registered as a pseudonym VALUE, so a prescan over the instruction text would
  // mangle it. Appending after the scrub is what makes that structurally impossible.
  const pseudonymizer = new Pseudonymizer([
    { value: 'results', pseudonym: 'HOST_9' },
  ]);
  const privacyCtx: PrivacyContext = { pseudonymizer, fieldPolicy: [] };
  const { adapter, calls } = scriptedAdapter([
    { type: 'delta', content: 'Fifteen critical findings.' },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
  ]);
  const controller = new AbortController();

  await drain(
    synthesizeNoTextFallback(
      adapter,
      PROVIDER_CONFIG,
      TURN_MESSAGES,
      controller.signal,
      privacyCtx,
      [nonEmptyDigest()],
    ),
  );

  const last = calls[0].messages[calls[0].messages.length - 1];
  assert.equal(last.role, 'user');
  assert.equal(
    last.content,
    NO_TEXT_SYNTHESIS_INSTRUCTION,
    'our own first-party copy reaches the provider byte-identical',
  );
});
