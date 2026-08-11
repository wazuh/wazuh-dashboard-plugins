import assert from 'node:assert/strict';
import { getTopAgentsTool } from './get-top-agents';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getTopAgentsTool.buildRequest(params) as IndexerRequest;
}

test('get_top_agents: defaults to wazuh-findings-v5* when index is omitted', () => {
  const request = build({});
  assert.equal(request.index, 'wazuh-findings-v5*');
});

test('get_top_agents: index "events" targets wazuh-events-v5*', () => {
  const request = build({ index: 'events' });
  assert.equal(request.index, 'wazuh-events-v5*');
});

test('get_top_agents: an unrecognized index value falls back to findings (fails open, not closed)', () => {
  const request = build({ index: 'states' });
  assert.equal(request.index, 'wazuh-findings-v5*');
});

test('get_top_agents: aggregates by wazuh.agent.id with a top_hits agent-name sample, size 0', () => {
  const request = build({ limit: 5 });
  assert.deepEqual(request.body.aggs, {
    top_agents: {
      terms: { field: 'wazuh.agent.id', size: 5 },
      aggs: {
        sample_doc: {
          top_hits: { size: 1, _source: ['wazuh.agent.name'] },
        },
      },
    },
  });
  assert.equal(request.body.size, 0);
});

function topAgentsTermsSize(request: IndexerRequest): unknown {
  const aggs = request.body.aggs as {
    top_agents: { terms: { size: unknown } };
  };
  return aggs.top_agents.terms.size;
}

test('get_top_agents: clamps limit to the [1, 100] range, defaulting to 10', () => {
  assert.equal(topAgentsTermsSize(build({})), 10);
  assert.equal(topAgentsTermsSize(build({ limit: 9999 })), 100);
  assert.equal(topAgentsTermsSize(build({ limit: 0 })), 1);
});

test('get_top_agents: applies the default 90-day time range when none is given', () => {
  const request = build({});
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } }],
    },
  });
});

test('get_top_agents: request passes checkIndexAllowlist and lintDsl (findings)', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_top_agents: request passes checkIndexAllowlist and lintDsl (events)', () => {
  const request = build({ index: 'events' });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
