import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  validateAgentId,
} from './common';

/**
 * Wazuh 5.0 rewrite: the 4.14 Manager endpoint `GET /sca/{agent_id}`
 * (which returned pre-aggregated per-policy summaries) was REMOVED in 5.0 (returns 404 on 5.0).
 * SCA now lives in the `wazuh-states-sca` Indexer index at CHECK level only (one doc per check;
 * mapping verified against a live 5.0 stack: check.{id,name,result,...}, policy.{id,name,...},
 * wazuh.agent.id), so the per-policy summary this tool exists for must be DERIVED via
 * aggregation: terms on `policy.id` + a top_hits(1) sample for the policy name + one `filter`
 * sub-agg per check.result value. digest.ts's `bucketsToRows` flattens each policy bucket into
 * `{key, doc_count, policy.name, passed, failed, not_applicable}`.
 *
 * Deliberate change vs 4.14: no `score`/`end_scan` columns — 5.0 stores no score field anywhere
 * (the old Manager computed it), and `state.modified_at` is a write-time, not scan-time. Rather
 * than bake in a possibly-wrong formula, the digest carries the raw passed/failed counts and the
 * model computes/narrates the ratio when asked (`result values assumed 'passed'/'failed'/
 * 'not applicable' as on 4.14 — re-verify against real agent data when available`).
 */
export const getScaResultsTool: ToolDefinition = {
  spec: {
    name: 'get_sca_results',
    description:
      'Lists Security Configuration Assessment (SCA) policy results for one agent — total/' +
      'passed/failed check counts per policy. Use for "SCA"/"configuration assessment"/' +
      '"compliance policy score" questions about a specific agent. The compliance ratio is ' +
      'passed/(passed+failed).',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description: 'Numeric Wazuh agent ID, e.g. "003".',
        },
        limit: limitProperty(
          'Max number of SCA policies to return (default 20, max 500).',
        ),
      },
      ['agent_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const limit = clampLimit(params.limit, 20, 500);
    return {
      target: 'indexer',
      index: 'wazuh-states-sca*',
      body: {
        query: { bool: { filter: [{ term: { 'wazuh.agent.id': agentId } }] } },
        aggs: {
          policies: {
            terms: { field: 'policy.id', size: limit },
            aggs: {
              policy_sample: {
                top_hits: { size: 1, _source: ['policy.name'] },
              },
              passed: { filter: { term: { 'check.result': 'passed' } } },
              failed: { filter: { term: { 'check.result': 'failed' } } },
              not_applicable: {
                filter: { term: { 'check.result': 'not applicable' } },
              },
            },
          },
        },
        size: 0,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'key', label: 'Policy ID' },
      { field: 'policy.name', label: 'Policy' },
      { field: 'doc_count', label: 'Checks' },
      { field: 'passed', label: 'Passed' },
      { field: 'failed', label: 'Failed' },
      { field: 'not_applicable', label: 'N/A' },
    ],
  },
  digest: {
    sampleColumns: [
      'key',
      'policy.name',
      'doc_count',
      'passed',
      'failed',
      'not_applicable',
    ],
  },
};
