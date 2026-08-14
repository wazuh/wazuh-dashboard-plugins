/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { ROUTE_QUESTION_TOOL } from './router';
import corpus from './paraphrase-routing-corpus.json';

/**
 * Corpus-coherence guard for the paraphrase routing gate (issue #8878). This test does NOT call
 * any LLM/provider and makes no network requests: it only checks that
 * `paraphrase-routing-corpus.json` is internally consistent and still matches the router's real
 * category map. The gate's actual metric — stage-1 category agreement across paraphrase registers,
 * measured against a real provider — is a manual per-release procedure documented in
 * docs/dev/paraphrase-routing-gate.md; this test exists so a router category rename or a corrupted
 * corpus entry fails loudly here instead of silently making that manual run meaningless.
 */

interface ParaphraseEntry {
  id: string;
  canonical: string;
  register: string;
  expect_category: string;
  q: string;
}

const entries = (corpus as { questions: ParaphraseEntry[] }).questions;

// The router's own category enum (server/tools/router.ts's CATEGORY_ORDER), read off the wire
// schema rather than duplicated here, so a category rename in router.ts breaks this test instead
// of the two silently drifting apart.
const ROUTER_CATEGORIES = new Set(
  (ROUTE_QUESTION_TOOL.parameters.properties as any).categories.items
    .enum as string[],
);

// A bare IPv4-looking dotted-quad, and the test VM hostname family this corpus was sanitized
// against. Kept intentionally narrow (this is a regression guard for the known sanitization, not a
// general-purpose secret scanner).
const IP_LIKE = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
const KNOWN_HOSTNAME_LEAK = /wazuh-aio/i;

test('corpus is non-empty and every required field is present and non-empty', () => {
  assert.ok(entries.length > 0, 'corpus must contain at least one entry');
  for (const entry of entries) {
    for (const field of [
      'id',
      'canonical',
      'register',
      'expect_category',
      'q',
    ] as const) {
      const value = entry[field];
      assert.equal(
        typeof value,
        'string',
        `${entry.id ?? '<unknown>'}.${field} must be a string`,
      );
      assert.ok(
        value.trim().length > 0,
        `${entry.id ?? '<unknown>'}.${field} must be non-empty`,
      );
    }
  }
});

test('every entry id is unique', () => {
  const ids = entries.map(entry => entry.id);
  const uniqueIds = new Set(ids);
  assert.equal(
    uniqueIds.size,
    ids.length,
    `corpus has duplicate ids: ${ids
      .filter((id, index) => ids.indexOf(id) !== index)
      .join(', ')}`,
  );
});

test('every expect_category is a real router category', () => {
  const unknown = entries
    .map(entry => entry.expect_category)
    .filter(category => !ROUTER_CATEGORIES.has(category));
  assert.deepEqual(
    unknown,
    [],
    "these expect_category values are not in router.ts's ROUTE_QUESTION_TOOL category enum " +
      '(the corpus is stale against a router category rename): ' +
      unknown.join(', '),
  );
});

test('every canonical group has at least one paraphrase and one shared expect_category', () => {
  const groups = new Map<string, ParaphraseEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.canonical) ?? [];
    group.push(entry);
    groups.set(entry.canonical, group);
  }

  assert.ok(
    groups.size > 0,
    'corpus must contain at least one canonical group',
  );

  for (const [canonical, members] of groups) {
    assert.ok(
      members.length >= 2,
      `canonical group ${canonical} must have the canonical form plus at least one paraphrase`,
    );
    const categories = new Set(members.map(member => member.expect_category));
    assert.equal(
      categories.size,
      1,
      `canonical group ${canonical} has members disagreeing on expect_category: ${[
        ...categories,
      ].join(', ')}`,
    );
    const hasCanonicalRegister = members.some(
      member => member.register === 'canonical',
    );
    assert.ok(
      hasCanonicalRegister,
      `canonical group ${canonical} is missing its 'canonical' register entry`,
    );
  }
});

test('corpus contains no environment hostnames or bare IP addresses (sanitization guard)', () => {
  const leaks: string[] = [];
  for (const entry of entries) {
    if (KNOWN_HOSTNAME_LEAK.test(entry.q) || IP_LIKE.test(entry.q)) {
      leaks.push(`${entry.id}: "${entry.q}"`);
    }
  }
  assert.deepEqual(
    leaks,
    [],
    `corpus entries must not reference real environment hostnames or IPs: ${leaks.join(
      '; ',
    )}`,
  );
});
