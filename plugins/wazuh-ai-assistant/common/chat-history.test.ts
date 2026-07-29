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
  detectManagerAuthError,
  detectNavigationType,
  nextMessageId,
  reconstructUiMessages,
  toPersistedMessages,
} from './chat-history';
import {
  CONVERSATION_MAX_MESSAGES,
  CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH,
} from './constants';
import { ChatMessage, ToolCall } from './types';

function uiUser(id: string, content: string): ChatHistoryMessage {
  return { id, role: 'user', content, createdAt: Date.now() };
}
function uiAssistant(id: string, content: string): ChatHistoryMessage {
  return { id, role: 'assistant', content, createdAt: Date.now() };
}
function toolCall(id: string): ToolCall {
  return { id, name: 'get_alerts', arguments: {} };
}
function exchange(toolCallId: string, digestContent?: string): ToolExchange {
  return { toolCall: toolCall(toolCallId), digestContent };
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
  const outgoing = buildOutgoingMessages(uiMessages, []);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ]);
});

test('buildOutgoingMessages: a turn with no tool exchanges at all contributes no pairs', () => {
  const uiMessages = [uiUser('u1', 'q'), uiAssistant('a1', 'answer')];
  const turns = [turn('a1', [])];
  const outgoing = buildOutgoingMessages(uiMessages, turns);
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
  const outgoing = buildOutgoingMessages(uiMessages, turns);
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
  const outgoing = buildOutgoingMessages(uiMessages, turns);
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
  const outgoing = buildOutgoingMessages(uiMessages, turns);
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
  const outgoing = buildOutgoingMessages(uiMessages, turns);

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
  const outgoing = buildOutgoingMessages(uiMessages, turns);
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
  const outgoing = buildOutgoingMessages(uiMessages, turns);
  assert.deepEqual(outgoing, [
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'answer 1' },
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

test('toPersistedMessages: keeps only role/content, dropping id/createdAt (structural, not just missing-on-input)', () => {
  const uiMessages: ChatHistoryMessage[] = [
    uiUser('u1', 'hi'),
    uiAssistant('a1', 'hello'),
  ];
  const persisted = toPersistedMessages(uiMessages);
  assert.deepEqual(persisted, [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ]);
  // No extra keys leak through (id/createdAt in particular).
  persisted.forEach(m =>
    assert.deepEqual(Object.keys(m).sort(), ['content', 'role']),
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
    uiUser('u1', '  How many critical alerts today?  '),
    uiAssistant('a1', 'answer'),
  ];
  const title = buildConversationTitle(messages, 'Untitled conversation');
  assert.equal(title, 'How many critical alerts today?');
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
      'Here are the top 5 critical alerts from the last 24 hours.',
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
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
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
