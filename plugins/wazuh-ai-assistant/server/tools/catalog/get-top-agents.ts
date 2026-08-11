import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/** Wire values for the `index` param, mapped to the actual index pattern in `buildRequest`
 * below. Kept as a bare two-value union (not `SECURITY_ANALYTICS_SPACES`-style shared const):
 * this tool is the only caller of this specific vocabulary. */
const INDEX_FAMILIES = ['findings', 'events'] as const;
type IndexFamily = (typeof INDEX_FAMILIES)[number];

function resolveIndexFamily(value: unknown): IndexFamily {
  return value === 'events' ? 'events' : 'findings';
}

/**
 * GA benchmark gap: "find the noisiest/top N agents" had no direct answer -- get_top_rules
 * covers the same "aggregate and rank" shape for rules, but nothing did it for agents, and the
 * escape hatch's `AGG_FIELD_ALLOWLIST` check made a hand-built terms agg on the agent fields the
 * only route, which a weak router/model rarely reaches unassisted.
 *
 * Same shape as `get-top-rules.ts`: a `terms` aggregation on `wazuh.agent.id` (on the guardrail's
 * bounded-bucket-safe allowlist -- see `WAZUH_FIELD.AGENT_ID` in `guardrails.ts`) with a `top_hits`
 * sub-aggregation sampling one `wazuh.agent.name` per bucket, `size: 0` (aggregation-only, no hit
 * documents fetched). `index` selects which timeline family to rank agents over: `findings`
 * (rule-matched detections, the default -- "which agents are triggering the most alerts") or
 * `events` (the raw normalized event stream -- "which agents are generating the most traffic/
 * telemetry", matched or not; see `get-events-by-agent.ts`'s `EVENTS_SCOPE_NOTE` for that
 * distinction). Both families use the identical `wazuh.agent.id`/`wazuh.agent.name` field pair
 * (confirmed in `get-events-by-agent.ts`), so no per-family field branching is needed beyond the
 * index pattern itself. `wazuh-states-*` (package/OS pivots) is intentionally out of scope here:
 * those are current-state snapshots, not an event timeline to rank "noisiest" over.
 *
 * Same sampled-label-falsehood risk as `get-top-rules.ts`'s rule title (issue #8921): an agent can
 * be renamed while keeping the same `wazuh.agent.id` (re-registration, inventory sync, ...), so a
 * bucket's `doc_count` events may not all carry the sampled name. `distinct_names` (a sibling
 * `cardinality` sub-agg on `wazuh.agent.name`) discloses that spread the same way `distinct_titles`
 * does there, rather than asserting a 1:1 exemption that does not actually hold over an agent's
 * lifetime.
 */
export const getTopAgentsTool: ToolDefinition = {
  spec: {
    name: 'get_top_agents',
    description:
      'Aggregates the noisiest/most active agents within a time range, with a sample agent name ' +
      'per agent ID. The name shown is a sample -- one agent id can span more than one name if ' +
      'the agent was renamed; distinct_names gives the spread. The obvious choice for "which ' +
      'agents are noisiest", "top N agents by findings/events", or "most active hosts" ' +
      'questions. Defaults to ranking by rule-matched findings; set index to "events" to rank ' +
      'by raw event/telemetry volume instead.',
    parameters: objectSchema({
      index: {
        type: 'string',
        description:
          'Which timeline to rank agents over: "findings" (rule-matched detections, default) or ' +
          '"events" (the raw normalized event stream, matched or not).',
        enum: [...INDEX_FAMILIES],
      },
      limit: limitProperty(
        'Max number of distinct agents to return (default 10, max 100).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const indexFamily = resolveIndexFamily(optionalStringParam(params.index));
    const limit = clampLimit(params.limit, 10, 100);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index:
        indexFamily === 'events' ? 'wazuh-events-v5*' : 'wazuh-findings-v5*',
      body: {
        query: {
          bool: { filter: [{ range: { '@timestamp': { gte, lte } } }] },
        },
        aggs: {
          top_agents: {
            terms: { field: 'wazuh.agent.id', size: limit },
            aggs: {
              sample_doc: {
                top_hits: { size: 1, _source: ['wazuh.agent.name'] },
              },
              distinct_names: {
                cardinality: { field: 'wazuh.agent.name' },
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
      { field: 'key', label: 'Agent ID' },
      { field: 'doc_count', label: 'Count' },
      { field: 'wazuh.agent.name', label: 'Agent (sample)' },
      { field: 'distinct_names', label: 'Distinct names' },
    ],
  },
  digest: {
    sampleColumns: ['key', 'doc_count', 'wazuh.agent.name', 'distinct_names'],
  },
};
