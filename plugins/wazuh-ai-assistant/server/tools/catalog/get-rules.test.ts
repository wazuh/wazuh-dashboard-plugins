import assert from 'node:assert/strict';
import { getRulesTool } from './get-rules';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getRulesTool.buildRequest(params) as IndexerRequest;
}

test('get_rules: defaults to enabled=true, no other filters, size 20', () => {
  const request = build({});
  assert.equal(request.index, 'wazuh-threatintel-rules*');
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': true } }] },
  });
  assert.equal(request.body.size, 20);
  assert.deepEqual(request.body.sort, ['_doc']);
  assert.deepEqual(request.body._source, [
    'document.metadata.title',
    'document.metadata.description',
    'document.level',
    'document.status',
    'document.enabled',
    'document.mitre.technique.id',
    'document.tags',
    'document.logsource.product',
    'document.logsource.category',
    'space.name',
  ]);
});

test('get_rules: buildSecurityAnalyticsLink points to the rules app with the resolved space', () => {
  const link = getRulesTool.buildSecurityAnalyticsLink?.({}, 'standard');
  assert.deepEqual(link, {
    label: 'Open in Security Analytics',
    url: '/app/rules#/rules?space=standard',
  });
  const draftLink = getRulesTool.buildSecurityAnalyticsLink?.({}, 'draft');
  assert.equal(draftLink?.url, '/app/rules#/rules?space=draft');
});

test('get_rules: enabled="disabled" filters on false', () => {
  const request = build({ enabled: 'disabled' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': false } }] },
  });
});

test('get_rules: enabled="any" produces no filter at all', () => {
  const request = build({ enabled: 'any' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_rules: status/level/tag/logsource_product/space each add exactly one filter', () => {
  const request = build({
    enabled: 'any',
    status: 'stable',
    level: 'critical',
    tag: 'attack.t1190',
    logsource_product: 'linux',
    space: 'draft',
  });
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        { term: { 'document.status': 'stable' } },
        { term: { 'document.level': 'critical' } },
        { term: { 'space.name': 'draft' } },
        { term: { 'document.tags': 'attack.t1190' } },
        { term: { 'document.logsource.product': 'linux' } },
      ],
    },
  });
});

// Defect #2 (AI/plan/qa-rules-decoders-rootcause.md): `document.mitre.technique.id` is absent
// from the live mapping (`dynamic: false`, confirmed live), so a `term` filter against it could
// only ever return 0 rows. There is no separate `document.threat.technique.id` fix either: that
// path IS mapped but is populated on 0 documents on this dataset (live-confirmed), so a filter on
// it would be silently, permanently empty too. The param was therefore REMOVED outright rather
// than repointed at either field -- neither is a real fix, and `document.mitre.technique.id`
// stays queryable via the "Technique" table column, just not filterable. The real, indexed
// encoding of the same ATT&CK data is the `attack.<lowercase-id>` entry in `document.tags`
// (mapped `keyword`, 14 rules carry `attack.t1190`, live-confirmed) -- reachable through the
// existing `tag` param, whose description now says so.
test('get_rules: has no technique_id parameter (removed, not repointed at a dead field)', () => {
  assert.equal('technique_id' in getRulesTool.spec.parameters.properties, false);
});

test('get_rules: a technique_id-shaped param is silently ignored rather than erroring (build never sees it)', () => {
  const request = build({ enabled: 'any', technique_id: 'T1190' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_rules: technique lookups go through tag as "attack.<id>", per the tag description', () => {
  const request = build({ enabled: 'any', tag: 'attack.t1190' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.tags': 'attack.t1190' } }] },
  });
  assert.match(
    getRulesTool.spec.parameters.properties.tag.description as string,
    /attack\.<id>/,
  );
});

// Review finding F2: the description's example previously mapped "attack.t1190" to "T1110" --
// a mismatched id that invites the model to invent its own transformation. The example id must
// be internally consistent (T1190 -> attack.t1190).
test('get_rules: the tag description example maps attack.t1190 to T1190, not T1110', () => {
  const description = getRulesTool.spec.parameters.properties.tag
    .description as string;
  assert.match(description, /"attack\.t1190" for T1190/);
  assert.doesNotMatch(description, /T1110/);
});

// Review finding F3: `document.tags` is a case-sensitive keyword whose live vocabulary is
// entirely lowercase, while ATT&CK ids are conventionally written uppercase -- an "attack.*" tag
// must be lowercased before it reaches the term filter, or an uppercase id silently returns 0.
test('get_rules: an uppercase "attack.*" tag is lowercased before filtering', () => {
  const request = build({ enabled: 'any', tag: 'attack.T1190' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.tags': 'attack.t1190' } }] },
  });
});

test('get_rules: a non-"attack." tag is passed through unchanged (not force-lowercased)', () => {
  const request = build({ enabled: 'any', tag: 'MyCustomTag' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.tags': 'MyCustomTag' } }] },
  });
});

test('get_rules: logsource_product adds an exact term filter on document.logsource.product', () => {
  const request = build({ enabled: 'any', logsource_product: 'apache-http' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.logsource.product': 'apache-http' } }] },
  });
});

// Defect #1/#5: neither tool had ANY name/keyword filter before this fix. `name` must build a
// should-clause with no leading wildcard (guardrails.ts's lintDsl bans that outright) that covers
// an exact/prefix match on the title plus a word match on the description -- this is what makes
// "the rule about SSTI" (live: title "Server side template injection strings...", description
// "Detects SSTI attempts...") resolvable without a tag-guessing spiral.
test('get_rules: name builds a should-clause on title (term+prefix) and description (match), no wildcard', () => {
  const request = build({ enabled: 'any', name: 'ssti' });
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                term: {
                  'document.metadata.title': {
                    value: 'ssti',
                    case_insensitive: true,
                  },
                },
              },
              {
                prefix: {
                  'document.metadata.title': {
                    value: 'ssti',
                    case_insensitive: true,
                  },
                },
              },
              {
                match: {
                  'document.metadata.description': {
                    query: 'ssti',
                    operator: 'and',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  });
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

// Review finding F1: the description `match` must use `operator: 'and'`, not the default `or`.
// Live-verified: with `or` (as originally shipped), `name="decoder/apache-access/0"` returned
// 330 of 345 decoders (any one token matched) inside a non-scoring `bool.filter` sorted by
// `_doc`, so the wanted row never appeared in the visible page; with `and` it returns exactly 1.
test('get_rules: the description match uses operator "and" so multi-token names stay precise', () => {
  const request = build({ enabled: 'any', name: 'server side template injection' });
  const shouldClause = (
    request.body.query as { bool: { filter: Record<string, unknown>[] } }
  ).bool.filter[0] as {
    bool: { should: Array<{ match?: Record<string, unknown> }> };
  };
  assert.deepEqual(shouldClause.bool.should[2].match, {
    'document.metadata.description': {
      query: 'server side template injection',
      operator: 'and',
    },
  });
});

test('get_rules: name is trimmed and omitted when blank', () => {
  const withSpaces = build({ enabled: 'any', name: '  ssh  ' });
  const shouldClause = (
    withSpaces.body.query as { bool: { filter: Record<string, unknown>[] } }
  ).bool.filter[0] as {
    bool: { should: Array<{ match?: Record<string, unknown> }> };
  };
  assert.deepEqual(
    shouldClause.bool.should[2].match?.['document.metadata.description'],
    { query: 'ssh', operator: 'and' },
  );
  assert.deepEqual(build({ enabled: 'any', name: '   ' }).body.query, {
    bool: { filter: [] },
  });
});

test('get_rules: an invalid space value is ignored (no filter, no throw)', () => {
  const request = build({ enabled: 'any', space: 'not-a-real-space' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_rules: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ limit: 9999 }).body.size, 500);
  assert.equal(build({ limit: 0 }).body.size, 1);
});

test('get_rules: default body passes checkIndexAllowlist and lintDsl (no time range required)', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

// Honesty fix (report item 6): the description must tell the model the numeric rule id
// namespace ("rule 5710") lives on findings, not this Sigma/UUID ruleset, so it stops needing
// luck to detour into the finding tools the way Q3's transcript did.
test('get_rules: description names the numeric-rule-id namespace split and points it at the finding tools', () => {
  const description = getRulesTool.spec.description;
  assert.match(description, /classic numeric rule id/);
  assert.match(description, /rule 5710/);
  assert.match(description, /use the finding tools/);
});

test('get_rules: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({}).body._source as string[]);
  for (const column of getRulesTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getRulesTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});
