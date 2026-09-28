import assert from 'node:assert/strict';
import {
  decodeVersion,
  encodeVersion,
  neutralizeStoredImages,
} from './conversation-store';

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

/**
 * `neutralizeStoredImages` neutralizes images in assistant content before it is persisted. Pure, so
 * — same convention as the version helpers above — it is unit-tested directly.
 */
test('neutralizeStoredImages: neutralizes image markers in assistant messages', () => {
  const out = neutralizeStoredImages([
    { role: 'assistant', content: 'see ![a[b]c](http://x/1) here' },
  ]);
  assert.equal(out[0].content, 'see [a[b]c](http://x/1) here');
});

test('neutralizeStoredImages: leaves user and tool messages untouched', () => {
  const messages = [
    { role: 'user' as const, content: 'why is ![this](http://x/2) shown?' },
    { role: 'tool' as const, content: '![t](http://x/3)' },
  ];
  const out = neutralizeStoredImages(messages);
  assert.equal(out[0].content, 'why is ![this](http://x/2) shown?');
  assert.equal(out[1].content, '![t](http://x/3)');
});

test('neutralizeStoredImages: does not mutate the input array or its messages', () => {
  const input = [{ role: 'assistant' as const, content: '![a](http://x/4)' }];
  const out = neutralizeStoredImages(input);
  assert.equal(input[0].content, '![a](http://x/4)');
  assert.notEqual(out[0], input[0]);
});
