import assert from 'node:assert/strict';
import {
  AssistantTurnRecord,
  ChatHistoryMessage,
  CONVERSATION_TITLE_MAX_LENGTH,
  TOOL_HISTORY_CHAR_BUDGET,
  TOOL_HISTORY_MAX_TURNS,
  ToolExchange,
  buildConversationTitle,
  buildOutgoingMessages,
  excludePrivacyOffHistory,
  detectManagerAuthError,
  detectNavigationType,
  nextMessageId,
  reconstructConversation,
  reconstructUiMessages,
  toPersistedMessages,
} from './chat-history';
import {
  CONVERSATION_MAX_MESSAGES,
  CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH,
  CONVERSATION_MAX_SERIALIZED_BYTES,
  CONVERSATION_MAX_TABLE_ROWS,
} from './constants';
import {
  ChatMessage,
  PersistedChatMessage,
  TableSpec,
  ToolCall,
} from './types';

function tableSpec(rowCount: number): TableSpec {
  return {
    columns: [{ id: 'agent', label: 'Agent' }],
    rows: Array.from({ length: rowCount }, (_unused, i) => ({
      agent: `agent-${i}`,
    })),
  };
}

function uiUser(id: string, content: string): ChatHistoryMessage {
  return { id, role: 'user', content, createdAt: Date.now() };
}
function uiAssistant(
  id: string,
  content: string,
  privacyEnabled?: boolean,
): ChatHistoryMessage {
  return {
    id,
    role: 'assistant',
    content,
    createdAt: Date.now(),
    ...(privacyEnabled !== undefined ? { privacyEnabled } : {}),
  };
}
function toolCall(id: string): ToolCall {
  return { id, name: 'get_findings', arguments: {} };
}
function exchange(
  toolCallId: string,
  digestContent?: string,
  privacyEnabled?: boolean,
): ToolExchange {
  return {
    toolCall: toolCall(toolCallId),
    digestContent,
    // Omitted entirely (not `privacyEnabled: undefined`) when the caller doesn't pass it, so a
    // deep-equal against `reconstructConversation`'s output -- which now also OMITS the key rather
    // than setting it to `undefined` (see that function's own doc comment) -- compares like for
    // like instead of tripping over a present-but-undefined vs. absent key mismatch.
    ...(privacyEnabled !== undefined ? { privacyEnabled } : {}),
  };
}
function turn(
  assistantMessageId: string,
  toolExchanges: ToolExchange[],
): AssistantTurnRecord {
  return { assistantMessageId, toolExchanges };
}

// ---------------------------------------------------------------------------
// buildOutgoingMessages
// ---------------------------------------------------------------------------

test('buildOutgoingMessages: no turn records at all just maps role/content straight through', () => {
  const uiMessages = [uiUser('u1', 'hi'), uiAssistant('a1', 'hello')];
  const outgoing = buildOutgoingMessages(uiMessages, [], false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ]);
});

test('buildOutgoingMessages: a turn with no tool exchanges at all contributes no pairs', () => {
  const uiMessages = [uiUser('u1', 'q'), uiAssistant('a1', 'answer')];
  const turns = [turn('a1', [])];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'answer' },
  ]);
});

test("buildOutgoingMessages: [assistant{toolCalls}, tool{digest}] pair is placed immediately before that turn's own prose message, in exchange order", () => {
  const uiMessages = [uiUser('u1', 'q'), uiAssistant('a1', 'final answer')];
  const turns = [
    turn('a1', [exchange('t1', 'digest one'), exchange('t2', 'digest two')]),
  ];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    { role: 'tool', toolCallId: 't1', content: 'digest one' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t2')] },
    { role: 'tool', toolCallId: 't2', content: 'digest two' },
    { role: 'assistant', content: 'final answer' },
  ]);
});

test('buildOutgoingMessages: an exchange with no digestContent (e.g. a guardrail rejection short-circuited before a table event) is never resent', () => {
  const uiMessages = [uiUser('u1', 'q'), uiAssistant('a1', 'final answer')];
  const turns = [
    turn('a1', [exchange('t1', undefined), exchange('t2', 'has digest')]),
  ];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q' },
    // Only t2's pair appears; t1 (no digestContent) is skipped entirely, not just its digest half.
    { role: 'assistant', content: '', toolCalls: [toolCall('t2')] },
    { role: 'tool', toolCallId: 't2', content: 'has digest' },
    { role: 'assistant', content: 'final answer' },
  ]);
});

test(`buildOutgoingMessages: only the newest TOOL_HISTORY_MAX_TURNS (=${TOOL_HISTORY_MAX_TURNS}) assistant turns are eligible for tool-history at all — older turns are prose-only even with ample budget`, () => {
  const uiMessages = [
    uiUser('u1', 'q1'),
    uiAssistant('a1', 'answer 1'),
    uiUser('u2', 'q2'),
    uiAssistant('a2', 'answer 2'),
    uiUser('u3', 'q3'),
    uiAssistant('a3', 'answer 3'),
  ];
  // 3 turns, each with a small digest — well within TOOL_HISTORY_CHAR_BUDGET on its own.
  const turns = [
    turn('a1', [exchange('t1', 'd1')]),
    turn('a2', [exchange('t2', 'd2')]),
    turn('a3', [exchange('t3', 'd3')]),
  ];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  // a1 (the oldest, 3rd-from-newest) is outside the last-2 window: its exchange never appears.
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'answer 1' },
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t2')] },
    { role: 'tool', toolCallId: 't2', content: 'd2' },
    { role: 'assistant', content: 'answer 2' },
    { role: 'user', content: 'q3' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t3')] },
    { role: 'tool', toolCallId: 't3', content: 'd3' },
    { role: 'assistant', content: 'answer 3' },
  ]);
});

test('buildOutgoingMessages: TOOL_HISTORY_CHAR_BUDGET cutoff — the first (older) turn that would push the running total over budget is dropped entirely, not clamped', () => {
  // Two turns, both inside the TOOL_HISTORY_MAX_TURNS=2 eligible window (the max the constant
  // allows us to construct here — see this test's own note below). Each turn's digest content is
  // just over half the budget, so the newest turn alone fits, but including the older one too
  // would exceed TOOL_HISTORY_CHAR_BUDGET.
  const perTurnChars = Math.floor(TOOL_HISTORY_CHAR_BUDGET / 2) + 100;
  const newDigest = 'n'.repeat(perTurnChars);
  const oldDigest = 'o'.repeat(perTurnChars);
  assert.ok(
    perTurnChars * 2 > TOOL_HISTORY_CHAR_BUDGET,
    'test fixture must actually exceed budget when combined',
  );

  const uiMessages = [
    uiUser('u1', 'q1'),
    uiAssistant('a1', 'answer 1'),
    uiUser('u2', 'q2'),
    uiAssistant('a2', 'answer 2'),
  ];
  const turns = [
    turn('a1', [exchange('t1', oldDigest)]),
    turn('a2', [exchange('t2', newDigest)]),
  ];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);

  // Only a2 (the newest) keeps its tool exchange; a1's is dropped even though, on its own, its
  // digest would easily fit under budget.
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'answer 1' },
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t2')] },
    { role: 'tool', toolCallId: 't2', content: newDigest },
    { role: 'assistant', content: 'answer 2' },
  ]);
  // NOTE: TOOL_HISTORY_MAX_TURNS caps the eligible window at 2, so only 2 turns can ever reach the
  // budget walk in the first place — the documented "stops the whole walk, not just that turn"
  // distinction (vs. per-turn skipping) only becomes externally observable with 3+ eligible turns,
  // which the constant's current value makes unreachable through this public function. What IS
  // verified here is the actually-reachable, load-bearing behavior: a turn that would push the
  // running total over budget is excluded outright rather than truncated.
});

test('buildOutgoingMessages: a turn whose tool exchanges have zero digest chars does not count against the budget and does not block an older turn', () => {
  const uiMessages = [
    uiUser('u1', 'q1'),
    uiAssistant('a1', 'answer 1'),
    uiUser('u2', 'q2'),
    uiAssistant('a2', 'answer 2'),
  ];
  // a2 (newest) has an exchange with no digestContent at all -> turnChars === 0 -> `continue`,
  // never touching runningChars, so a1's own (small) digest still gets in.
  const turns = [
    turn('a1', [exchange('t1', 'small digest')]),
    turn('a2', [exchange('t2', undefined)]),
  ];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    { role: 'tool', toolCallId: 't1', content: 'small digest' },
    { role: 'assistant', content: 'answer 1' },
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'answer 2' },
  ]);
});

test('buildOutgoingMessages: a turnRecord whose assistantMessageId has no matching uiMessage (already pruned/replaced) is harmless', () => {
  const uiMessages = [uiUser('u1', 'q1'), uiAssistant('a1', 'answer 1')];
  const turns = [turn('stale-id', [exchange('t1', 'digest')])];
  const outgoing = buildOutgoingMessages(uiMessages, turns, false);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'answer 1' },
  ]);
});

// ---------------------------------------------------------------------------
// Wire-proof fix (AI/qa/wire-proof-v35/capture.jsonl): excludePrivacyOffHistory, and
// buildOutgoingMessages's own use of it via its new `currentPrivacyEnabled` parameter.
//
// The live-captured leak: a real agent name (`wazuh-aio-5`, no dots -- invisible to the shape scan)
// survived a privacy-off-to-on mid-conversation toggle because the digest that carried it was
// resent as "history" unfiltered. All five tests below map 1:1 to the fix's required proof points.
// ---------------------------------------------------------------------------

test('excludePrivacyOffHistory: WIRE-PROOF regression -- a privacy-OFF-flagged tool digest containing a bare real agent name is absent from the outbound payload entirely', () => {
  // The user's OWN question text deliberately does NOT mention the hostname here: this mechanism
  // never drops role:'user' content (a separate, already-documented residual -- see
  // excludePrivacyOffHistory's own doc comment), so a "no hostname anywhere" assertion must not be
  // confounded by the user's own words. What this test isolates is specifically the digest and the
  // model's own past narration, which DO get dropped.
  const messages: ChatMessage[] = [
    { role: 'user', content: 'how many alerts right now?' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    {
      role: 'tool',
      toolCallId: 't1',
      content: JSON.stringify({
        samples: [{ id: '001', name: 'wazuh-aio-5', ip: 'IP_1' }],
      }),
      privacyEnabled: false, // captured while privacy was OFF for that turn
    },
    { role: 'assistant', content: '3 alerts on wazuh-aio-5.' },
  ];

  const out = excludePrivacyOffHistory(messages, true);

  assert.deepEqual(
    out.map(message => message.role),
    ['user'],
    'the whole [assistant{toolCalls}, tool{digest}] pair AND the privacy-off prose must be gone',
  );
  const serialized = JSON.stringify(out);
  assert.doesNotMatch(
    serialized,
    /wazuh-aio-5/,
    'the real agent name from the live wire-proof must not survive anywhere in the outbound payload',
  );
});

test('excludePrivacyOffHistory: a historical turn flagged privacy-ON (pseudonym-form) is still replayed normally', () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'and now?' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    {
      role: 'tool',
      toolCallId: 't1',
      content: '{"samples":[{"name":"HOST_1"}]}',
      privacyEnabled: true,
    },
    { role: 'assistant', content: 'Still HOST_1.', privacyEnabled: true },
  ];

  const out = excludePrivacyOffHistory(messages, true);

  assert.deepEqual(out, messages, 'nothing eligible should be dropped or altered');
});

test('excludePrivacyOffHistory: a missing/unknown privacyEnabled flag (an older persisted conversation) is excluded -- fail closed, not fail open', () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    {
      role: 'tool',
      toolCallId: 't1',
      content: 'some digest',
      // No `privacyEnabled` at all -- simulates a conversation persisted before this field existed.
    },
    { role: 'assistant', content: 'an old answer' /* also no flag */ },
  ];

  const out = excludePrivacyOffHistory(messages, true);

  assert.deepEqual(out.map(m => m.role), ['user']);
});

test('excludePrivacyOffHistory: privacy OFF for the current turn -- everything replays exactly as before (no behavior change)', () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    {
      role: 'tool',
      toolCallId: 't1',
      content: 'wazuh-aio-5',
      privacyEnabled: false,
    },
    { role: 'assistant', content: 'answer about wazuh-aio-5' },
  ];

  const out = excludePrivacyOffHistory(messages, false);

  assert.deepEqual(out, messages);
});

test('excludePrivacyOffHistory: a standalone assistant PROSE message (no toolCalls) is dropped under the same fail-closed rule', () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'privacy-off narration', privacyEnabled: false },
    { role: 'assistant', content: 'privacy-on narration', privacyEnabled: true },
  ];

  const out = excludePrivacyOffHistory(messages, true);

  assert.deepEqual(out, [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: 'privacy-on narration', privacyEnabled: true },
  ]);
});

test('excludePrivacyOffHistory: user messages are NEVER dropped by this mechanism, regardless of flag', () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'a question mentioning wazuh-aio-5', privacyEnabled: false },
  ];
  const out = excludePrivacyOffHistory(messages, true);
  assert.deepEqual(out, messages);
});

test('buildOutgoingMessages: WIRE-PROOF end-to-end -- privacy toggled on mid-conversation excludes the privacy-off turn (digest AND prose), keeping the current question', () => {
  // As in the excludePrivacyOffHistory test above, the user's OWN question text deliberately does
  // not mention the hostname -- only the digest and the model's own past narration carried it, and
  // those (not user content) are what this fix drops.
  const uiMessages = [
    uiUser('u1', 'how many alerts right now?'),
    uiAssistant('a1', '3 alerts on wazuh-aio-5.', false), // this turn ran with privacy OFF
    uiUser('u2', 'and now, with privacy on?'),
  ];
  const turns = [turn('a1', [exchange('t1', 'wazuh-aio-5 digest', false)])];

  const outgoing = buildOutgoingMessages(uiMessages, turns, true);

  assert.deepEqual(outgoing, [
    { role: 'user', content: 'how many alerts right now?' },
    { role: 'user', content: 'and now, with privacy on?' },
  ]);
  assert.doesNotMatch(JSON.stringify(outgoing), /wazuh-aio-5/);
});

test('buildOutgoingMessages: privacy currently ON keeps a privacy-ON-flagged historical turn intact', () => {
  const uiMessages = [
    uiUser('u1', 'q'),
    uiAssistant('a1', 'HOST_1 answer', true),
    uiUser('u2', 'follow-up'),
  ];
  const turns = [turn('a1', [exchange('t1', 'HOST_1 digest', true)])];

  const outgoing = buildOutgoingMessages(uiMessages, turns, true);

  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    { role: 'tool', toolCallId: 't1', content: 'HOST_1 digest', privacyEnabled: true },
    { role: 'assistant', content: 'HOST_1 answer', privacyEnabled: true },
    { role: 'user', content: 'follow-up' },
  ]);
});

// ---------------------------------------------------------------------------
// reconstructUiMessages
// ---------------------------------------------------------------------------

test('reconstructUiMessages: keeps only user/assistant roles, drops system/tool', () => {
  const persisted: ChatMessage[] = [
    { role: 'system', content: 'you are a helpful assistant' },
    { role: 'user', content: 'hi' },
    { role: 'tool', content: 'tool result', toolCallId: 't1' },
    { role: 'assistant', content: 'hello' },
  ];
  const reconstructed = reconstructUiMessages(persisted);
  assert.equal(reconstructed.length, 2);
  assert.equal(reconstructed[0].role, 'user');
  assert.equal(reconstructed[0].content, 'hi');
  assert.equal(reconstructed[1].role, 'assistant');
  assert.equal(reconstructed[1].content, 'hello');
});

test('reconstructUiMessages: assigns fresh, unique ids and a numeric createdAt to every message', () => {
  const persisted: ChatMessage[] = [
    { role: 'user', content: 'a' },
    { role: 'assistant', content: 'b' },
    { role: 'user', content: 'c' },
  ];
  const reconstructed = reconstructUiMessages(persisted);
  const ids = reconstructed.map(m => m.id);
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
  reconstructed.forEach(m => {
    assert.equal(typeof m.id, 'string');
    assert.ok(m.id.length > 0);
    assert.equal(typeof m.createdAt, 'number');
  });
});

test('reconstructUiMessages: empty input returns empty output', () => {
  assert.deepEqual(reconstructUiMessages([]), []);
});

// ---------------------------------------------------------------------------
// toPersistedMessages
// ---------------------------------------------------------------------------

test('toPersistedMessages: persists role/content and the real createdAt, never the render-only id', () => {
  const uiMessages: ChatHistoryMessage[] = [
    { id: 'u1', role: 'user', content: 'hi', createdAt: 1 },
    { id: 'a1', role: 'assistant', content: 'hello', createdAt: 2 },
  ];
  const persisted = toPersistedMessages(uiMessages);
  // createdAt is persisted so a resumed conversation shows when each turn actually happened,
  // instead of stamping every message with the moment of the resume.
  assert.deepEqual(persisted, [
    { role: 'user', content: 'hi', createdAt: 1 },
    { role: 'assistant', content: 'hello', createdAt: 2 },
  ]);
  // The id is a client-side render key and must not leak into storage.
  persisted.forEach(m =>
    assert.deepEqual(Object.keys(m).sort(), ['content', 'createdAt', 'role']),
  );
});

test('toPersistedMessages: empty input returns empty output', () => {
  assert.deepEqual(toPersistedMessages([]), []);
});

// ---------------------------------------------------------------------------
// buildConversationTitle
// ---------------------------------------------------------------------------

test('buildConversationTitle: uses the first USER message, trimmed, ignoring any assistant messages before it', () => {
  const messages: ChatHistoryMessage[] = [
    uiAssistant('a0', 'a stray assistant message somehow first'),
    uiUser('u1', '  How many critical findings today?  '),
    uiAssistant('a1', 'answer'),
  ];
  const title = buildConversationTitle(messages, 'Untitled conversation');
  assert.equal(title, 'How many critical findings today?');
});

test('buildConversationTitle: falls back to the untitled label when there is no user message', () => {
  const messages: ChatHistoryMessage[] = [uiAssistant('a1', 'hello')];
  assert.equal(
    buildConversationTitle(messages, 'Untitled conversation'),
    'Untitled conversation',
  );
});

test('buildConversationTitle: falls back to the untitled label when the first user message is blank/whitespace-only', () => {
  const messages: ChatHistoryMessage[] = [uiUser('u1', '   ')];
  assert.equal(
    buildConversationTitle(messages, 'Untitled conversation'),
    'Untitled conversation',
  );
});

test(`buildConversationTitle: content at exactly CONVERSATION_TITLE_MAX_LENGTH (${CONVERSATION_TITLE_MAX_LENGTH}) chars passes through untouched`, () => {
  const exact = 'x'.repeat(CONVERSATION_TITLE_MAX_LENGTH);
  const messages: ChatHistoryMessage[] = [uiUser('u1', exact)];
  const title = buildConversationTitle(messages, 'Untitled conversation');
  assert.equal(title, exact);
  assert.equal(title.length, CONVERSATION_TITLE_MAX_LENGTH);
});

test(`buildConversationTitle: content over CONVERSATION_TITLE_MAX_LENGTH (${CONVERSATION_TITLE_MAX_LENGTH}) chars is truncated to ${
  CONVERSATION_TITLE_MAX_LENGTH - 1
} chars plus an ellipsis`, () => {
  const long = 'y'.repeat(CONVERSATION_TITLE_MAX_LENGTH + 25);
  const messages: ChatHistoryMessage[] = [uiUser('u1', long)];
  const title = buildConversationTitle(messages, 'Untitled conversation');
  assert.equal(title, `${'y'.repeat(CONVERSATION_TITLE_MAX_LENGTH - 1)}…`);
  assert.equal(title.length, CONVERSATION_TITLE_MAX_LENGTH); // 59 chars + 1 ellipsis char
});

// ---------------------------------------------------------------------------
// detectManagerAuthError
// ---------------------------------------------------------------------------

test('detectManagerAuthError: matches the "Manager request failed" prefix', () => {
  assert.equal(
    detectManagerAuthError('Manager request failed: 500 from indexer'),
    true,
  );
});

test('detectManagerAuthError: matches case-insensitively', () => {
  assert.equal(
    detectManagerAuthError('WZ-TOKEN was MISSING OR EXPIRED, please reload'),
    true,
  );
});

test('detectManagerAuthError: generic auth vocabulary matches only alongside a Manager mention', () => {
  assert.equal(
    detectManagerAuthError('The Wazuh Manager returned 401 Unauthorized'),
    true,
  );
  assert.equal(
    detectManagerAuthError('The upstream call returned 401 Unauthorized'),
    false,
  );
});

// The assistant answers questions ABOUT authentication failures constantly (brute-force is one of
// the app's own example prompts). A successful answer must never raise the session-expiry callout.
test('detectManagerAuthError: an answer about authentication failures does not match', () => {
  assert.equal(
    detectManagerAuthError(
      'I found 42 authentication failed events for user root on agent web-01.',
    ),
    false,
  );
});

test('detectManagerAuthError: plain unrelated narration does not match', () => {
  assert.equal(
    detectManagerAuthError(
      'Here are the top 5 critical findings from the last 24 hours.',
    ),
    false,
  );
});

test('detectManagerAuthError: empty string does not match', () => {
  assert.equal(detectManagerAuthError(''), false);
});

// ---------------------------------------------------------------------------
// detectNavigationType
// ---------------------------------------------------------------------------

test('detectNavigationType: never throws, and returns "unknown" when there is no navigation entry (Node has no Navigation Timing entries)', () => {
  assert.doesNotThrow(() => detectNavigationType());
  assert.equal(detectNavigationType(), 'unknown');
});

test("detectNavigationType: returns the entry's own type when the Performance API reports one", () => {
  const original = globalThis.performance.getEntriesByType;
  try {
    globalThis.performance.getEntriesByType = ((_type: string) => [
      { type: 'reload' },
    ]) as unknown as typeof original;
    assert.equal(detectNavigationType(), 'reload');
  } finally {
    globalThis.performance.getEntriesByType = original;
  }
});

test('detectNavigationType: falls back to "unknown" (not a throw) if reading performance itself throws', () => {
  const original = globalThis.performance.getEntriesByType;
  try {
    globalThis.performance.getEntriesByType = (() => {
      throw new Error('boom');
    }) as unknown as typeof original;
    assert.equal(detectNavigationType(), 'unknown');
  } finally {
    globalThis.performance.getEntriesByType = original;
  }
});

// ---------------------------------------------------------------------------
// nextMessageId
// ---------------------------------------------------------------------------

test('nextMessageId: every call returns a unique, non-empty string', () => {
  const ids = new Set<string>();
  for (let i = 0; i < 50; i += 1) {
    ids.add(nextMessageId());
  }
  assert.equal(ids.size, 50);
});

// --- toPersistedMessages must never emit a payload the server would reject ------------------------
// Regression cover for a silent, permanent save failure: the server bounded `messages` length and
// each `content` length, but the client resent the full (ever-growing) array every turn and treated
// the resulting 400 as a non-fatal hiccup with no error banner. Once a conversation crossed either
// bound, every subsequent save failed forever and the user was never told.
test('toPersistedMessages keeps only the newest CONVERSATION_MAX_MESSAGES messages', () => {
  const many = Array.from(
    { length: CONVERSATION_MAX_MESSAGES + 250 },
    (_unused, i) => ({
      id: `m${i}`,
      role: 'user' as const,
      content: `msg ${i}`,
      createdAt: i,
    }),
  );
  const out = toPersistedMessages(many);
  assert.equal(out.length, CONVERSATION_MAX_MESSAGES);
  // the TAIL is what survives (a resumed conversation needs the most recent turns)
  assert.equal(out[out.length - 1].content, `msg ${many.length - 1}`);
  assert.equal(
    out[0].content,
    `msg ${many.length - CONVERSATION_MAX_MESSAGES}`,
  );
});

test('toPersistedMessages clamps an over-long message content', () => {
  const out = toPersistedMessages([
    {
      id: 'a',
      role: 'user',
      content: 'x'.repeat(CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH + 5000),
      createdAt: 1,
    },
  ]);
  assert.equal(out[0].content.length, CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH);
});

test('toPersistedMessages leaves a normal conversation untouched', () => {
  const normal = [
    { id: 'a', role: 'user' as const, content: 'hello', createdAt: 1 },
    { id: 'b', role: 'assistant' as const, content: 'hi there', createdAt: 2 },
  ];
  assert.deepEqual(toPersistedMessages(normal), [
    { role: 'user', content: 'hello', createdAt: 1 },
    { role: 'assistant', content: 'hi there', createdAt: 2 },
  ]);
});

test('no output of toPersistedMessages can violate the server bounds', () => {
  const pathological = Array.from(
    { length: CONVERSATION_MAX_MESSAGES + 10 },
    (_unused, i) => ({
      id: `m${i}`,
      role: 'assistant' as const,
      content: 'y'.repeat(CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH + 1),
      createdAt: i,
    }),
  );
  const out = toPersistedMessages(pathological);
  assert.ok(out.length <= CONVERSATION_MAX_MESSAGES);
  assert.ok(
    out.every(m => m.content.length <= CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH),
  );
});

// ---------------------------------------------------------------------------
// Faithful persistence: a resumed conversation must BE the conversation, not a summary of it
// ---------------------------------------------------------------------------

test('toPersistedMessages: persists the result table a message was displayed with', () => {
  const out = toPersistedMessages([
    { id: 'u1', role: 'user', content: 'top agents?', createdAt: 1 },
    {
      id: 'a1',
      role: 'assistant',
      content: 'here they are',
      createdAt: 2,
      table: tableSpec(3),
    },
  ]);
  assert.equal(out[1].table?.rows.length, 3);
  assert.deepEqual(out[1].table?.columns, [{ id: 'agent', label: 'Agent' }]);
  // A message that had no table gains no empty one.
  assert.ok(!('table' in out[0]));
});

test(`toPersistedMessages: row-caps a persisted table at CONVERSATION_MAX_TABLE_ROWS (${CONVERSATION_MAX_TABLE_ROWS})`, () => {
  const out = toPersistedMessages([
    {
      id: 'a1',
      role: 'assistant',
      content: 'lots',
      createdAt: 1,
      table: tableSpec(CONVERSATION_MAX_TABLE_ROWS + 400),
    },
  ]);
  assert.equal(out[0].table?.rows.length, CONVERSATION_MAX_TABLE_ROWS);
  // The kept rows are the first ones, matching what the live table showed from the top.
  assert.deepEqual(out[0].table?.rows[0], { agent: 'agent-0' });
});

test("toPersistedMessages: interleaves a turn's tool exchanges immediately before its prose message", () => {
  const out = toPersistedMessages(
    [
      { id: 'u1', role: 'user', content: 'how many?', createdAt: 1 },
      { id: 'a1', role: 'assistant', content: '42', createdAt: 2 },
    ],
    [turn('a1', [exchange('t1', '{"count":42}')])],
  );
  assert.deepEqual(
    out.map(m => [m.role, m.content]),
    [
      ['user', 'how many?'],
      ['assistant', ''],
      ['tool', '{"count":42}'],
      ['assistant', '42'],
    ],
  );
  assert.deepEqual(out[1].toolCalls, [toolCall('t1')]);
  assert.equal(out[2].toolCallId, 't1');
});

test('toPersistedMessages: persists privacyEnabled on both the digest message and the prose message it belongs to', () => {
  const out = toPersistedMessages(
    [uiAssistant('a1', 'answer text', false)],
    [turn('a1', [exchange('t1', 'digest content', false)])],
  );
  const tool = out.find(m => m.role === 'tool');
  const prose = out.find(m => m.role === 'assistant' && m.content !== '');
  assert.equal(tool?.privacyEnabled, false);
  assert.equal(prose?.privacyEnabled, false);
});

test('toPersistedMessages: omits privacyEnabled entirely (not written as `undefined`) when the source never set it', () => {
  const out = toPersistedMessages(
    [{ id: 'a1', role: 'assistant', content: 'answer', createdAt: 1 }],
    [turn('a1', [exchange('t1', 'digest')])],
  );
  const tool = out.find(m => m.role === 'tool');
  const prose = out.find(m => m.role === 'assistant' && m.content !== '');
  assert.equal('privacyEnabled' in (tool ?? {}), false);
  assert.equal('privacyEnabled' in (prose ?? {}), false);
});

test('toPersistedMessages: a tool exchange with no digest is not persisted', () => {
  const out = toPersistedMessages(
    [{ id: 'a1', role: 'assistant', content: 'sorry', createdAt: 1 }],
    [turn('a1', [exchange('t1')])],
  );
  assert.deepEqual(
    out.map(m => m.role),
    ['assistant'],
  );
});

test('toPersistedMessages: sheds tables before prose when the payload is over the byte budget', () => {
  // One table alone bigger than the whole budget: prose must survive, the table must not.
  const huge: TableSpec = {
    columns: [{ id: 'blob', label: 'Blob' }],
    rows: [{ blob: 'z'.repeat(CONVERSATION_MAX_SERIALIZED_BYTES) }],
  };
  const out = toPersistedMessages([
    { id: 'u1', role: 'user', content: 'question', createdAt: 1 },
    {
      id: 'a1',
      role: 'assistant',
      content: 'answer',
      createdAt: 2,
      table: huge,
    },
  ]);
  assert.deepEqual(
    out.map(m => m.content),
    ['question', 'answer'],
  );
  assert.ok(out.every(m => m.table === undefined));
});

test('toPersistedMessages: drops oldest messages when even prose alone exceeds the byte budget', () => {
  const bulky = Array.from({ length: 20 }, (_unused, i) => ({
    id: `m${i}`,
    role: 'user' as const,
    content: 'x'.repeat(CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH),
    createdAt: i,
  }));
  const out = toPersistedMessages(bulky);
  assert.ok(
    JSON.stringify(out).length <= CONVERSATION_MAX_SERIALIZED_BYTES,
    'payload must fit the budget',
  );
  assert.ok(out.length > 0, 'the newest messages must survive');
  // What survives is the TAIL.
  assert.equal(out[out.length - 1].createdAt, 19);
});

test('toPersistedMessages: never emits a payload over the byte budget, however pathological the input', () => {
  const pathological = Array.from(
    { length: CONVERSATION_MAX_MESSAGES + 10 },
    (_unused, i) => ({
      id: `m${i}`,
      role: 'assistant' as const,
      content: 'y'.repeat(CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH),
      createdAt: i,
      table: tableSpec(500),
    }),
  );
  const out = toPersistedMessages(pathological);
  assert.ok(JSON.stringify(out).length <= CONVERSATION_MAX_SERIALIZED_BYTES);
});

// ---------------------------------------------------------------------------
// reconstructConversation
// ---------------------------------------------------------------------------

test('reconstructConversation: restores the displayed messages, their timestamps and their tables', () => {
  const persisted: PersistedChatMessage[] = [
    { role: 'user', content: 'top agents?', createdAt: 111 },
    {
      role: 'assistant',
      content: 'here they are',
      createdAt: 222,
      table: tableSpec(2),
    },
  ];
  const restored = reconstructConversation(persisted);
  assert.equal(restored.messages.length, 2);
  assert.equal(restored.messages[0].createdAt, 111);
  assert.equal(restored.messages[1].createdAt, 222);
  assert.equal(restored.messages[1].table?.rows.length, 2);
});

test('reconstructConversation: rebuilds the tool history and keys it to the restored assistant message', () => {
  const persisted: PersistedChatMessage[] = [
    { role: 'user', content: 'how many?', createdAt: 1 },
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    { role: 'tool', content: '{"count":42}', toolCallId: 't1' },
    { role: 'assistant', content: '42', createdAt: 2 },
  ];
  const restored = reconstructConversation(persisted);

  // The tool pair is NOT displayed.
  assert.deepEqual(
    restored.messages.map(m => m.content),
    ['how many?', '42'],
  );
  assert.equal(restored.turnRecords.length, 1);
  assert.equal(
    restored.turnRecords[0].assistantMessageId,
    restored.messages[1].id,
  );
  assert.deepEqual(restored.turnRecords[0].toolExchanges, [
    { toolCall: toolCall('t1'), digestContent: '{"count":42}' },
  ]);
});

test('reconstructConversation: round-trips what toPersistedMessages produced', () => {
  const messages: ChatHistoryMessage[] = [
    { id: 'u1', role: 'user', content: 'how many?', createdAt: 111 },
    {
      id: 'a1',
      role: 'assistant',
      content: '42',
      createdAt: 222,
      table: tableSpec(1),
    },
  ];
  const records = [turn('a1', [exchange('t1', '{"count":42}')])];

  const restored = reconstructConversation(
    toPersistedMessages(messages, records),
  );

  assert.deepEqual(
    restored.messages.map(m => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      rows: m.table?.rows.length,
    })),
    [
      { role: 'user', content: 'how many?', createdAt: 111, rows: undefined },
      { role: 'assistant', content: '42', createdAt: 222, rows: 1 },
    ],
  );
  // The rebuilt record is usable as history again — same exchange, new message id.
  assert.deepEqual(
    restored.turnRecords[0].toolExchanges,
    records[0].toolExchanges,
  );
  assert.equal(
    restored.turnRecords[0].assistantMessageId,
    restored.messages[1].id,
  );
});

test('reconstructConversation: round-trips privacyEnabled on both the digest and the prose message (the flag a LATER resume needs to fail closed)', () => {
  const messages: ChatHistoryMessage[] = [
    uiUser('u1', 'q'),
    uiAssistant('a1', 'privacy-off answer', false),
  ];
  const records = [turn('a1', [exchange('t1', 'digest', false)])];

  const restored = reconstructConversation(
    toPersistedMessages(messages, records),
  );

  assert.equal(restored.messages[1].privacyEnabled, false);
  assert.equal(restored.turnRecords[0].toolExchanges[0].privacyEnabled, false);
});

test('reconstructConversation: falls back to now for a conversation saved before timestamps were persisted', () => {
  const before = Date.now();
  const restored = reconstructConversation([
    { role: 'user', content: 'legacy' },
    { role: 'assistant', content: 'legacy answer' },
  ]);
  restored.messages.forEach(message => {
    assert.ok(message.createdAt >= before);
  });
  assert.deepEqual(restored.turnRecords, []);
});

test('reconstructConversation: a tool pair never carries over into a later turn', () => {
  const restored = reconstructConversation([
    { role: 'assistant', content: '', toolCalls: [toolCall('t1')] },
    { role: 'tool', content: 'digest', toolCallId: 't1' },
    { role: 'assistant', content: 'first', createdAt: 1 },
    { role: 'user', content: 'again?', createdAt: 2 },
    { role: 'assistant', content: 'second', createdAt: 3 },
  ]);
  assert.equal(restored.turnRecords.length, 1);
  assert.equal(
    restored.turnRecords[0].assistantMessageId,
    restored.messages[0].id,
  );
});
