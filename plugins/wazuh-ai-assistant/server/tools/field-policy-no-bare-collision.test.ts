import assert from 'node:assert/strict';
import { FIELD_POLICY_DEFAULTS } from './privacy';

/**
 * P-1 regression (AI/plan/a1a-review.md): pins the CHECKABLE claim privacy.ts's
 * `FIELD_POLICY_DEFAULTS` header comment relies on for its 19 bare-name CTI/content-manager/
 * Security-Analytics entries -- not "no WCS schema ever exposes a personal field bare at root"
 * (live-verified FALSE: `message`, `related`, `url` are all bare root leaves on
 * `.ds-wazuh-events-v5-security-000001`), but the narrower claim that actually holds and that this
 * file's safety depends on: none of those bare entries is the SAME LITERAL as a bare root leaf of
 * any customer-data family. `CUSTOMER_FAMILY_ROOT_LEAVES` is the live-verified root-leaf set (see
 * the review for the exact mapping calls); a future bare entry that collides with one of these
 * would silently widen from "safe CTI/content-manager field" to "customer's own raw log line/IP/
 * URL/user list", so this test fails loudly instead of relying on the next author re-deriving (and
 * re-verifying live) the same invariant from scratch.
 */
const CUSTOMER_FAMILY_ROOT_LEAVES: ReadonlySet<string> = new Set([
  // .ds-wazuh-events-v5-security-000001 root leaves (live mapping).
  '@timestamp',
  'compliance',
  'error',
  'group',
  'interface',
  'labels',
  'message',
  'organization',
  'related',
  'span',
  'tags',
  'trace',
  'transaction',
  'url',
  'volume',
  // wazuh-states-* families: every index's only root leaf besides @timestamp is `message`
  // (already listed above); `wazuh`/`agent` are nested dotted namespaces, not bare leaves.
]);

test('P-1 regression: no bare (dotless) FIELD_POLICY_DEFAULTS entry collides with a customer-data family root leaf', () => {
  const bareEntries = FIELD_POLICY_DEFAULTS.filter(
    entry => !entry.field.includes('.') && !entry.field.includes('/'),
  );
  const collisions = bareEntries
    .map(entry => entry.field)
    .filter(field => CUSTOMER_FAMILY_ROOT_LEAVES.has(field));
  assert.deepEqual(
    collisions,
    [],
    `Bare FIELD_POLICY_DEFAULTS entr${collisions.length === 1 ? 'y' : 'ies'} ` +
      `[${collisions.join(', ')}] collide${
        collisions.length === 1 ? 's' : ''
      } with a real ` +
      'customer-data family root leaf -- this would silently widen the entry to cover the ' +
      "customer's own data. See P-1 in AI/plan/a1a-review.md.",
  );
});

test('P-1 regression: sanity check that the invariant is not vacuous (a bare entry does exist)', () => {
  const bareEntries = FIELD_POLICY_DEFAULTS.filter(
    entry => !entry.field.includes('.') && !entry.field.includes('/'),
  );
  assert.ok(
    bareEntries.length > 0,
    'expected at least one bare FIELD_POLICY_DEFAULTS entry (e.g. the CTI/content-manager ' +
      'fields) -- if this list is ever empty the collision test above would pass vacuously',
  );
});
