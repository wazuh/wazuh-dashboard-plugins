import assert from 'node:assert/strict';
import { renameBodySchema } from './conversations';
import { CONVERSATION_MAX_TITLE_LENGTH } from '../../common/constants';

/**
 * Request-contract guard for the rename (PATCH) route added for issue #9010 (finding E2). This
 * file is only about what the BODY schema itself accepts or rejects, the same convention
 * conversations-table-schema.test.ts already uses for `tableSpecSchema` -- the route's
 * AUTHORIZATION (owner-resolution, wrong-owner 404, unresolved-identity 403) is exercised
 * end-to-end over a real HTTP request in conversations-patch-route.test.ts, not here.
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

test('renameBodySchema: rejects a whitespace-only title (m10) -- minLength alone would let it through', () => {
  assert.throws(() => renameBodySchema.validate({ title: '   ' }));
});

test('renameBodySchema: accepts a title with incidental leading/trailing whitespace around real content', () => {
  // The schema itself does not trim -- the PATCH handler does (m10, see its own comment) -- this
  // only proves the VALIDATOR does not over-reject real content just because of stray whitespace.
  assert.doesNotThrow(() => renameBodySchema.validate({ title: '  New title  ' }));
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
