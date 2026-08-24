import { ToolDefinition } from '../types';
import {
  aggLimitProperty,
  clampAggLimit,
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
 * model computes/narrates the ratio when asked. `check.result` values are confirmed live against
 * a real 5.0 stack to be capitalized -- `"Passed"`/`"Failed"`/`"Not applicable"` -- NOT the
 * lowercase 4.14 values; a lowercase `term` filter here silently matches nothing.
 *
 * Population-disclosure note (issue #8920 item 1): unlike get_sca_checks (a plain hits search
 * until this same issue's fix), this tool already satisfies the invariant by construction --
 * `size: 0` plus a `terms` aggregation on `policy.id` means every per-policy passed/failed/
 * not_applicable count digest.ts's `buildBreakdown` surfaces is computed by OpenSearch over the
 * FULL matched set, never a truncated page. No functional change needed here; see
 * `population-disclosure-coverage.test.ts`, which recognizes this size:0-plus-terms-agg shape as
 * satisfying the invariant by construction.
 */
export const getScaResultsTool: ToolDefinition = {
  spec: {
    name: 'get_sca_results',
    description:
      'Lists Security Configuration Assessment (SCA) benchmark results for one agent — total/' +
      'passed/failed check counts per compliance benchmark (e.g. CIS Ubuntu). Use for "SCA"/' +
      '"configuration assessment"/"compliance policy score" questions about a specific agent. ' +
      'The compliance ratio is passed/(passed+failed). NOT for Security Analytics pipeline ' +
      'policies -- SCA is a per-agent scan result, unrelated to that pipeline configuration; if ' +
      'the question is actually about pipeline policies and get_threat_intel_components (with ' +
      'component_type="policies") is available to you this turn, use that one instead.',
    parameters: objectSchema(
      {
        agent_id: {
          type: 'string',
          description:
            'Numeric Wazuh agent ID, e.g. "003". Optional: omit this for a deictic host ' +
            'reference ("this box"/"this server") with no known id -- the call resolves to the ' +
            'only active agent automatically.',
        },
        limit: aggLimitProperty('SCA policies', 20),
      },
      [],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  // Issue: generic sole-candidate parameter resolution (template: #8913's
  // resolveDeicticAgentParams in get-agent-inventory.ts). A strictly-required `agent_id` measured
  // 0/40 invocations on deictic SCA/compliance questions ("my auditor wants proof of SSH
  // hardening") -- registry.ts attaches the generic resolver (param-resolution.ts) for this
  // entry, resolving `agent_id` against the Manager API's active-agent list when omitted.
  soleCandidateParams: [
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ],
  // Cost-budget class 1 (chat.ts's tool-round budget): this request is `size: 0` --
  // aggregation-only, no hit documents (see this file's own doc comment above).
  costClass: 1,
  buildRequest(params) {
    const agentId = validateAgentId(params.agent_id);
    const limit = clampAggLimit(params.limit, 20);
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
              passed: { filter: { term: { 'check.result': 'Passed' } } },
              failed: { filter: { term: { 'check.result': 'Failed' } } },
              not_applicable: {
                filter: { term: { 'check.result': 'Not applicable' } },
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
