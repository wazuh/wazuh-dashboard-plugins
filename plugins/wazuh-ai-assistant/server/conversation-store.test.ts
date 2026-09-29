import assert from 'node:assert/strict';
import { decodeVersion, encodeVersion } from './conversation-store';

/**
 * `encodeVersion`/`decodeVersion` are the opaque optimistic-concurrency token round-tripped
 * through `ConversationRecord.version` (see that type's doc comment in common/types.ts) — they
 * replace the saved-objects client's own opaque `version` string now that conversations are read
 * and written directly against the `wazuh-ai-assistant-sessions` index alias, which has no such
 * single value of its own (only a seq_no/primary_term pair). Both are pure, so — same convention as
 * this plugin's other route-level helpers (`isVersionConflictError`, `resolveOwner`) — they are
 * unit-tested directly rather than through a route, since this plugin has no request/response
 * mocking harness for OpenSearch Dashboards routes.
 */

test('encodeVersion/decodeVersion: round-trips a seq_no/primary_term pair', () => {
  assert.deepEqual(decodeVersion(encodeVersion(3, 1)), {
    seqNo: 3,
    primaryTerm: 1,
  });
  assert.deepEqual(decodeVersion(encodeVersion(0, 0)), {
    seqNo: 0,
    primaryTerm: 0,
  });
});

test('encodeVersion: produces the documented "seqNo:primaryTerm" shape', () => {
  assert.equal(encodeVersion(3, 1), '3:1');
});

test('decodeVersion: parses a well-formed token back into its numeric pair', () => {
  assert.deepEqual(decodeVersion('3:1'), { seqNo: 3, primaryTerm: 1 });
});

test('decodeVersion: parses seq_no/primary_term of 0 correctly (falsy-but-valid numbers)', () => {
  assert.deepEqual(decodeVersion('0:0'), { seqNo: 0, primaryTerm: 0 });
});

test('decodeVersion: returns undefined for a stale/foreign token shape (e.g. a saved-objects version string)', () => {
  assert.equal(decodeVersion('WzEsMV0='), undefined);
});

test('decodeVersion: returns undefined for garbage input', () => {
  assert.equal(decodeVersion('not-a-version'), undefined);
  assert.equal(decodeVersion(''), undefined);
  assert.equal(decodeVersion(':'), undefined);
  assert.equal(decodeVersion('1:'), undefined);
  assert.equal(decodeVersion(':1'), undefined);
});

test('decodeVersion: rejects a negative number in either position (regex only matches digits)', () => {
  assert.equal(decodeVersion('-1:1'), undefined);
  assert.equal(decodeVersion('1:-1'), undefined);
});
