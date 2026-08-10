import assert from 'node:assert/strict';
import {
  ANSWER_BUCKET_CAP,
  BREAKDOWN_BUCKET_CAP,
  buildDigest,
  buildTableSpec,
  capDigest,
  Digest,
  isMetricAggValue,
  SUPPORTED_METRIC_AGG_TYPES,
} from './digest';
import { ToolDefinition } from './types';
import { listToolDefinitions } from './registry';

function buildToolDef(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    spec: {
      name: 'test_tool',
      description: 'test',
      parameters: { type: 'object', properties: {} },
    },
    target: 'manager',
    tier: 'T1',
    buildRequest: () => ({
      target: 'manager',
      method: 'GET',
      path: '/x',
      params: {},
    }),
    tableSpec: { columns: [] },
    digest: { sampleColumns: [] },
    ...overrides,
  };
}

// --- manager mutation responses -----------------------------------------------------------------

test('buildDigest: bare-string affected_items are normalized to {item} rows', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'item', label: 'Item' }] },
    digest: { sampleColumns: ['item'] },
  });
  const result = {
    data: { affected_items: ['001', '002'], total_affected_items: 2 },
  };
  const digest = buildDigest('restart_agent', result, def);
  assert.deepEqual(digest.samples, [{ item: '001' }, { item: '002' }]);
  assert.equal(digest.counts.returned, 2);
  assert.equal(digest.counts.total, 2);
  assert.equal(digest.counts.truncated, false);
});

test('buildTableSpec: bare-string affected_items also normalize to {item} rows in the table', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'item', label: 'Item' }] },
  });
  const result = { data: { affected_items: ['001', '002'] } };
  const table = buildTableSpec(result, def);
  assert.deepEqual(table.rows, [{ item: '001' }, { item: '002' }]);
});

test('buildDigest: an already-object affected_items element passes through unchanged', () => {
  const def = buildToolDef({
    tableSpec: {
      columns: [
        { field: 'id', label: 'ID' },
        { field: 'name', label: 'Name' },
      ],
    },
    digest: { sampleColumns: ['id', 'name'] },
  });
  const result = {
    data: { affected_items: [{ id: '001', name: 'agent-one' }] },
  };
  const digest = buildDigest('get_active_agents', result, def);
  assert.deepEqual(digest.samples, [{ id: '001', name: 'agent-one' }]);
});

test('buildDigest: failed_items are surfaced as {item, error} rows', () => {
  const def = buildToolDef({
    tableSpec: {
      columns: [
        { field: 'item', label: 'Item' },
        { field: 'error', label: 'Error' },
      ],
    },
    digest: { sampleColumns: ['item', 'error'] },
  });
  const result = {
    data: {
      affected_items: ['001'],
      total_affected_items: 1,
      total_failed_items: 1,
      failed_items: [{ error: { message: 'Agent not active' }, id: ['002'] }],
    },
  };
  const digest = buildDigest('restart_agent', result, def);
  assert.deepEqual(digest.samples, [
    { item: '001' },
    { item: '002', error: 'Agent not active' },
  ]);
});

test('buildDigest: top-level "message" is surfaced when present', () => {
  const def = buildToolDef();
  const result = {
    data: { affected_items: [], total_affected_items: 0 },
    message: 'AR command was not sent to any agent',
  };
  const digest = buildDigest('run_active_response', result, def);
  assert.equal(digest.message, 'AR command was not sent to any agent');
  assert.equal(digest.samples.length, 0);
});

test('buildDigest: message is omitted entirely when absent (no message key)', () => {
  const def = buildToolDef();
  const result = { data: { affected_items: [], total_affected_items: 0 } };
  const digest = buildDigest('run_active_response', result, def);
  assert.ok(!('message' in digest));
});

test('buildDigest: empty manager results produce zero counts and no samples', () => {
  const def = buildToolDef();
  const result = { data: { affected_items: [], total_affected_items: 0 } };
  const digest = buildDigest('get_active_agents', result, def);
  assert.equal(digest.counts.returned, 0);
  assert.equal(digest.counts.total, 0);
  assert.equal(digest.counts.truncated, false);
  assert.deepEqual(digest.samples, []);
});

// --- aggregation buckets -> breakdown -----------------------------------------------------------

test('buildDigest: single aggregation buckets become a breakdown without an "agg" tag', () => {
  const def = buildToolDef({ digest: { sampleColumns: ['key'] } });
  const result = {
    aggregations: {
      top_rules: {
        buckets: [
          { key: '100', doc_count: 5 },
          { key: '200', doc_count: 3 },
        ],
      },
    },
  };
  const digest = buildDigest('get_top_rules', result, def);
  assert.deepEqual(digest.breakdown, [
    { key: '100', count: 5 },
    { key: '200', count: 3 },
  ]);
  assert.ok(digest.breakdown!.every(b => !('agg' in b)));
});

test('buildDigest: a metric sub-aggregation is merged into the bucket row', () => {
  const def = buildToolDef({
    digest: { sampleColumns: ['key', 'doc_count', 'avg_level'] },
  });
  const result = {
    aggregations: {
      by_agent: {
        buckets: [{ key: 'agent-1', doc_count: 10, avg_level: { value: 4.5 } }],
      },
    },
  };
  const digest = buildDigest('get_agent_stats', result, def);
  assert.deepEqual(digest.samples, [
    { key: 'agent-1', doc_count: 10, avg_level: 4.5 },
  ]);
});

test('buildDigest: multiple top-level aggregations all appear in the breakdown, agg-tagged', () => {
  const def = buildToolDef();
  const result = {
    aggregations: {
      by_agent: { buckets: [{ key: 'agent-1', doc_count: 5 }] },
      by_rule: { buckets: [{ key: '100', doc_count: 3 }] },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.ok(digest.breakdown);
  assert.equal(digest.breakdown!.length, 2);
  const byAgent = digest.breakdown!.find(b => b.agg === 'by_agent');
  const byRule = digest.breakdown!.find(b => b.agg === 'by_rule');
  assert.deepEqual(byAgent, { key: 'agent-1', count: 5, agg: 'by_agent' });
  assert.deepEqual(byRule, { key: '100', count: 3, agg: 'by_rule' });
});

// --- hits-based responses ------------------------------------------------------------------------

test('buildDigest: a null hits element is skipped, not thrown', () => {
  const def = buildToolDef({
    tableSpec: {
      columns: [
        { field: 'a', label: 'A' },
        { field: 'b', label: 'B' },
      ],
    },
    digest: { sampleColumns: ['a', 'b'] },
  });
  const result = {
    hits: {
      total: { value: 2 },
      hits: [{ _source: { a: 1 } }, null, { _source: { b: 2 } }],
    },
  };
  assert.doesNotThrow(() => buildDigest('search_wazuh_data', result, def));
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.deepEqual(digest.samples, [{ a: 1 }, { b: 2 }]);
  assert.equal(digest.counts.returned, 2);
});

// --- deriveResultColumns / deriveColumns tools -----------------------------------------------------

test('buildTableSpec: deriveColumns tools union keys across sample rows, capped and preferred-first', () => {
  const def = buildToolDef({ deriveColumns: true });
  const result = {
    hits: {
      hits: [
        {
          _source: {
            timestamp: '2026-07-13T00:00:00Z',
            agent: { name: 'agent-1' },
            rule: { id: '100' },
          },
        },
        { _source: { timestamp: '2026-07-13T00:01:00Z', extraField: 'x' } },
      ],
    },
  };
  const table = buildTableSpec(result, def);
  const columnIds = table.columns.map(c => c.id);
  assert.ok(columnIds.includes('timestamp'));
  assert.ok(columnIds.includes('agent.name'));
  assert.ok(columnIds.includes('rule.id'));
  assert.ok(columnIds.length <= 8);
});

test("buildTableSpec: deriveColumns tools prefer the request body's explicit _source list", () => {
  const def = buildToolDef({ deriveColumns: true });
  const result = { hits: { hits: [{ _source: { a: 1, b: 2, c: 3 } }] } };
  const requestBody = { _source: ['a', 'c'] };
  const table = buildTableSpec(result, def, requestBody);
  assert.deepEqual(
    table.columns.map(c => c.id),
    ['a', 'c'],
  );
});

// --- capDigest -------------------------------------------------------------------------------------

function makeDigest(samples: Array<Record<string, unknown>>): Digest {
  return {
    tool: 't',
    counts: { returned: samples.length, truncated: false },
    samples,
    columns: [],
  };
}

test('capDigest: truncates an oversized field value before dropping any rows', () => {
  const longValue = 'y'.repeat(1000);
  const digest = makeDigest([{ val: longValue }]);
  const capped = capDigest(digest);
  assert.equal(capped.samples.length, 1);
  const truncated = capped.samples[0].val as string;
  assert.ok(truncated.length < longValue.length);
  assert.ok(truncated.endsWith('…'));
  assert.equal(truncated.length, 501); // 500 chars + ellipsis marker
});

test('capDigest: drops rows once truncation alone cannot fit the char cap', () => {
  const samples = Array.from({ length: 20 }, (_, i) => ({
    idx: i,
    val: 'y'.repeat(600),
  }));
  const digest = makeDigest(samples);
  const capped = capDigest(digest);
  assert.ok(
    capped.samples.length < 20,
    'expected some rows to be dropped to respect the char cap',
  );
  assert.ok(
    JSON.stringify(capped).length <= 6000 || capped.samples.length === 0,
  );
  for (const sample of capped.samples) {
    assert.ok((sample.val as string).length <= 501);
  }
});

test('capDigest: small digests are left untouched', () => {
  const digest = makeDigest([{ a: 1 }, { b: 2 }]);
  const capped = capDigest(digest);
  assert.deepEqual(capped.samples, [{ a: 1 }, { b: 2 }]);
});

// --- zero-row hint -----------------------------------------------------------------------------

function hitsResult(sourceCount: number): unknown {
  return { hits: { total: { value: sourceCount }, hits: [] } };
}

test('buildDigest: a 0-row result with 2+ filters carries a hint naming them', () => {
  const def = buildToolDef();
  const requestBody = {
    query: {
      bool: {
        filter: [
          { match: { 'wazuh.agent.name': 'web-prod-01' } },
          { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
          { terms: { 'wazuh.rule.tags': ['pam'] } },
        ],
      },
    },
  };
  const digest = buildDigest(
    'search_wazuh_data',
    hitsResult(0),
    def,
    requestBody,
  );
  assert.equal(digest.counts.returned, 0);
  assert.ok(digest.hint, 'expected a hint on a 0-row, 3-filter result');
  assert.match(digest.hint!, /^0 rows\. Filters applied:/);
  assert.match(digest.hint!, /wazuh\.agent\.name/);
  assert.match(digest.hint!, /@timestamp/);
  assert.match(digest.hint!, /wazuh\.rule\.tags/);
});

test('buildDigest: a 0-row result with a SINGLE filter carries no hint', () => {
  const def = buildToolDef();
  const requestBody = {
    query: {
      bool: { filter: [{ range: { '@timestamp': { gte: 'now-90d' } } }] },
    },
  };
  const digest = buildDigest(
    'search_wazuh_data',
    hitsResult(0),
    def,
    requestBody,
  );
  assert.equal(digest.counts.returned, 0);
  assert.ok(!('hint' in digest));
});

test('buildDigest: a non-zero-row result carries no hint even with 2+ filters', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'a', label: 'A' }] },
    digest: { sampleColumns: ['a'] },
  });
  const requestBody = {
    query: {
      bool: {
        filter: [
          { match: { 'wazuh.agent.name': 'web-prod-01' } },
          { range: { '@timestamp': { gte: 'now-90d' } } },
        ],
      },
    },
  };
  const result = {
    hits: { total: { value: 1 }, hits: [{ _source: { a: 1 } }] },
  };
  const digest = buildDigest('search_wazuh_data', result, def, requestBody);
  assert.ok(!('hint' in digest));
});

// --- samples non-representative-preview note ----------------------------------------------------

function findingRow(agent: string, rule: string, timestamp: string) {
  return {
    _source: {
      '@timestamp': timestamp,
      wazuh: { agent: { name: agent }, rule: { title: rule } },
    },
  };
}

test('buildDigest: samplesNote appears when returned rows exceed the 5-sample cap, not otherwise', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: { sampleColumns: ['wazuh.agent.name'] },
  });
  const manyHits = Array.from({ length: 8 }, (_, i) =>
    findingRow(`agent-${i}`, 'Rule X', `2026-01-0${(i % 9) + 1}T00:00:00Z`),
  );
  const bigResult = { hits: { total: { value: 8 }, hits: manyHits } };
  const bigDigest = buildDigest('get_critical_findings', bigResult, def);
  assert.equal(bigDigest.samples.length, 5);
  assert.ok(bigDigest.samplesNote);
  assert.match(bigDigest.samplesNote!, /Showing 5 of 8/);

  const smallResult = {
    hits: { total: { value: 2 }, hits: manyHits.slice(0, 2) },
  };
  const smallDigest = buildDigest('get_critical_findings', smallResult, def);
  assert.equal(smallDigest.samples.length, 2);
  assert.ok(!('samplesNote' in smallDigest));
});

// --- synthetic breakdown for aggregative questions on finding-hits tools -------------------------

test('buildDigest: a finding-hits tool with breakdownDimensions synthesizes a breakdown from ALL rows, not just the 5-sample slice', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name', 'wazuh.rule.title'],
    },
  });
  // Mirrors the issue's reproduction: 26 total findings, web-prod-01 (16), web-prod-02 (8),
  // wazuh-aio-5 (2) -- wazuh-aio-5's rows are the OLDEST (sorted ascending here on purpose), so a
  // newest-5 sample would miss it entirely; the breakdown must not.
  const rows: Array<{ _source: Record<string, unknown> }> = [];
  for (let i = 0; i < 2; i++) {
    rows.push(
      findingRow('wazuh-aio-5', 'Rule A', `2025-01-0${i + 1}T00:00:00Z`),
    );
  }
  for (let i = 0; i < 16; i++) {
    rows.push(
      findingRow('web-prod-01', 'Rule B', `2026-06-${10 + i}T00:00:00Z`),
    );
  }
  for (let i = 0; i < 8; i++) {
    rows.push(
      findingRow('web-prod-02', 'Rule C', `2026-07-0${i + 1}T00:00:00Z`),
    );
  }
  const result = { hits: { total: { value: 26 }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);

  assert.equal(
    digest.samples.length,
    5,
    'samples must stay capped at MAX_SAMPLES',
  );
  assert.ok(digest.breakdown, 'expected a synthesized breakdown');

  const agentBuckets = digest.breakdown!.filter(
    b => b.agg === 'wazuh.agent.name',
  );
  const ruleBuckets = digest.breakdown!.filter(
    b => b.agg === 'wazuh.rule.title',
  );
  assert.deepEqual(
    new Map(agentBuckets.map(b => [b.key, b.count])),
    new Map([
      ['web-prod-01', 16],
      ['web-prod-02', 8],
      ['wazuh-aio-5', 2],
    ]),
  );
  assert.deepEqual(
    new Map(ruleBuckets.map(b => [b.key, b.count])),
    new Map([
      ['Rule B', 16],
      ['Rule C', 8],
      ['Rule A', 2],
    ]),
  );
  // Token-bloat guard: only the two declared dimensions appear, nothing else.
  assert.equal(
    agentBuckets.length + ruleBuckets.length,
    digest.breakdown!.length,
  );
});

test('buildDigest: the synthetic breakdown caps each dimension at 5 buckets', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name'],
    },
  });
  // 8 distinct agents, one finding each, plus enough rows to exceed MAX_SAMPLES so the breakdown
  // path actually fires.
  const rows = Array.from({ length: 8 }, (_, i) =>
    findingRow(`agent-${i}`, 'Rule X', '2026-01-01T00:00:00Z'),
  );
  const result = { hits: { total: { value: 8 }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);
  assert.ok(digest.breakdown);
  assert.ok(
    digest.breakdown!.length <= 5,
    `expected at most 5 buckets, got ${digest.breakdown!.length}`,
  );
});

test('buildDigest: no breakdownDimensions opt-in means no synthetic breakdown, even past 5 rows', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: { sampleColumns: ['wazuh.agent.name'] },
  });
  const rows = Array.from({ length: 8 }, (_, i) =>
    findingRow(`agent-${i}`, 'Rule X', '2026-01-01T00:00:00Z'),
  );
  const result = { hits: { total: { value: 8 }, hits: rows } };
  const digest = buildDigest('get_findings_by_time', result, def);
  assert.ok(!('breakdown' in digest));
});

test('buildDigest: a REAL aggregation breakdown takes priority over synthesizing one', () => {
  const def = buildToolDef({
    digest: {
      sampleColumns: ['key'],
      breakdownDimensions: ['wazuh.agent.name'],
    },
  });
  const result = {
    aggregations: {
      top_rules: {
        buckets: [
          { key: '100', doc_count: 5 },
          { key: '200', doc_count: 3 },
        ],
      },
    },
  };
  const digest = buildDigest('get_top_rules', result, def);
  assert.deepEqual(digest.breakdown, [
    { key: '100', count: 5 },
    { key: '200', count: 3 },
  ]);
});

// --- #8870 validation-gate: breakdown must reflect the MATCHED set, not the returned page --------

test('buildDigest: a real aggregation reflects the full matched set even when limit < total truncates the page', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name', 'wazuh.rule.title'],
    },
  });
  // Mirrors the issue's validation-gate reproduction verbatim: limit:20 returns a 20-row PAGE of a
  // 26-row matched set (true distribution 16/8/2 agents, 13/13 rules). A breakdown grouped over
  // only the 20 returned rows (buildSyntheticBreakdown) would reproduce the observed defect
  // (13/7, 11/9 -- a third agent invisible). `catalog/common.ts`'s `FINDING_BREAKDOWN_AGGS` attaches
  // a REAL terms aggregation to the SAME request, which OpenSearch computes over the full 26-row
  // matched set regardless of `size` -- this result mocks exactly that response shape: `hits`
  // truncated to the 20-row page, `aggregations` carrying the true 26-row distribution.
  const rows = Array.from({ length: 20 }, (_, i) =>
    findingRow(`agent-${i}`, 'Rule Z', '2026-01-01T00:00:00Z'),
  );
  const result = {
    hits: { total: { value: 26 }, hits: rows },
    aggregations: {
      wazuh_agent_name: {
        buckets: [
          { key: 'web-prod-01', doc_count: 16 },
          { key: 'web-prod-02', doc_count: 8 },
          { key: 'wazuh-aio-5', doc_count: 2 },
        ],
      },
      wazuh_rule_title: {
        buckets: [
          { key: 'Rule B', doc_count: 13 },
          { key: 'Rule A', doc_count: 13 },
        ],
      },
    },
  };
  const digest = buildDigest('get_critical_findings', result, def);

  assert.equal(digest.counts.total, 26);
  assert.equal(digest.counts.returned, 20);
  assert.equal(digest.counts.truncated, true);
  assert.ok(
    !('breakdownNote' in digest),
    'a REAL aggregation is population-true and needs no page-only caveat',
  );

  const agentBuckets = digest.breakdown!.filter(
    b => b.agg === 'wazuh_agent_name',
  );
  assert.deepEqual(
    new Map(agentBuckets.map(b => [b.key, b.count])),
    new Map([
      ['web-prod-01', 16],
      ['web-prod-02', 8],
      ['wazuh-aio-5', 2],
    ]),
  );
  const ruleBuckets = digest.breakdown!.filter(
    b => b.agg === 'wazuh_rule_title',
  );
  assert.deepEqual(
    new Map(ruleBuckets.map(b => [b.key, b.count])),
    new Map([
      ['Rule B', 13],
      ['Rule A', 13],
    ]),
  );
});

test('buildDigest: a synthetic breakdown over a truncated page is labeled page-only, never presented as the population', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name'],
    },
  });
  // No `aggregations` on this mock result -- the "adding a real aggregation is impossible for this
  // caller" case buildSyntheticBreakdown remains the fallback for. `hits.total.value` (26) exceeds
  // the 8 rows actually returned: the synthesized breakdown can only ever see this page, so it must
  // carry `breakdownNote` instead of being handed to the model as if it were the full distribution.
  const rows = Array.from({ length: 8 }, () =>
    findingRow('web-prod-01', 'Rule X', '2026-01-01T00:00:00Z'),
  );
  const result = { hits: { total: { value: 26 }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);

  assert.equal(digest.counts.truncated, true);
  assert.ok(
    digest.breakdown,
    'expected a synthesized breakdown despite being page-scoped',
  );
  assert.ok(
    digest.breakdownNote,
    'expected a page-only caveat on a truncated synthetic breakdown',
  );
  assert.match(digest.breakdownNote!, /covers only the 8 returned rows/);
  assert.match(digest.breakdownNote!, /not all 26 matching rows/);
  // samplesNote must not instruct the model to trust this same page-scoped breakdown.
  assert.ok(digest.samplesNote);
  assert.equal(/Use counts\/breakdown/.test(digest.samplesNote!), false);
});

test('buildDigest: a REAL breakdown with a truncated bucket list discloses sum_other_doc_count', () => {
  // A terms agg sized 5 on a 12-agent deployment: OpenSearch returns the top 5 buckets plus
  // sum_other_doc_count for the rest. Without the note, the digest certified a top-5 agent list
  // as the population — the sample-narrated-as-population class one layer up, with the digest's
  // own "use counts/breakdown" wording as warrant.
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: { sampleColumns: ['wazuh.agent.name'] },
  });
  const result = {
    hits: { total: { value: 120 }, hits: [] },
    aggregations: {
      wazuh_agent_name: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 37,
        buckets: [
          { key: 'web-prod-01', doc_count: 40 },
          { key: 'web-prod-02', doc_count: 25 },
          { key: 'db-01', doc_count: 10 },
          { key: 'db-02', doc_count: 5 },
          { key: 'mail-01', doc_count: 3 },
        ],
      },
    },
  };
  const digest = buildDigest('get_vulnerabilities', result, def);
  assert.ok(digest.breakdownNote, 'expected the bucket-truncation note');
  // The count must appear, but NOT as "37 additional rows": the note is worded per dimension and in
  // terms of further MATCHES, because on a multi-valued keyword field the remainder can be the same
  // documents counted again under other keys (see buildBucketTruncationNote).
  assert.match(digest.breakdownNote!, /\b37\b/);
  assert.doesNotMatch(digest.breakdownNote!, /37 additional rows/);
  // `/not.*complete set|complete set/i` (the previous form) collapses to `/complete set/i`: `|`
  // binds looser than concatenation, so the second alternative alone matches any occurrence of
  // "complete set" regardless of whether "not" precedes it -- the `not.*` branch was dead and
  // could never make the assertion fail on its own. Requiring "not" to actually precede the
  // completeness claim is what the test name always meant. Deliberately loose on the word
  // "complete" itself (not pinned to the literal phrase "complete set of values") because
  // digest.ts's per-aggregation reword of this note (in flight elsewhere) may name the truncated
  // dimension inline; the semantic requirement -- the note must NEGATE completeness, not just
  // mention it -- holds regardless of that wording.
  assert.match(
    digest.breakdownNote!,
    /not[\s\S]{0,80}complete/i,
    'the truncation note must actually negate completeness, not merely contain the word ' +
      '"complete" somewhere unrelated',
  );
});

test('buildDigest: a REAL breakdown with a complete bucket list stays note-free (byte-identical)', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: { sampleColumns: ['wazuh.agent.name'] },
  });
  const result = {
    aggregations: {
      wazuh_agent_name: {
        sum_other_doc_count: 0,
        buckets: [{ key: 'web-prod-01', doc_count: 40 }],
      },
    },
  };
  const digest = buildDigest('get_vulnerabilities', result, def);
  assert.ok(!('breakdownNote' in digest));
});

test('buildDigest: samplesNote still points at a REAL breakdown whose counts are exact, even with a truncated key set', () => {
  // The key-set truncation note (case 2) must NOT flip samplesNote into its distrust variant —
  // that wording ("ALSO scoped to only these returned rows") is specific to the synthetic
  // page-scope case and would be false for a real aggregation.
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: { sampleColumns: ['wazuh.agent.name'] },
  });
  const rows = Array.from({ length: 8 }, () =>
    findingRow('web-prod-01', 'Rule X', '2026-01-01T00:00:00Z'),
  );
  const result = {
    hits: { total: { value: 120 }, hits: rows },
    aggregations: {
      wazuh_agent_name: {
        sum_other_doc_count: 37,
        buckets: [{ key: 'web-prod-01', doc_count: 83 }],
      },
    },
  };
  const digest = buildDigest('get_vulnerabilities', result, def);
  assert.ok(digest.breakdownNote);
  assert.ok(digest.samplesNote);
  assert.match(digest.samplesNote!, /Use counts\/breakdown/);
});

// --- message / breakdown[].key hardening (#8890) ---------------------------------------------

/** Regex control-character classes (e.g. /[\x00-\x1F]/) are themselves flagged by
 * `no-control-regex` — this checks by code point instead, mirroring digest.ts's own
 * `stripControlChars`. */
function hasControlChar(value: string): boolean {
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint < 0x20 || codePoint === 0x7f) {
      return true;
    }
  }
  return false;
}

test('buildDigest: the Manager "message" field is stripped of control characters and capped at MAX_FIELD_VALUE_LENGTH', () => {
  const def = buildToolDef();
  const dirtyMessage = `AR failed\x07\x1B[31m: ${'x'.repeat(600)}`;
  const result = {
    data: { affected_items: [], total_affected_items: 0 },
    message: dirtyMessage,
  };
  const digest = buildDigest('run_active_response', result, def);
  assert.ok(digest.message, 'message should be present');
  assert.ok(
    !hasControlChar(digest.message as string),
    'control characters must be stripped from message',
  );
  assert.equal((digest.message as string).length, 501); // 500 chars + ellipsis marker
  assert.ok((digest.message as string).endsWith('…'));
});

test('buildDigest: a short, clean "message" is left byte-identical', () => {
  const def = buildToolDef();
  const result = {
    data: { affected_items: [], total_affected_items: 0 },
    message: 'AR command was not sent to any agent',
  };
  const digest = buildDigest('run_active_response', result, def);
  assert.equal(digest.message, 'AR command was not sent to any agent');
});

test('buildDigest: breakdown "key" values are stripped of control characters and capped at MAX_FIELD_VALUE_LENGTH', () => {
  const def = buildToolDef();
  const dirtyKey = `rule\x01${'y'.repeat(600)}`;
  const result = {
    aggregations: {
      top_rules: { buckets: [{ key: dirtyKey, doc_count: 3 }] },
    },
  };
  const digest = buildDigest('get_top_rules', result, def);
  const key = digest.breakdown![0].key;
  assert.ok(
    !hasControlChar(key),
    'control characters must be stripped from the key',
  );
  assert.equal(key.length, 501); // 500 chars + ellipsis marker
  assert.ok(key.endsWith('…'));
});

test('capDigest: an oversized "columns" list forces the Manager message to be dropped once samples/breakdown are already exhausted', () => {
  const digest: Digest = {
    tool: 't',
    counts: { returned: 0, truncated: false },
    samples: [],
    columns: Array.from(
      { length: 200 },
      (_, i) => `some.very.long.column.path.name.${i}`,
    ),
    message: 'a short, otherwise-harmless message',
  };
  const capped = capDigest(digest);
  assert.ok(
    !('message' in capped),
    'message is dropped as the last-resort step once nothing else remains to trim',
  );
});

// --- #8920 item 5: top-level metric aggregations are no longer dropped -------------------------

test('isMetricAggValue: accepts {value: number|null}, rejects buckets/hits/non-object shapes', () => {
  assert.equal(isMetricAggValue({ value: 6 }), true);
  assert.equal(isMetricAggValue({ value: null }), true);
  assert.equal(isMetricAggValue({ value: 6, buckets: [] }), false);
  assert.equal(isMetricAggValue({ value: 6, hits: { hits: [] } }), false);
  assert.equal(
    isMetricAggValue({ buckets: [{ key: 'a', doc_count: 1 }] }),
    false,
  );
  assert.equal(isMetricAggValue({ value: '6' }), false);
  assert.equal(isMetricAggValue(null), false);
  assert.equal(isMetricAggValue(undefined), false);
  assert.equal(isMetricAggValue([1, 2]), false);
  assert.equal(isMetricAggValue('x'), false);
});

/**
 * One REAL OpenSearch response shape per supported metric type — not a shared synthetic
 * `{value: 6}` for all of them, which would let a type whose real response is NOT `{value}`
 * (percentiles, stats) be added to SUPPORTED_METRIC_AGG_TYPES and pass anyway. min/max include
 * the `value_as_string` a date-field aggregation returns; the sync test below fails if a type is
 * added to SUPPORTED_METRIC_AGG_TYPES without a real fixture here.
 */
const REAL_METRIC_AGG_RESPONSES: Record<string, Record<string, unknown>> = {
  cardinality: { value: 6 },
  value_count: { value: 4812 },
  avg: { value: 7.32 },
  sum: { value: 120 },
  min: {
    value: 1704067200000,
    value_as_string: '2026-01-01T00:00:00.000Z',
  },
  max: {
    value: 1786000000000,
    value_as_string: '2026-08-09T12:26:40.000Z',
  },
};

test('every SUPPORTED_METRIC_AGG_TYPES entry has a real response fixture in this file', () => {
  // The per-type loop below is only as strong as this sync: a type added to the list without a
  // REAL response shape here would otherwise be tested against nothing.
  for (const type of SUPPORTED_METRIC_AGG_TYPES) {
    assert.ok(
      REAL_METRIC_AGG_RESPONSES[type],
      `${type}: add its real OpenSearch response shape to REAL_METRIC_AGG_RESPONSES`,
    );
  }
});

test('buildDigest: a metric-only response synthesizes ONE row per SUPPORTED_METRIC_AGG_TYPES entry, not returned:0', () => {
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  for (const type of SUPPORTED_METRIC_AGG_TYPES) {
    const aggKey = `${type}_result`;
    const response = REAL_METRIC_AGG_RESPONSES[type];
    const result = { aggregations: { [aggKey]: response } };
    const digest = buildDigest('search_wazuh_data', result, def);
    assert.equal(
      digest.counts.returned,
      1,
      `${type}: expected returned:1, not the pre-fix returned:0`,
    );
    // counts.total is pinned as 1 too: the synthesized row IS the result set here — there is no
    // hits row set to count (size:0, metric-only), and inventing hits.total would flip
    // `truncated` for a result that is not truncated.
    assert.equal(digest.counts.total, 1, `${type}: synthesized-row total`);
    assert.deepEqual(
      digest.samples,
      [{ [aggKey]: response.value }],
      `${type}: expected the computed value to reach samples`,
    );
    // The projection-immune carrier is ALSO populated (see Digest.metrics doc comment), with
    // value_as_string carried through when the response provides it (min/max on a date field).
    assert.deepEqual(
      digest.metrics,
      [
        {
          agg: aggKey,
          value: response.value,
          ...(typeof response.value_as_string === 'string'
            ? { value_as_string: response.value_as_string }
            : {}),
        },
      ],
      `${type}: expected a metrics entry`,
    );
    assert.equal(
      digest.hint,
      undefined,
      `${type}: a fully-represented response must not carry the unrepresentable-agg hint`,
    );
  }
});

/**
 * The negative half of the class guard: aggregation shapes this digest CANNOT represent must not
 * silently serialize as a bare `returned: 0` — they get no rows, but the hint must name them so
 * the model can re-query instead of reporting "no data" for a query OpenSearch answered. Each
 * fixture is that aggregation's REAL response shape.
 */
const UNREPRESENTABLE_AGG_RESPONSES: Record<string, Record<string, unknown>> = {
  stats: { count: 10, min: 1, max: 12, avg: 6.6, sum: 66 },
  extended_stats: {
    count: 10,
    min: 1,
    max: 12,
    avg: 6.6,
    sum: 66,
    sum_of_squares: 506,
    variance: 12.04,
    std_deviation: 3.47,
  },
  percentiles: { values: { '95.0': 11.2, '99.0': 12 } },
  top_metrics: { top: [{ sort: [3], metrics: { 'wazuh.rule.level': 12 } }] },
  // `filters` with NAMED filters / range with keyed:true — buckets is an OBJECT, not an array.
  keyed_filters: {
    buckets: { high: { doc_count: 37 }, low: { doc_count: 29 } },
  },
  keyed_range: {
    buckets: { '*-100.0': { doc_count: 2 }, '100.0-*': { doc_count: 4 } },
  },
};

test('buildDigest: an unrepresentable aggregation shape yields 0 rows PLUS a hint naming it', () => {
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  for (const [name, response] of Object.entries(
    UNREPRESENTABLE_AGG_RESPONSES,
  )) {
    const result = { aggregations: { [name]: response } };
    const digest = buildDigest('search_wazuh_data', result, def);
    assert.equal(digest.counts.returned, 0, `${name}: no row can be built`);
    assert.ok(digest.hint, `${name}: the terminal guard hint must fire`);
    assert.ok(
      digest.hint!.includes(name),
      `${name}: the hint must name the unrepresentable aggregation`,
    );
    assert.equal(
      digest.metrics,
      undefined,
      `${name}: no metrics entry can be fabricated for it`,
    );
  }
});

test('buildDigest: a top-level single-bucket filter agg reports its doc_count, not returned:0', () => {
  // {doc_count} with no buckets/hits/value — filter/global/missing/nested. bucketsToRows already
  // merged this exact shape for SUB-aggregations; the top level must not be the one place it is
  // silently dropped.
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  const result = { aggregations: { criticals: { doc_count: 37 } } };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.equal(digest.counts.returned, 1);
  assert.deepEqual(digest.samples, [{ criticals: 37 }]);
  assert.deepEqual(digest.metrics, [{ agg: 'criticals', value: 37 }]);
  assert.equal(digest.hint, undefined);
});

test('buildDigest: a metric-only response with a _source list is NOT projected into empty samples', () => {
  // deriveResultColumns' priority 1 returns `_source` verbatim; the synthesized metric row's keys
  // are aggregation NAMES, so that projection produced samples:[{}] with returned:1 — a row that
  // asserts it exists and carries nothing. The agg-name row must win column derivation instead.
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  const body = {
    size: 0,
    _source: ['wazuh.rule.id'],
    aggs: { distinct_agents: { cardinality: { field: 'wazuh.agent.id' } } },
  };
  const result = { aggregations: { distinct_agents: { value: 6 } } };
  const digest = buildDigest('search_wazuh_data', result, def, body);
  assert.deepEqual(digest.samples, [{ distinct_agents: 6 }]);
  assert.deepEqual(digest.columns, ['distinct_agents']);
});

test('buildDigest: a NON-deriveColumns tool with a metric-only response still carries the answer in metrics', () => {
  // A typed tool's static sampleColumns can never name a model-chosen agg, so the synthesized
  // row projects to an empty sample — `metrics` is the projection-immune carrier that must hold
  // the computed value regardless.
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.rule.id', label: 'Rule' }] },
    digest: { sampleColumns: ['wazuh.rule.id'] },
  });
  const result = { aggregations: { distinct_agents: { value: 6 } } };
  const digest = buildDigest('get_some_tool', result, def);
  assert.deepEqual(digest.metrics, [{ agg: 'distinct_agents', value: 6 }]);
});

test('buildDigest: a metric agg with value:null passes through as null, not dropped', () => {
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  const result = { aggregations: { avg_level: { value: null } } };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.equal(digest.counts.returned, 1);
  assert.deepEqual(digest.samples, [{ avg_level: null }]);
});

test('buildDigest: a metric-only response carries metrics AND the synthesized row', () => {
  // Deliberately double-represented: the row feeds the rendered table and is subject to column
  // projection, `metrics` is the projection-immune carrier — see Digest.metrics' doc comment.
  const def = buildToolDef({
    deriveColumns: true,
    digest: { sampleColumns: [] },
  });
  const result = { aggregations: { distinct_agents: { value: 6 } } };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.deepEqual(digest.samples, [{ distinct_agents: 6 }]);
  assert.deepEqual(digest.metrics, [{ agg: 'distinct_agents', value: 6 }]);
});

test('buildDigest: a metric agg BEFORE a bucket agg in key order no longer masks the bucket rows', () => {
  // Reproduces the exact pre-fix defect: Object.keys(aggregations)[0] was "distinct_agents" (no
  // .buckets), so bucketsToRows used to bail out to `undefined` before ever looking at "by_rule".
  const def = buildToolDef({
    tableSpec: {
      columns: [
        { field: 'key', label: 'Key' },
        { field: 'doc_count', label: 'Count' },
      ],
    },
    digest: { sampleColumns: ['key', 'doc_count'] },
  });
  const result = {
    aggregations: {
      distinct_agents: { value: 6 },
      by_rule: { buckets: [{ key: '100', doc_count: 5 }] },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.equal(digest.counts.returned, 1, 'the bucket agg must still be found');
  assert.deepEqual(digest.samples, [{ key: '100', doc_count: 5 }]);
  assert.deepEqual(digest.metrics, [{ agg: 'distinct_agents', value: 6 }]);
});

test('buildTableSpec: a metric agg BEFORE a bucket agg in key order does not blank out the table', () => {
  const def = buildToolDef({ deriveColumns: true });
  const result = {
    aggregations: {
      distinct_agents: { value: 6 },
      by_rule: { buckets: [{ key: '100', doc_count: 5 }] },
    },
  };
  const table = buildTableSpec(result, def);
  assert.deepEqual(table.rows, [{ key: '100', doc_count: 5 }]);
});

test('buildDigest: a metric agg AFTER a bucket agg carries digest.metrics alongside the bucket rows', () => {
  const def = buildToolDef({
    tableSpec: {
      columns: [
        { field: 'key', label: 'Key' },
        { field: 'doc_count', label: 'Count' },
      ],
    },
    digest: { sampleColumns: ['key', 'doc_count'] },
  });
  const result = {
    aggregations: {
      by_rule: { buckets: [{ key: '100', doc_count: 5 }] },
      distinct_agents: { value: 6 },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.deepEqual(digest.samples, [{ key: '100', doc_count: 5 }]);
  assert.deepEqual(digest.metrics, [{ agg: 'distinct_agents', value: 6 }]);
});

test('buildDigest: digest.metrics carries a null metric value through unchanged when mixed with a bucket agg', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'key', label: 'Key' }] },
    digest: { sampleColumns: ['key'] },
  });
  const result = {
    aggregations: {
      by_rule: { buckets: [{ key: '100', doc_count: 5 }] },
      avg_level: { value: null },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.deepEqual(digest.metrics, [{ agg: 'avg_level', value: null }]);
});

test('buildDigest: a metric agg alongside HITS rows (not a bucket agg) also carries digest.metrics', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'a', label: 'A' }] },
    digest: { sampleColumns: ['a'] },
  });
  const result = {
    hits: { total: { value: 1 }, hits: [{ _source: { a: 1 } }] },
    aggregations: { distinct_agents: { value: 6 } },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  assert.deepEqual(digest.samples, [{ a: 1 }]);
  assert.deepEqual(digest.metrics, [{ agg: 'distinct_agents', value: 6 }]);
});

test('buildDigest: a single terms-agg digest carries no "metrics" field (regression, unchanged fixture)', () => {
  // Exact fixture from "buildDigest: single aggregation buckets become a breakdown without an
  // 'agg' tag" above -- a bucket-only response must stay byte-identical, no new field appears.
  const def = buildToolDef({ digest: { sampleColumns: ['key'] } });
  const result = {
    aggregations: {
      top_rules: {
        buckets: [
          { key: '100', doc_count: 5 },
          { key: '200', doc_count: 3 },
        ],
      },
    },
  };
  const digest = buildDigest('get_top_rules', result, def);
  assert.ok(
    !('metrics' in digest),
    'a bucket-only response must not gain a metrics field',
  );
});

test('buildDigest: a manager-response digest (no aggregations at all) carries no "metrics" field', () => {
  const def = buildToolDef();
  const result = { data: { affected_items: ['001'], total_affected_items: 1 } };
  const digest = buildDigest('get_active_agents', result, def);
  assert.ok(!('metrics' in digest));
});

// --- registry-wide sync: no tool description advertises a metric shape the digest can't hold ----

/**
 * Coverage test for #8920 item 5's class fix: iterates EVERY tool spec description (not just
 * search_wazuh_data's) and extracts aggregation-type words. `top_hits`/`terms` are BUCKET-family
 * words (already handled by `bucketsToRows`' per-bucket sub-agg merge / real-bucket scan) and are
 * deliberately not checked against `SUPPORTED_METRIC_AGG_TYPES` here — only the METRIC-family
 * words are, since those are the ones whose response shape `isMetricAggValue` must recognize.
 * `percentiles`/`stats`/`extended_stats` are real OpenSearch metric aggregations this digest
 * pipeline does NOT support (see `SUPPORTED_METRIC_AGG_TYPES`'s doc comment: their response is a
 * multi-value object, not `{value}`) — a tool description that ever advertises one of those would
 * repeat the exact silent-drop defect this cluster fixes, just for a shape `isMetricAggValue`
 * cannot represent, so this test fails on that too. Nothing is exempt by default: a new tool
 * registered later, or a wording change to an existing one, is checked automatically.
 */
const AGG_TYPE_WORD_RE =
  /\b(cardinality|avg|sum|min|max|value_count|percentiles|stats|extended_stats|top_hits|terms)\b/g;
const METRIC_FAMILY_WORDS = new Set([
  'cardinality',
  'avg',
  'sum',
  'min',
  'max',
  'value_count',
  'percentiles',
  'stats',
  'extended_stats',
]);

test('description/digest sync: no tool description advertises a metric shape the digest drops', () => {
  const offenders: string[] = [];
  // Without this guard the loop passes vacuously if AGG_TYPE_WORD_RE ever stopped matching any
  // registered tool description at all (a wording rewrite, a regex typo) -- same standard as
  // agg-representability-coverage.test.ts's indexerTools.length guard.
  let checkedCount = 0;
  for (const def of listToolDefinitions()) {
    const words = def.spec.description.match(AGG_TYPE_WORD_RE) ?? [];
    for (const word of new Set(words)) {
      checkedCount += 1;
      if (
        METRIC_FAMILY_WORDS.has(word) &&
        !(SUPPORTED_METRIC_AGG_TYPES as readonly string[]).includes(word)
      ) {
        offenders.push(`${def.spec.name}: advertises "${word}"`);
      }
    }
  }
  assert.ok(
    checkedCount > 0,
    'no registered tool description matched AGG_TYPE_WORD_RE -- this test would pass vacuously',
  );
  assert.deepEqual(
    offenders,
    [],
    'A tool description names a metric aggregation type digest.ts cannot represent as {value} -- ' +
      'either add it to SUPPORTED_METRIC_AGG_TYPES (only if its response really is {value: ' +
      'number|null}) or remove the claim from the description.',
  );
});

test('description/digest sync mechanism: SUPPORTED_METRIC_AGG_TYPES is exactly the METRIC_FAMILY_WORDS the digest supports', () => {
  // Sanity check for the test above's own logic: every SUPPORTED_METRIC_AGG_TYPES entry must
  // itself be one of the words this file's regex/word-family split can even recognize as
  // "metric-family" -- otherwise a typo in SUPPORTED_METRIC_AGG_TYPES would silently make the sync
  // test above pass for the wrong reason (the word never being extracted at all).
  for (const type of SUPPORTED_METRIC_AGG_TYPES) {
    assert.ok(
      METRIC_FAMILY_WORDS.has(type),
      `${type}: must be present in this test file's METRIC_FAMILY_WORDS too`,
    );
  }
});

test('buildDigest: a cardinality metric is marked approximate; a count metric is not', () => {
  // The response shape is `{value: N}` for EVERY metric type, so only the REQUEST can say whether a
  // number is a count or an HLL++ estimate. Item 5 made metric aggregations answerable at all, so an
  // unmarked distinct count would be a NEW confidently-exact-looking answer in the very issue that
  // exists to remove confidently-wrong ones.
  const def = buildToolDef();
  const requestBody = {
    size: 0,
    aggs: {
      distinct_hosts: { cardinality: { field: 'wazuh.agent.name' } },
      total_rows: { value_count: { field: 'wazuh.agent.name' } },
    },
  };
  const result = {
    hits: { hits: [], total: { value: 0 } },
    aggregations: {
      distinct_hosts: { value: 6 },
      total_rows: { value: 918 },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def, requestBody);
  const distinct = digest.metrics?.find(m => m.agg === 'distinct_hosts');
  const counted = digest.metrics?.find(m => m.agg === 'total_rows');
  assert.equal(distinct?.value, 6);
  assert.equal(distinct?.approximate, true, 'cardinality must be flagged');
  assert.equal(counted?.value, 918);
  assert.equal(
    counted?.approximate,
    undefined,
    'value_count is exact and must NOT be flagged',
  );
});

// --- #8935 item 1: real-breakdown carry cap (ANSWER_BUCKET_CAP) --------------------------------

/** A single-terms-agg response with `count` short, realistic-length ("check-0000".."check-00NN")
 * bucket keys — mirrors an enumeration-sized aggregation (e.g. get_sca_results' policies agg). */
function manyBucketsResult(count: number): unknown {
  return {
    aggregations: {
      policies: {
        buckets: Array.from({ length: count }, (_, i) => ({
          key: `check-${String(i).padStart(4, '0')}`,
          doc_count: count - i,
        })),
      },
    },
  };
}

test('buildDigest: a 100-bucket real aggregation is carried up to ANSWER_BUCKET_CAP, with the rest disclosed', () => {
  // FAILS ON BASE: buildBreakdown is unbounded, so the base carries all 100 entries with no
  // trim/note at all -- 100 short keys serialize well under DIGEST_CHAR_CAP, so capDigest's own
  // char-cap pop never even fires to mask the gap.
  const def = buildToolDef({ digest: { sampleColumns: ['key'] } });
  const digest = buildDigest('get_sca_results', manyBucketsResult(100), def);

  assert.equal(digest.breakdown!.length, ANSWER_BUCKET_CAP);
  // The 50 carried buckets are the top 50 by count (doc_count descends as i ascends above).
  assert.deepEqual(
    digest.breakdown!.map(b => b.key),
    Array.from(
      { length: ANSWER_BUCKET_CAP },
      (_, i) => `check-${String(i).padStart(4, '0')}`,
    ),
  );
  assert.ok(digest.breakdownNote, 'expected a carry-cap disclosure note');
  // Hidden buckets are check-0050..check-0099, doc_count 50 down to 1 -> sum = 1+2+...+50 = 1275.
  assert.match(digest.breakdownNote!, /\b1275\b/);
  assert.match(digest.breakdownNote!, new RegExp(`top ${ANSWER_BUCKET_CAP}`));
  assert.ok(
    JSON.stringify(digest).length <= 6000,
    'the digest carrying 50 buckets must still respect DIGEST_CHAR_CAP',
  );
  // Samples must survive the carry cap untouched -- this is a breakdown-only budget.
  assert.equal(digest.samples.length, 0); // no hits/aggregation-only response here
});

test('buildDigest: a real aggregation at or under ANSWER_BUCKET_CAP is carried whole, no trim note (regression pin)', () => {
  // Passes on base too -- this pins the "small breakdowns are untouched" half of the contract so a
  // future change to the carry cap cannot silently start trimming ordinary-sized breakdowns.
  const def = buildToolDef({ digest: { sampleColumns: ['key'] } });
  const digest = buildDigest(
    'get_sca_results',
    manyBucketsResult(ANSWER_BUCKET_CAP),
    def,
  );
  assert.equal(digest.breakdown!.length, ANSWER_BUCKET_CAP);
  assert.ok(!('breakdownNote' in digest));
});

test('buildDigest: a carry-cap trim MERGES with an existing sum_other_doc_count into one note', () => {
  // 60 real buckets (a request-side terms size of 60), of which OpenSearch itself only returned 55
  // (sum_other_doc_count: 12 for whatever fell outside size:55) -- both the request-side remainder
  // AND the digest-side carry-cap remainder (buckets 51-55) must land in the SAME merged figure.
  // FAILS ON BASE: the base carries all 55 buckets whole and never looks at ANSWER_BUCKET_CAP, so
  // there is no digest-side component to merge -- only sum_other_doc_count would ever show, and
  // that is a case the base already handles (see the pre-existing `discloses sum_other_doc_count`
  // test above), so this test specifically exercises the union the base cannot produce.
  const bucketCount = 55;
  const result = {
    aggregations: {
      policies: {
        sum_other_doc_count: 12,
        buckets: Array.from({ length: bucketCount }, (_, i) => ({
          key: `check-${String(i).padStart(4, '0')}`,
          doc_count: bucketCount - i,
        })),
      },
    },
  };
  const def = buildToolDef({ digest: { sampleColumns: ['key'] } });
  const digest = buildDigest('get_sca_results', result, def);
  assert.equal(digest.breakdown!.length, ANSWER_BUCKET_CAP);
  assert.ok(digest.breakdownNote);
  // Hidden buckets 50-54 (5 buckets) have doc_count 5,4,3,2,1 -> sum 15; merged with the request
  // side's 12 -> 27.
  assert.match(digest.breakdownNote!, /\b27\b/);
  assert.doesNotMatch(
    digest.breakdownNote!,
    /\b12\b/,
    'the raw un-merged request-side figure must not appear on its own',
  );
});

test('buildDigest: a multi-agg carry-cap trim attributes hidden buckets to the RIGHT aggregation', () => {
  // FAILS ON BASE: same "no carry cap at all" reason as the single-agg case, but this also pins
  // that per-agg attribution survives the trim -- a naive single merged figure would blur which
  // aggregation the hidden buckets belong to.
  const def = buildToolDef();
  const result = {
    aggregations: {
      by_agent: {
        buckets: Array.from({ length: 60 }, (_, i) => ({
          key: `agent-${String(i).padStart(3, '0')}`,
          doc_count: 1,
        })),
      },
      by_rule: {
        buckets: [{ key: 'Rule A', doc_count: 999 }],
      },
    },
  };
  const digest = buildDigest('search_wazuh_data', result, def);
  const agentBuckets = digest.breakdown!.filter(b => b.agg === 'by_agent');
  const ruleBuckets = digest.breakdown!.filter(b => b.agg === 'by_rule');
  assert.equal(agentBuckets.length, ANSWER_BUCKET_CAP);
  assert.equal(ruleBuckets.length, 1);
  assert.ok(digest.breakdownNote);
  assert.match(digest.breakdownNote!, /by_agent: 10\b/); // 10 hidden agent buckets, doc_count 1 each
  assert.doesNotMatch(
    digest.breakdownNote!,
    /by_rule: [1-9]/,
    'by_rule was never trimmed and must not be named as a truncated dimension',
  );
});

// --- #8935 item 1: synthetic-breakdown silent-trim fix ------------------------------------------

test('buildDigest: a synthetic breakdown over an untruncated page discloses hidden values beyond BREAKDOWN_BUCKET_CAP', () => {
  // FAILS ON BASE: `returned === total` here (no page truncation), so the base's ONLY breakdownNote
  // trigger (`truncated`) never fires -- base emits exactly 5 buckets and NO note, even though 12
  // distinct agents fired and 7 of them are invisible in the key list. This is the silent bind the
  // audit found: unlike a real terms aggregation, buildSyntheticBreakdown had no sum_other_doc_count
  // equivalent to disclose it with.
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name'],
    },
  });
  // 12 distinct agents, decreasing finding counts so the top-5 cut is deterministic: agent-00 (12
  // rows) down to agent-11 (1 row) -- 78 rows total, ALL returned (untruncated).
  const rows: Array<{ _source: Record<string, unknown> }> = [];
  for (let i = 0; i < 12; i++) {
    const findingsForAgent = 12 - i;
    for (let j = 0; j < findingsForAgent; j++) {
      rows.push(
        findingRow(
          `agent-${String(i).padStart(2, '0')}`,
          'Rule X',
          `2026-01-${String(j + 1).padStart(2, '0')}T00:00:00Z`,
        ),
      );
    }
  }
  const total = rows.length;
  const result = { hits: { total: { value: total }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);

  assert.equal(
    digest.counts.truncated,
    false,
    'the whole matched set was returned',
  );
  assert.equal(digest.breakdown!.length, BREAKDOWN_BUCKET_CAP);
  assert.ok(
    digest.breakdownNote,
    'expected a hidden-values disclosure for the 7 agents outside the top 5',
  );
  assert.match(
    digest.breakdownNote!,
    new RegExp(`top ${BREAKDOWN_BUCKET_CAP}`),
  );
  // Hidden agents are agent-05..agent-11 (7 agents), with finding counts 7,6,5,4,3,2,1 -> sum 28.
  assert.match(digest.breakdownNote!, /\b28\b/);
  // Case-2 semantics, not the synthetic page-scope case: counts stay exact and population-true, so
  // samplesNote must still say "trust the breakdown", never the distrust wording.
  assert.ok(digest.samplesNote);
  assert.match(digest.samplesNote!, /Use counts\/breakdown/);
});

test('buildDigest: a synthetic breakdown with every dimension at or under BREAKDOWN_BUCKET_CAP distinct values stays note-free (regression pin)', () => {
  const def = buildToolDef({
    tableSpec: { columns: [{ field: 'wazuh.agent.name', label: 'Agent' }] },
    digest: {
      sampleColumns: ['wazuh.agent.name'],
      breakdownDimensions: ['wazuh.agent.name'],
    },
  });
  // 4 distinct agents (<= BREAKDOWN_BUCKET_CAP), untruncated -- no hidden values to disclose.
  const rows = Array.from({ length: 8 }, (_, i) =>
    findingRow(`agent-${i % 4}`, 'Rule X', `2026-01-0${(i % 9) + 1}T00:00:00Z`),
  );
  const result = { hits: { total: { value: 8 }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);
  assert.equal(digest.counts.truncated, false);
  assert.ok(!('breakdownNote' in digest));
});
