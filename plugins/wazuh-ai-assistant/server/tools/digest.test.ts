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
