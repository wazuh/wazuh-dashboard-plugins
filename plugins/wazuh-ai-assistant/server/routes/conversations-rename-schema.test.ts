import assert from 'node:assert/strict';
import { renameBodySchema } from './conversations';
import { CONVERSATION_MAX_TITLE_LENGTH } from '../../common/constants';

/**
 * Request-contract guard for the rename (PATCH) route added for issue #9010 (finding E2). The
 * route itself carries no other logic worth unit-testing beyond what
 * conversations-owner-resolution.test.ts already covers generically -- it authorizes with the
 * exact same `resolveOwner` / `ownerUnresolvedResponse` / `findConversationHit` sequence as the
 * existing GET/PUT/DELETE routes (see conversations.ts's PATCH handler and its own doc comment),
 * so a caller who cannot resolve an identity, or who targets a conversation belonging to a
 * different owner, is rejected before this schema is ever reached. This file is only about what
 * the BODY schema itself accepts or rejects, the same convention
 * conversations-table-schema.test.ts already uses for `tableSpecSchema`.
 *
 * Runs under the platform Jest runner only (see conversations-owner-resolution.test.ts's doc
 * comment for why): conversations.ts has a module-level value import of `@osd/config-schema`,
 * resolvable only inside a full wazuh-dashboard checkout.
 */

test('renameBodySchema: accepts a normal title', () => {
  assert.doesNotThrow(() => renameBodySchema.validate({ title: 'New title' }));
});

test('renameBodySchema: rejects a missing title', () => {
  assert.throws(() => renameBodySchema.validate({}));
});

test('renameBodySchema: rejects an empty title', () => {
  assert.throws(() => renameBodySchema.validate({ title: '' }));
});

test('renameBodySchema: rejects a title longer than CONVERSATION_MAX_TITLE_LENGTH', () => {
  assert.throws(() =>
    renameBodySchema.validate({
      title: 'x'.repeat(CONVERSATION_MAX_TITLE_LENGTH + 1),
    }),
  );
});

test('renameBodySchema: accepts a title exactly at CONVERSATION_MAX_TITLE_LENGTH', () => {
  assert.doesNotThrow(() =>
    renameBodySchema.validate({
      title: 'x'.repeat(CONVERSATION_MAX_TITLE_LENGTH),
    }),
  );
});

test('renameBodySchema: rejects an extraneous `messages` field -- rename is title-only', () => {
  assert.throws(() =>
    renameBodySchema.validate({
      title: 'New title',
      messages: [{ role: 'user', content: 'hi' }],
    }),
  );
});
