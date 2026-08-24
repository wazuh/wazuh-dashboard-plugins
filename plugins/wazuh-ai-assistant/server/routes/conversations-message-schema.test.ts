import assert from 'node:assert/strict';
import { chatMessageSchema } from './conversations';
import { CONVERSATION_MAX_FAILURE_REASON_LENGTH } from '../../common/constants';

/**
 * Same class of guard as `conversations-table-schema.test.ts`, one level up: every field
 * `common/types.ts`'s `PersistedChatMessage` gains has to be added to `chatMessageSchema` too, or
 * the whole conversation save 400s with "definition for this key is missing" — and the client
 * treats a failed save as a non-fatal hiccup, so the user keeps chatting while nothing is being
 * persisted at all.
 *
 * Covers the fields added for the failed-turn marker and provider provenance.
 */

const MINIMAL_MESSAGE = { role: 'assistant', content: 'Six today.' };

test('chatMessageSchema: still accepts a message with none of the new fields (a conversation saved by an older build)', () => {
  assert.doesNotThrow(() => chatMessageSchema.validate(MINIMAL_MESSAGE));
});

test('chatMessageSchema: accepts a failed turn carrying its reason', () => {
  assert.doesNotThrow(() =>
    chatMessageSchema.validate({
      role: 'assistant',
      // A failed turn is persisted marker-only: empty content is the normal case here, not an edge.
      content: '',
      failureReason: 'provider stream failed: 502 upstream',
    }),
  );
});

test('chatMessageSchema: accepts provider provenance on an assistant message', () => {
  assert.doesNotThrow(() =>
    chatMessageSchema.validate({
      ...MINIMAL_MESSAGE,
      providerId: 'provider-1',
      providerName: 'Claude test',
      providerModel: 'claude-sonnet-4',
    }),
  );
});

test('chatMessageSchema: accepts a failure reason at exactly the shared limit and rejects one past it', () => {
  // Read off the shared constant, not a literal: this is the bound `toPersistedMessages` clamps to,
  // and the two drifting apart is the silent-save-failure bug (see the constant's doc comment).
  assert.doesNotThrow(() =>
    chatMessageSchema.validate({
      role: 'assistant',
      content: '',
      failureReason: 'x'.repeat(CONVERSATION_MAX_FAILURE_REASON_LENGTH),
    }),
  );
  assert.throws(() =>
    chatMessageSchema.validate({
      role: 'assistant',
      content: '',
      failureReason: 'x'.repeat(CONVERSATION_MAX_FAILURE_REASON_LENGTH + 1),
    }),
  );
});

test('chatMessageSchema: rejects an unbounded provider field', () => {
  assert.throws(() =>
    chatMessageSchema.validate({
      ...MINIMAL_MESSAGE,
      providerName: 'x'.repeat(257),
    }),
  );
});
