import assert from 'node:assert/strict';
import { getThreatIntelComponentsTool } from './get-threat-intel-components';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getThreatIntelComponentsTool.buildRequest(params) as IndexerRequest;
}

const EXPECTED_INDEX: Record<string, string> = {
  decoders: 'wazuh-threatintel-decoders*',
  integrations: 'wazuh-threatintel-integrations*',
  policies: 'wazuh-threatintel-policies*',
  filters: 'wazuh-threatintel-filters*',
  kvdbs: 'wazuh-threatintel-kvdbs*',
};

test('get_threat_intel_components: each component_type maps to its exact index', () => {
  for (const [componentType, index] of Object.entries(EXPECTED_INDEX)) {
    const request = build({ component_type: componentType });
    assert.equal(request.index, index);
  }
});

test('get_threat_intel_components: missing or invalid component_type throws naming the valid values', () => {
  assert.throws(() => build({}), /must be one of/);
  assert.throws(
    () => build({ component_type: 'enrichments' }),
    /must be one of/,
  );
});

test('get_threat_intel_components: enabled defaults to "any" (no filter)', () => {
  const request = build({ component_type: 'decoders' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_threat_intel_components: enabled="enabled"/"disabled" produce the boolean term', () => {
  assert.deepEqual(
    build({ component_type: 'decoders', enabled: 'enabled' }).body.query,
    {
      bool: { filter: [{ term: { 'document.enabled': true } }] },
    },
  );
  assert.deepEqual(
    build({ component_type: 'decoders', enabled: 'disabled' }).body.query,
    {
      bool: { filter: [{ term: { 'document.enabled': false } }] },
    },
  );
});

test('get_threat_intel_components: space adds an exact term filter', () => {
  assert.deepEqual(
    build({ component_type: 'integrations', space: 'draft' }).body.query,
    {
      bool: { filter: [{ term: { 'space.name': 'draft' } }] },
    },
  );
  assert.deepEqual(
    build({
      component_type: 'integrations',
      enabled: 'enabled',
      space: 'custom',
    }).body.query,
    {
      bool: {
        filter: [
          { term: { 'document.enabled': true } },
          { term: { 'space.name': 'custom' } },
        ],
      },
    },
  );
});

// Defect #1: neither tool had ANY name/keyword filter before this fix -- the largest failure
// class in the QA report (Q2/Q9/Q12: "what decoders exist for ssh?"/"which decoder parses sshd
// logs?"/"is there a decoder for apache?" all returned all 345 rows unfiltered). `name` builds a
// should-clause with no leading wildcard (guardrails.ts's lintDsl bans that outright): exact/
// prefix on document.name and document.metadata.title, plus a word match on the analyzed
// document.metadata.description -- live-verified to find the same 5 Apache decoders and the 1
// SSH decoder the QA report's raw wildcard probe found.
test('get_threat_intel_components: name builds a should-clause on name/title (term+prefix) and description (match), no wildcard', () => {
  const request = build({ component_type: 'decoders', name: 'apache' });
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                term: {
                  'document.name': { value: 'apache', case_insensitive: true },
                },
              },
              {
                prefix: {
                  'document.name': { value: 'apache', case_insensitive: true },
                },
              },
              {
                term: {
                  'document.metadata.title': {
                    value: 'apache',
                    case_insensitive: true,
                  },
                },
              },
              {
                prefix: {
                  'document.metadata.title': {
                    value: 'apache',
                    case_insensitive: true,
                  },
                },
              },
              {
                match: {
                  'document.metadata.description': {
                    query: 'apache',
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

// Review finding F1: the description match must use operator "and" so a multi-token name (e.g.
// a decoder's full identifier) does not match on any single token inside a non-scoring,
// `_doc`-sorted `bool.filter` -- live-verified 330 -> 1 hit for "decoder/apache-access/0".
test('get_threat_intel_components: the description match uses operator "and" for multi-token names', () => {
  const request = build({
    component_type: 'decoders',
    name: 'decoder/apache-access/0',
  });
  const shouldClause = (
    request.body.query as { bool: { filter: Record<string, unknown>[] } }
  ).bool.filter[0] as {
    bool: { should: Array<{ match?: Record<string, unknown> }> };
  };
  const matchEntry =
    shouldClause.bool.should[shouldClause.bool.should.length - 1];
  assert.deepEqual(matchEntry.match, {
    'document.metadata.description': {
      query: 'decoder/apache-access/0',
      operator: 'and',
    },
  });
});

test('get_threat_intel_components: name is trimmed and omitted when blank', () => {
  assert.deepEqual(
    build({ component_type: 'decoders', name: '   ' }).body.query,
    { bool: { filter: [] } },
  );
});

test('get_threat_intel_components: an invalid space value is ignored (no filter, no throw)', () => {
  const request = build({
    component_type: 'integrations',
    space: 'not-a-real-space',
  });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_threat_intel_components: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ component_type: 'kvdbs', limit: 9999 }).body.size, 500);
  assert.equal(build({ component_type: 'kvdbs', limit: 0 }).body.size, 1);
});

test('get_threat_intel_components: every produced index passes checkIndexAllowlist and lintDsl', () => {
  for (const componentType of Object.keys(EXPECTED_INDEX)) {
    const request = build({ component_type: componentType });
    assert.equal(
      checkIndexAllowlist(request.index).ok,
      true,
      `${componentType} index rejected by allowlist`,
    );
    const result = lintDsl(request.body, request.index);
    assert.equal(result.ok, true, result.ok ? '' : result.reason);
  }
});

test('get_threat_intel_components: the "Title" column uses document.metadata.title, not document.name', () => {
  // document.metadata.title is present on every component type (policies/integrations/kvdbs
  // included); document.name is absent entirely on policies/integrations and only partially
  // populated on kvdbs, so it must never be the primary display column. Labeled "Title" (not
  // "Name") because that is the field actually backing it.
  const titleColumn = getThreatIntelComponentsTool.tableSpec.columns.find(
    column => column.label === 'Title',
  );
  assert.equal(titleColumn?.field, 'document.metadata.title');
  assert.equal(
    getThreatIntelComponentsTool.tableSpec.columns.some(
      column => column.field === 'document.name',
    ),
    false,
  );
});

test('get_threat_intel_components: table/digest columns stay within the declared _source', () => {
  const source = new Set(
    build({ component_type: 'integrations' }).body._source as string[],
  );
  for (const column of getThreatIntelComponentsTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getThreatIntelComponentsTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});

test('get_threat_intel_components: buildSecurityAnalyticsLink maps each component_type to its real app route', () => {
  const build_ = getThreatIntelComponentsTool.buildSecurityAnalyticsLink;
  assert.deepEqual(build_?.({ component_type: 'decoders' }, 'standard'), {
    label: 'Open in Security Analytics',
    url: '/app/decoders#/decoders?space=standard',
  });
  assert.deepEqual(build_?.({ component_type: 'integrations' }, 'standard'), {
    label: 'Open in Security Analytics',
    url: '/app/sa-integrations#/integrations?space=standard',
  });
  // policies has no dedicated list view -- it reuses the integrations app's Overview tab.
  assert.deepEqual(build_?.({ component_type: 'policies' }, 'custom'), {
    label: 'Open in Security Analytics',
    url: '/app/sa-integrations#/integrations?space=custom',
  });
  assert.deepEqual(build_?.({ component_type: 'filters' }, 'standard'), {
    label: 'Open in Security Analytics',
    url: '/app/sa-integrations#/filters?space=standard&dataSourceId=',
  });
  assert.deepEqual(build_?.({ component_type: 'kvdbs' }, 'test'), {
    label: 'Open in Security Analytics',
    url: '/app/kvdbs#/kvdbs?space=test',
  });
});

// Cross-category tool audit (same bug shape as issue #8913): this tool's own category is
// `security_analytics` (server/tools/router.ts), while get_sca_results -- named here for the
// "you actually want an SCA benchmark" case -- is the separate `sca` category, not guaranteed
// offered on the same turn. Pins the conditional wording so a future edit cannot silently
// reintroduce an unconditional "use get_sca_results instead" naming a tool that may not be
// offered. get_rules stays unconditional since it shares this tool's own category.
test('get_threat_intel_components: names get_sca_results only conditionally on it being offered, not unconditionally', () => {
  const description = getThreatIntelComponentsTool.spec.description;
  assert.match(
    description,
    /if that is what the question needs and get_sca_results is\s+available to you this turn, use that one instead/,
  );
  assert.doesNotMatch(description, /-- for that, use get_sca_results instead/);
  assert.match(description, /Not for rules \(use get_rules\)/);
});
