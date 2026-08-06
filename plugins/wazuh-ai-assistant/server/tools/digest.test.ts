import assert from 'node:assert/strict';
import { buildDigest, buildTableSpec, capDigest, Digest } from './digest';
import { ToolDefinition } from './types';

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
  const digest = buildDigest('search_wazuh_data', hitsResult(0), def, requestBody);
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
    query: { bool: { filter: [{ range: { '@timestamp': { gte: 'now-90d' } } }] } },
  };
  const digest = buildDigest('search_wazuh_data', hitsResult(0), def, requestBody);
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
  const result = { hits: { total: { value: 1 }, hits: [{ _source: { a: 1 } }] } };
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
    rows.push(findingRow('wazuh-aio-5', 'Rule A', `2025-01-0${i + 1}T00:00:00Z`));
  }
  for (let i = 0; i < 16; i++) {
    rows.push(findingRow('web-prod-01', 'Rule B', `2026-06-${10 + i}T00:00:00Z`));
  }
  for (let i = 0; i < 8; i++) {
    rows.push(findingRow('web-prod-02', 'Rule C', `2026-07-0${i + 1}T00:00:00Z`));
  }
  const result = { hits: { total: { value: 26 }, hits: rows } };
  const digest = buildDigest('get_critical_findings', result, def);

  assert.equal(digest.samples.length, 5, 'samples must stay capped at MAX_SAMPLES');
  assert.ok(digest.breakdown, 'expected a synthesized breakdown');

  const agentBuckets = digest.breakdown!.filter(b => b.agg === 'wazuh.agent.name');
  const ruleBuckets = digest.breakdown!.filter(b => b.agg === 'wazuh.rule.title');
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
  assert.equal(agentBuckets.length + ruleBuckets.length, digest.breakdown!.length);
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
    digest: { sampleColumns: ['key'], breakdownDimensions: ['wazuh.agent.name'] },
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

  const agentBuckets = digest.breakdown!.filter(b => b.agg === 'wazuh_agent_name');
  assert.deepEqual(
    new Map(agentBuckets.map(b => [b.key, b.count])),
    new Map([
      ['web-prod-01', 16],
      ['web-prod-02', 8],
      ['wazuh-aio-5', 2],
    ]),
  );
  const ruleBuckets = digest.breakdown!.filter(b => b.agg === 'wazuh_rule_title');
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
  assert.ok(digest.breakdown, 'expected a synthesized breakdown despite being page-scoped');
  assert.ok(digest.breakdownNote, 'expected a page-only caveat on a truncated synthetic breakdown');
  assert.match(digest.breakdownNote!, /covers only the 8 returned rows/);
  assert.match(digest.breakdownNote!, /not all 26 matching rows/);
  // samplesNote must not instruct the model to trust this same page-scoped breakdown.
  assert.ok(digest.samplesNote);
  assert.equal(/Use counts\/breakdown/.test(digest.samplesNote!), false);
});
