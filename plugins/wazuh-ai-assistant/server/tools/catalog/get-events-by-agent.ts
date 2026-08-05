import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * Typed tool over `wazuh-events-v5*` — the RAW normalized event stream, matched or not (issue:
 * "Add a typed events tool over wazuh-events-v5"). Every other search-shaped tool in this catalog
 * targets `wazuh-findings-v5*` (rule-matched detections only); this is the mirror image, and the
 * only typed (non-escape-hatch) way to answer "everything that happened on agent X" or "how many
 * raw events vs. findings fired" without the model hand-writing DSL via search_wazuh_data.
 *
 * FIELD NAME, VERIFIED (not assumed): the events index's agent identifier is plain ECS
 * `agent.name`, NOT `wazuh.agent.name` (the findings-index field of the same name). Evidence:
 * `eval/seed_uat_dataset.py`'s `bulk_events()` — the QA harness's own events-index seeder — builds
 * each document as `{"agent": {"id": aid, "name": aname}, "event": {...}, ...}`, explicitly
 * commented "Deliberately minimal-but-valid ECS" (bare `agent.*`, no `wazuh.*` enrichment,
 * because no rule has matched yet to add it). Its `summarise()` helper's field-level terms
 * aggregation on `wazuh.agent.name` runs ONLY against the findings index
 * (`req("POST", f"/{FINDINGS}/_search", ...)`), never against `wazuh-events-v5-security` — the
 * events count there is a bare `_count`, with no field-level query anywhere in that file. No other
 * template/mapping reference to the events index's agent field exists in this repo. If this
 * assumption is wrong for a live 5.0 cluster, `wazuh.agent.name` (the findings-index spelling)
 * would be the first fallback to try — flag this to QA for a live-cluster field-caps check before
 * relying on it broadly.
 *
 * Mirrors `get_findings_by_time`'s/`search_findings_by_agent`'s parameter shape (agent, time
 * range, limit) and `common.ts` helper usage, but `agent_name` is OPTIONAL here — unlike the
 * findings tools' required `agent_name` — so "everything that happened in the last hour" (no named
 * agent) is directly expressible too, which is exactly the reproduction case the issue records.
 */
export const EVENTS_SCOPE_NOTE =
  'Covers ALL normalized events, matched or not (the raw event/telemetry stream) -- for ' +
  'rule-matched detections specifically, use the findings tools (get_findings_by_time, ' +
  'search_findings_by_agent, etc.) instead.';

export const getEventsByAgentTool: ToolDefinition = {
  spec: {
    name: 'get_events_by_agent',
    description:
      'Searches the raw normalized event stream, most recent first, optionally scoped to one ' +
      `named agent (host/machine/endpoint). ${EVENTS_SCOPE_NOTE} Use for "everything that ` +
      'happened on/in the last N hours" questions, or to check whether events exist at all when a ' +
      'findings-tool search returned 0 rows.',
    parameters: objectSchema({
      agent_name: {
        type: 'string',
        description:
          'Optional exact agent name to filter by. Omit to search across all agents.',
      },
      limit: limitProperty(
        'Max number of events to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentName = optionalStringParam(params.agent_name);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (agentName) {
      filter.push({ term: { 'agent.name': agentName } });
    }
    return {
      target: 'indexer',
      index: 'wazuh-events-v5*',
      body: {
        query: { bool: { filter } },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: '@timestamp', label: 'Time' },
      { field: 'agent.name', label: 'Agent' },
      { field: 'event.category', label: 'Category' },
      { field: 'event.action', label: 'Action' },
      { field: 'event.outcome', label: 'Outcome' },
    ],
    rowFields: ['agent.id', 'event.module'],
  },
  digest: {
    sampleColumns: [
      '@timestamp',
      'agent.name',
      'event.category',
      'event.action',
      'event.outcome',
    ],
  },
};
