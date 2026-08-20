import assert from 'node:assert/strict';
import { getFieldValuesTool } from './get-field-values';
import { applySafetyValves, checkIndexAllowlist, lintDsl } from '../guardrails';
import { IndexerRequest, ResolvedToolParams } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getFieldValuesTool.buildRequest(params) as IndexerRequest;
}

async function resolve(
  params: Record<string, unknown>,
): Promise<ResolvedToolParams> {
  const result = await getFieldValuesTool.resolveParams!(
    params,
    undefined as never,
    undefined as never,
  );
  assert.equal(result.ok, true);
  return (result as { ok: true; resolved: ResolvedToolParams }).resolved;
}

test("get_field_values: defaults to the field's first known surface with a bounded terms + missing agg", () => {
  const request = build({ field: 'check.result' });
  assert.equal(request.index, 'wazuh-states-sca*');
  assert.deepEqual(request.body.aggs, {
    values: { terms: { field: 'check.result', size: 50 } },
    missing_count: {
      filter: { bool: { must_not: [{ exists: { field: 'check.result' } }] } },
    },
  });
  assert.equal(request.body.size, 0);
});

test(
  'get_field_values: event.category resolves to the events surface (CV-033 fix -- was ' +
    'previously absent from FIELD_LOCATIONS despite being agg-allowlisted)',
  () => {
    const request = build({ field: 'event.category' });
    assert.equal(request.index, 'wazuh-events-v5*');
    assert.deepEqual(
      (request.body.aggs as { values: { terms: Record<string, unknown> } })
        .values.terms,
      { field: 'event.category', size: 50 },
    );
  },
);

test('get_field_values: event.outcome resolves to the events surface (same fix, same reason)', () => {
  const request = build({ field: 'event.outcome' });
  assert.equal(request.index, 'wazuh-events-v5*');
});

test('get_field_values: a time-based family (findings/events) gets a bounded @timestamp range', () => {
  const request = build({
    field: 'wazuh.rule.level',
    time_range_gte: 'now-7d',
    time_range_lte: 'now',
  });
  assert.equal(request.index, 'wazuh-findings-v5*');
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
    },
  });
});

test('get_field_values: a non-time-based family (sca/vulnerabilities/inventory) gets no @timestamp range', () => {
  const request = build({ field: 'vulnerability.severity' });
  assert.equal(request.index, 'wazuh-states-vulnerabilities*');
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_field_values: index_family disambiguates a field that lives on more than one surface', () => {
  const onFindings = build({
    field: 'wazuh.agent.id',
    index_family: 'findings',
  });
  assert.equal(onFindings.index, 'wazuh-findings-v5*');
  const onSca = build({ field: 'wazuh.agent.id', index_family: 'sca' });
  assert.equal(onSca.index, 'wazuh-states-sca*');
});

test('get_field_values: an invalid index_family for the given field throws, listing the valid ones', () => {
  assert.throws(
    () => build({ field: 'check.result', index_family: 'findings' }),
    /Valid surfaces for this field: sca/,
  );
});

test('get_field_values: prefix becomes a fully-escaped, case-expanded, anchored-start terms.include regexp', () => {
  const request = build({ field: 'host.os.name', prefix: 'Ubu' });
  assert.deepEqual(
    (request.body.aggs as Record<string, { terms: { include?: string } }>)
      .values.terms.include,
    '[uU][bB][uU].*',
  );
});

test('get_field_values: an unknown field is rejected with close-match suggestions, never reaching the indexer', () => {
  // A truncated field path (a plausible real typo) is a genuine PREFIX of the real field, so it
  // exercises suggestCloseFields' substring branch deterministically -- unlike an inserted-letter
  // typo (e.g. "leveel"), which shares no contiguous substring or last-segment prefix relation
  // with "level" and would only be reachable through a full fuzzy-distance match, explicitly out
  // of scope for this tool's "bounded, simple prefix match" suggestion mechanism.
  assert.throws(
    () => build({ field: 'wazuh.rule.lev' }),
    /not one of this tool's vetted, bounded-cardinality fields.*wazuh\.rule\.level/s,
  );
});

test(
  'get_field_values: a field with no known FIELD_LOCATIONS entry is rejected even if hypothetically ' +
    'added to the allowlist elsewhere -- this tool has its own closed location map',
  () => {
    assert.throws(
      () => build({ field: 'source.port' }),
      /not one of this tool's vetted, bounded-cardinality fields/,
    );
  },
);

test('get_field_values: field is required', () => {
  assert.throws(() => build({}), /Parameter "field" is required/);
});

test('get_field_values: request passes checkIndexAllowlist, applySafetyValves, and lintDsl', () => {
  for (const params of [
    { field: 'wazuh.rule.level' },
    { field: 'check.result' },
    { field: 'vulnerability.severity' },
    { field: 'host.os.name', prefix: 'linux' },
    { field: 'source.ip', index_family: 'events' },
  ]) {
    const request = build(params);
    assert.equal(checkIndexAllowlist(request.index).ok, true, request.index);
    const valved = applySafetyValves(request.body);
    assert.equal(valved.ok, true);
    if (!valved.ok) {
      continue;
    }
    const lint = lintDsl(valved.body, request.index);
    assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
  }
});

test('get_field_values: tableSpec and digest surface the bucket key/count', () => {
  assert.deepEqual(
    getFieldValuesTool.tableSpec.columns.map(c => c.field),
    ['key', 'doc_count'],
  );
  assert.deepEqual(getFieldValuesTool.digest.sampleColumns, [
    'key',
    'doc_count',
  ]);
});

test(
  'get_field_values: "prefix" longer than the max is rejected with a clear parameter error ' +
    '(code review B9)',
  () => {
    assert.throws(
      () => build({ field: 'check.result', prefix: 'a'.repeat(65) }),
      /Parameter "prefix" is 65 characters long; the maximum is 64/,
    );
  },
);

test(
  'get_field_values: CEO scenario end to end -- "findings for linux" pivots through ' +
    'host.os.platform on the findings surface to the populated wazuh.agent.host.os.platform twin ' +
    '(code review B1, AI/plan/b-review.md P1.1)',
  async () => {
    // Step 1/2 of the scenario: the model asks for host.os.platform ON FINDINGS (previously
    // guardrail-rejected -- FIELD_LOCATIONS only mapped it to inventory_system). It must now
    // succeed, run against the real findings index, stay time-bounded, and expose missing_count so
    // the model can see the field is largely empty there.
    const onFindings = build({
      field: 'host.os.platform',
      index_family: 'findings',
    });
    assert.equal(onFindings.index, 'wazuh-findings-v5*');
    assert.deepEqual(onFindings.body.aggs, {
      values: { terms: { field: 'host.os.platform', size: 50 } },
      missing_count: {
        filter: {
          bool: { must_not: [{ exists: { field: 'host.os.platform' } }] },
        },
      },
    });
    assert.ok(
      'bool' in (onFindings.body.query as Record<string, unknown>) &&
        (onFindings.body.query as { bool: { filter: unknown[] } }).bool.filter
          .length === 1,
      'expected a bounded @timestamp range on the findings surface',
    );
    assert.equal(checkIndexAllowlist(onFindings.index).ok, true);
    const valved = applySafetyValves(onFindings.body);
    assert.equal(valved.ok, true);
    if (valved.ok) {
      assert.equal(lintDsl(valved.body, onFindings.index).ok, true);
    }

    // Step 3 of the scenario: resolveParams' alias hook must surface the POPULATED twin
    // (wazuh.agent.host.os.platform) for this exact field/family combination, via the same note
    // channel get_agent_inventory uses for an inferred agent_id.
    const resolved = await resolve({
      field: 'host.os.platform',
      index_family: 'findings',
    });
    assert.match(resolved.note ?? '', /wazuh\.agent\.host\.os\.platform/);
    assert.match(resolved.note ?? '', /"host\.os\.platform"/);

    // The pivot target itself must now be reachable -- previously blocked by both
    // AGG_FIELD_ALLOWLIST and FIELD_LOCATIONS (the CEO scenario's actual dead end).
    const onTwin = build({
      field: 'wazuh.agent.host.os.platform',
      index_family: 'findings',
    });
    assert.equal(onTwin.index, 'wazuh-findings-v5*');
    assert.deepEqual(onTwin.body.aggs, {
      values: { terms: { field: 'wazuh.agent.host.os.platform', size: 50 } },
      missing_count: {
        filter: {
          bool: {
            must_not: [{ exists: { field: 'wazuh.agent.host.os.platform' } }],
          },
        },
      },
    });
    assert.equal(checkIndexAllowlist(onTwin.index).ok, true);
    const twinValved = applySafetyValves(onTwin.body);
    assert.equal(twinValved.ok, true);
    if (twinValved.ok) {
      assert.equal(lintDsl(twinValved.body, onTwin.index).ok, true);
    }

    // A field/family combination with NO known-unpopulated alias (e.g. the twin field itself, or
    // host.os.platform on its original inventory_system surface) must produce no note -- the alias
    // hook only fires for the specific gap it exists to close.
    const noAliasOnTwin = await resolve({
      field: 'wazuh.agent.host.os.platform',
    });
    assert.equal(noAliasOnTwin.note, undefined);
    const noAliasOnInventory = await resolve({ field: 'host.os.platform' });
    assert.equal(noAliasOnInventory.note, undefined);
  },
);
