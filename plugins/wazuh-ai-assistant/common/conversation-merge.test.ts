import assert from 'node:assert/strict';
import { mergeConversationMessages } from './conversation-merge';
import { ChatMessage } from './types';

function user(content: string): ChatMessage {
  return { role: 'user', content };
}
function assistant(content: string): ChatMessage {
  return { role: 'assistant', content };
}

test('mergeConversationMessages: identical arrays return the server copy unchanged (no local tail)', () => {
  const server: ChatMessage[] = [user('hi'), assistant('hello')];
  const local: ChatMessage[] = [user('hi'), assistant('hello')];
  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, server);
  assert.notEqual(
    merged,
    server,
    'result should be a new array, not the same reference',
  );
});

test('mergeConversationMessages: no common prefix returns server messages then EVERY local message', () => {
  const server: ChatMessage[] = [user('server turn 1')];
  const local: ChatMessage[] = [user('totally different local turn')];
  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, [...server, ...local]);
});

test('mergeConversationMessages: empty server and empty local returns empty', () => {
  assert.deepEqual(mergeConversationMessages([], []), []);
});

test('mergeConversationMessages: empty server, non-empty local falls back to "no common prefix"', () => {
  const local: ChatMessage[] = [user('a'), assistant('b')];
  assert.deepEqual(mergeConversationMessages([], local), local);
});

test('mergeConversationMessages: empty local returns the server copy as-is', () => {
  const server: ChatMessage[] = [user('a'), assistant('b')];
  assert.deepEqual(mergeConversationMessages(server, []), server);
});

test('mergeConversationMessages: typical case — both tabs append AFTER a shared history', () => {
  const shared: ChatMessage[] = [user('q1'), assistant('a1')];
  // The other tab's write already landed server-side, one turn ahead.
  const server: ChatMessage[] = [
    ...shared,
    user('q2 from other tab'),
    assistant('a2 from other tab'),
  ];
  // This tab only ever saw the shared history and appended its OWN turn on top of it.
  const local: ChatMessage[] = [
    ...shared,
    user('q2 from this tab'),
    assistant('a2 from this tab'),
  ];

  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, [
    ...shared,
    user('q2 from other tab'),
    assistant('a2 from other tab'),
    user('q2 from this tab'),
    assistant('a2 from this tab'),
  ]);
});

test('mergeConversationMessages: local is a strict prefix of server (this tab had nothing new to add)', () => {
  const local: ChatMessage[] = [user('q1'), assistant('a1')];
  const server: ChatMessage[] = [...local, user('q2'), assistant('a2')];
  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, server);
});

test('mergeConversationMessages: server is a strict prefix of local (server has nothing this tab lacks)', () => {
  const server: ChatMessage[] = [user('q1'), assistant('a1')];
  const local: ChatMessage[] = [...server, user('q2'), assistant('a2')];
  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, local);
});

test('mergeConversationMessages: distinguishes messages by toolCalls/toolCallId, not just role+content', () => {
  const server: ChatMessage[] = [
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 't1', name: 'search', arguments: {} }],
    },
  ];
  const local: ChatMessage[] = [
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 't2', name: 'search', arguments: {} }],
    },
  ];
  // Same role/content but a different tool call id — NOT equal, so no common prefix.
  const merged = mergeConversationMessages(server, local);
  assert.deepEqual(merged, [...server, ...local]);
});
