import assert from 'node:assert/strict';
import { chatMessageSchema } from './conversations';

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

test('chatMessageSchema: rejects an unbounded failure reason', () => {
  // The bound exists so the field cannot be an unbounded write vector, not to constrain real use.
  assert.throws(() =>
    chatMessageSchema.validate({
      role: 'assistant',
      content: '',
      failureReason: 'x'.repeat(2001),
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
